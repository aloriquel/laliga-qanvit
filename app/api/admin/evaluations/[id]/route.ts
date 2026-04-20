import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, division, vertical, reason, startupId } = await req.json() as {
    action: "override" | "rerun" | "calibration" | "delete";
    division?: string;
    vertical?: string;
    reason?: string;
    startupId?: string;
  };

  const service = createServiceClient();
  const evalId = params.id;

  if (action === "override") {
    if (!division || !vertical || !reason) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await service.from("evaluations").update({
      assigned_division: division as never,
      assigned_vertical: vertical as never,
    }).eq("id", evalId);

    if (startupId) {
      await service.from("startups").update({
        current_division: division as never,
        current_vertical: vertical as never,
      }).eq("id", startupId);
    }

    await auditAction({ adminId: user.id, actionType: "evaluation_overridden", targetType: "evaluations", targetId: evalId, payload: { division, vertical }, reason });
    return NextResponse.json({ ok: true });
  }

  if (action === "rerun") {
    const { data: ev } = await service.from("evaluations").select("deck_id").eq("id", evalId).single();
    if (ev) {
      await service.from("decks").update({ status: "pending" as never }).eq("id", ev.deck_id);
    }
    await auditAction({ adminId: user.id, actionType: "evaluation_rerun", targetType: "evaluations", targetId: evalId, reason });
    return NextResponse.json({ ok: true });
  }

  if (action === "calibration") {
    const { data: ev } = await service.from("evaluations").select("is_calibration_sample").eq("id", evalId).single();
    const newVal = !(ev as { is_calibration_sample?: boolean } | null)?.is_calibration_sample;
    await service.from("evaluations").update({ is_calibration_sample: newVal } as never).eq("id", evalId);
    await auditAction({ adminId: user.id, actionType: "evaluation_calibration_flagged", targetType: "evaluations", targetId: evalId, payload: { is_calibration_sample: newVal } });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await service.from("evaluations").delete().eq("id", evalId);
    await auditAction({ adminId: user.id, actionType: "evaluation_deleted", targetType: "evaluations", targetId: evalId, reason });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
