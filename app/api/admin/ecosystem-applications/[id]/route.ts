import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, reason, orgName } = await req.json() as {
    action: "approve" | "reject" | "info";
    reason?: string;
    orgName?: string;
  };

  const service = createServiceClient();
  const orgId = params.id;

  if (action === "approve") {
    await service.from("ecosystem_organizations").update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    }).eq("id", orgId);

    await auditAction({ adminId: user.id, actionType: "org_approved", targetType: "ecosystem_organizations", targetId: orgId, payload: { orgName } });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await service.from("ecosystem_organizations").delete().eq("id", orgId);
    await auditAction({ adminId: user.id, actionType: "org_rejected", targetType: "ecosystem_organizations", targetId: orgId, payload: { orgName, reason } });
    return NextResponse.json({ ok: true });
  }

  if (action === "info") {
    await auditAction({ adminId: user.id, actionType: "org_info_requested", targetType: "ecosystem_organizations", targetId: orgId, payload: { orgName } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
