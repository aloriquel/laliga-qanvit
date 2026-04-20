import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, points, reason } = await req.json() as {
    action: "revoke" | "points";
    points?: number;
    reason: string;
  };

  const service = createServiceClient();
  const orgId = params.id;

  if (action === "revoke") {
    await service.from("ecosystem_organizations").update({ is_verified: false }).eq("id", orgId);
    await auditAction({ adminId: user.id, actionType: "org_revoked", targetType: "ecosystem_organizations", targetId: orgId, reason });
    return NextResponse.json({ ok: true });
  }

  if (action === "points" && points !== undefined) {
    await service.from("ecosystem_points_log").insert({
      org_id: orgId,
      event_type: points > 0 ? "admin_grant" : "admin_revoke",
      points,
      notes: reason,
      granted_by: user.id,
    });
    await auditAction({ adminId: user.id, actionType: "org_points_adjusted", targetType: "ecosystem_organizations", targetId: orgId, payload: { points }, reason });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
