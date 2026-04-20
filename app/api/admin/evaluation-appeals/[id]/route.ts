import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, division, vertical, notes, evalId } = await req.json() as {
    action: "override" | "rerun" | "reject";
    division?: string;
    vertical?: string;
    notes?: string;
    evalId?: string;
  };

  const service = createServiceClient();
  const appealId = params.id;
  const now = new Date().toISOString();

  if (action === "override") {
    if (evalId && division && vertical) {
      const { data: ev } = await service.from("evaluations").select("startup_id").eq("id", evalId).single();
      await service.from("evaluations").update({ assigned_division: division as never, assigned_vertical: vertical as never }).eq("id", evalId);
      if (ev) {
        await service.from("startups").update({ current_division: division as never, current_vertical: vertical as never }).eq("id", ev.startup_id);
      }
    }
    await service.from("evaluation_appeals").update({ status: "accepted", resolved_by: user.id, resolution_notes: notes ?? null, resolved_at: now }).eq("id", appealId);
    await auditAction({ adminId: user.id, actionType: "appeal_accepted_override", targetType: "evaluation_appeals", targetId: appealId, payload: { division, vertical }, reason: notes });
    return NextResponse.json({ ok: true });
  }

  if (action === "rerun") {
    if (evalId) {
      const { data: ev } = await service.from("evaluations").select("deck_id").eq("id", evalId).single();
      if (ev) await service.from("decks").update({ status: "pending" as never }).eq("id", ev.deck_id);
    }
    await service.from("evaluation_appeals").update({ status: "accepted", resolved_by: user.id, resolution_notes: notes ?? null, resolved_at: now }).eq("id", appealId);
    await auditAction({ adminId: user.id, actionType: "appeal_accepted_rerun", targetType: "evaluation_appeals", targetId: appealId, reason: notes });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await service.from("evaluation_appeals").update({ status: "rejected", resolved_by: user.id, resolution_notes: notes ?? null, resolved_at: now }).eq("id", appealId);
    await auditAction({ adminId: user.id, actionType: "appeal_rejected", targetType: "evaluation_appeals", targetId: appealId, reason: notes });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
