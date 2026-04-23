import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  isFundingStage,
  getDivisionFromFundingStage,
  type FundingStage,
} from "@/lib/funding-stage";

export async function PATCH(req: NextRequest) {
  const prefix = "[startup-funding-stage]";
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { funding_stage, is_raising } = body as {
    funding_stage?: unknown;
    is_raising?: unknown;
  };

  // Validate
  if (funding_stage !== null && funding_stage !== undefined && !isFundingStage(funding_stage)) {
    return NextResponse.json(
      { error: `Fase no válida. Valores permitidos: pre_seed, seed, series_a, series_b, series_c, series_d_plus, bootstrapped` },
      { status: 422 }
    );
  }
  if (is_raising !== undefined && typeof is_raising !== "boolean") {
    return NextResponse.json({ error: "is_raising debe ser boolean" }, { status: 422 });
  }

  // Ownership check + current division
  const { data: startup } = await supabase
    .from("startups")
    .select("id, current_division")
    .eq("owner_id", user.id)
    .single();

  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });

  const stage = (funding_stage ?? null) as FundingStage | null;

  // Determine new division
  let newDivision: string | null = startup.current_division;
  if (stage !== null) {
    const mapped = getDivisionFromFundingStage(stage);
    // For bootstrapped: respect existing growth/elite (evaluator promoted them)
    if (
      stage === "bootstrapped" &&
      startup.current_division &&
      ["growth", "elite"].includes(startup.current_division)
    ) {
      newDivision = startup.current_division;
    } else {
      newDivision = mapped;
    }
  }

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    funding_stage: stage,
    funding_stage_inferred: false,
  };
  if (stage !== null) {
    updatePayload.current_division = newDivision;
  }
  if (is_raising !== undefined) {
    updatePayload.is_raising = is_raising;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from("startups")
    .update(updatePayload)
    .eq("id", startup.id);

  if (dbErr) {
    console.error(`${prefix} DB update failed:`, dbErr.message);
    return NextResponse.json({ error: "Error al guardar la fase." }, { status: 500 });
  }

  console.log(`${prefix} Funding stage updated for ${startup.id}: ${stage}, division: ${newDivision}`);

  // Refresh league standings + ISR cache
  const service = createServiceClient();
  await service.rpc("admin_refresh_league_standings");
  revalidatePath("/liga");

  return NextResponse.json({
    funding_stage: stage,
    division: newDivision,
    is_raising: is_raising ?? undefined,
  });
}
