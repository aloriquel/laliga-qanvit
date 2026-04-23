import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isFundingStage, getDivisionFromFundingStage } from "@/lib/funding-stage";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    action: string;
    override_stage?: string;
    admin_notes?: string;
  };

  const { action, override_stage, admin_notes } = body;
  const validActions = ["confirm_as_declared", "override", "dismiss"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 422 });
  }
  if (action === "override" && (!override_stage || !isFundingStage(override_stage))) {
    return NextResponse.json({ error: "override_stage inválido" }, { status: 422 });
  }

  const service = createServiceClient();

  // Fetch discrepancy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: discrepancy } = await (service as any)
    .from("admin_evaluator_discrepancies")
    .select("id, startup_id, status")
    .eq("id", params.id)
    .single();

  if (!discrepancy) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (discrepancy.status !== "pending") {
    return NextResponse.json({ error: "Ya procesada" }, { status: 409 });
  }

  const newStatus =
    action === "confirm_as_declared" ? "confirmed_as_declared" :
    action === "override"            ? "overridden_by_admin" :
    "dismissed";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (service as any)
    .from("admin_evaluator_discrepancies")
    .update({
      status: newStatus,
      admin_notes: admin_notes ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // If override: update startup's funding_stage + current_division
  if (action === "override" && override_stage && isFundingStage(override_stage)) {
    const newDivision = getDivisionFromFundingStage(override_stage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from("startups")
      .update({
        funding_stage: override_stage,
        funding_stage_inferred: false,
        current_division: newDivision,
      })
      .eq("id", discrepancy.startup_id);

    await service.rpc("admin_refresh_league_standings");
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
