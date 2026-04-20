import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, reason } = await req.json() as { action: "hide" | "restore" | "rerun"; reason?: string };
  const service = createServiceClient();
  const startupId = params.id;

  if (action === "hide") {
    await service.from("startups").update({ is_public: false }).eq("id", startupId);
    await auditAction({ adminId: user.id, actionType: "startup_hidden", targetType: "startups", targetId: startupId, reason });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    await service.from("startups").update({ is_public: true }).eq("id", startupId);
    await auditAction({ adminId: user.id, actionType: "startup_restored", targetType: "startups", targetId: startupId });
    return NextResponse.json({ ok: true });
  }

  if (action === "rerun") {
    const { data: latestDeck } = await service
      .from("decks")
      .select("id")
      .eq("startup_id", startupId)
      .eq("status", "evaluated")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestDeck) {
      await service.from("decks").update({ status: "pending" as never }).eq("id", latestDeck.id);
    }
    await auditAction({ adminId: user.id, actionType: "startup_rerun_forced", targetType: "startups", targetId: startupId, reason });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
