import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FN_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";

type ObjectiveType =
  | "referred_in_vertical"
  | "referred_in_region"
  | "referred_top10"
  | "validations_in_vertical";

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = new Date().toISOString();

  const { data: challenges, error: challengesErr } = await supabase
    .from("challenges")
    .select("id, objective_type, objective_params, active_starts_at")
    .eq("status", "active");

  if (challengesErr) {
    console.error("[challenge-progress-updater] fetch challenges:", challengesErr.message);
    return new Response(JSON.stringify({ error: challengesErr.message }), { status: 500 });
  }

  if (!challenges?.length) {
    return new Response(JSON.stringify({ ok: true, updated: 0 }));
  }

  let updated = 0;
  const errors: string[] = [];

  for (const challenge of challenges) {
    try {
      const params = (challenge.objective_params ?? {}) as Record<string, unknown>;
      const sinceDate = challenge.active_starts_at ?? new Date(0).toISOString();

      const orgCounts = await computeOrgCounts(
        supabase,
        challenge.objective_type as ObjectiveType,
        params,
        sinceDate,
      );

      if (orgCounts.size === 0) {
        updated++;
        continue;
      }

      const rows = [...orgCounts.entries()].map(([org_id, count]) => ({
        challenge_id: challenge.id,
        org_id,
        count,
        last_updated_at: now,
      }));

      const { error: upsertErr } = await supabase
        .from("challenge_progress")
        .upsert(rows, { onConflict: "challenge_id,org_id" });

      if (upsertErr) {
        console.error(`[challenge-progress-updater] upsert ${challenge.id}:`, upsertErr.message);
        errors.push(challenge.id);
      } else {
        updated++;
        console.log(JSON.stringify({
          step: "challenge_updated",
          challenge_id: challenge.id,
          objective_type: challenge.objective_type,
          orgs: orgCounts.size,
        }));
      }
    } catch (err) {
      console.error(`[challenge-progress-updater] challenge ${challenge.id}:`, String(err));
      errors.push(challenge.id);
    }
  }

  console.log(`[challenge-progress-updater] updated ${updated}/${challenges.length} challenges`);
  return new Response(
    JSON.stringify({ ok: errors.length === 0, updated, errors }),
    { headers: { "Content-Type": "application/json" } },
  );
});

async function computeOrgCounts(
  supabase: SupabaseClient,
  objectiveType: ObjectiveType,
  params: Record<string, unknown>,
  sinceDate: string,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  switch (objectiveType) {
    case "referred_in_vertical": {
      const vertical = params.vertical as string | undefined;
      if (!vertical) break;

      const { data, error } = await supabase
        .from("startups")
        .select("referred_by_org_id")
        .eq("current_vertical", vertical)
        .not("referred_by_org_id", "is", null)
        .gte("created_at", sinceDate);

      if (error) { console.error("[referred_in_vertical]", error.message); break; }

      for (const row of data ?? []) {
        const org = row.referred_by_org_id as string;
        counts.set(org, (counts.get(org) ?? 0) + 1);
      }
      break;
    }

    case "referred_in_region": {
      const region = params.region as string | undefined;
      if (!region) break;

      const { data, error } = await supabase
        .from("startups")
        .select("referred_by_org_id, location_region")
        .not("referred_by_org_id", "is", null)
        .ilike("location_region", `%${region}%`)
        .gte("created_at", sinceDate);

      if (error) { console.error("[referred_in_region]", error.message); break; }

      for (const row of data ?? []) {
        const org = row.referred_by_org_id as string;
        counts.set(org, (counts.get(org) ?? 0) + 1);
      }
      break;
    }

    case "referred_top10": {
      const n = (params.n as number | undefined) ?? 10;

      const { data: topStandings, error: rankErr } = await supabase
        .from("league_standings")
        .select("startup_id")
        .order("rank_national", { ascending: true })
        .limit(n);

      if (rankErr) { console.error("[referred_top10]", rankErr.message); break; }
      if (!topStandings?.length) break;

      const topIds = topStandings.map((s) => s.startup_id as string);

      const { data: referred, error: refErr } = await supabase
        .from("startups")
        .select("referred_by_org_id")
        .in("id", topIds)
        .not("referred_by_org_id", "is", null);

      if (refErr) { console.error("[referred_top10] startups query:", refErr.message); break; }

      for (const row of referred ?? []) {
        const org = row.referred_by_org_id as string;
        counts.set(org, (counts.get(org) ?? 0) + 1);
      }
      break;
    }

    case "validations_in_vertical": {
      const vertical = params.vertical as string | undefined;
      if (!vertical) break;

      // Step 1: startups in target vertical
      const { data: verticalStartups, error: vsErr } = await supabase
        .from("startups")
        .select("id")
        .eq("current_vertical", vertical);

      if (vsErr) { console.error("[validations_in_vertical] startups:", vsErr.message); break; }
      if (!verticalStartups?.length) break;

      const startupIds = verticalStartups.map((s) => s.id as string);

      // Step 2: evaluations for those startups
      const { data: evals, error: evErr } = await supabase
        .from("evaluations")
        .select("id")
        .in("startup_id", startupIds);

      if (evErr) { console.error("[validations_in_vertical] evals:", evErr.message); break; }
      if (!evals?.length) break;

      const evalIds = evals.map((e) => e.id as string);

      // Step 3: count validations per org for those evaluations since challenge start
      const { data: validations, error: valErr } = await supabase
        .from("feedback_validations")
        .select("org_id")
        .in("evaluation_id", evalIds)
        .gte("created_at", sinceDate);

      if (valErr) { console.error("[validations_in_vertical] validations:", valErr.message); break; }

      for (const row of validations ?? []) {
        const org = row.org_id as string;
        counts.set(org, (counts.get(org) ?? 0) + 1);
      }
      break;
    }
  }

  return counts;
}
