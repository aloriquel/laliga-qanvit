import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FN_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = new Date().toISOString();

  // Fetch all active challenges
  const { data: challenges, error: challengesErr } = await supabase
    .from("challenges")
    .select("id, challenge_type, target_vertical, target_division, prize_structure")
    .eq("status", "active");

  if (challengesErr) {
    console.error("[challenge-progress-updater] fetch challenges:", challengesErr.message);
    return new Response(JSON.stringify({ error: challengesErr.message }), { status: 500 });
  }

  if (!challenges?.length) {
    return new Response(JSON.stringify({ ok: true, updated: 0 }));
  }

  let updated = 0;

  for (const challenge of challenges) {
    let query = supabase
      .from("startups")
      .select("id, owner_id, ecosystems(organization_id)")
      .eq("is_public", true);

    if (challenge.target_vertical) {
      query = query.eq("vertical", challenge.target_vertical);
    }
    if (challenge.target_division) {
      query = query.eq("division", challenge.target_division);
    }

    const { data: startups } = await query;
    if (!startups?.length) continue;

    const startupIds = startups.map((s) => s.id);

    // Get latest score for each startup
    const { data: evals } = await supabase
      .from("evaluations")
      .select("startup_id, total_score")
      .in("startup_id", startupIds)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (!evals?.length) continue;

    // De-duplicate: keep latest eval per startup
    const scoreMap = new Map<string, number>();
    for (const e of evals) {
      if (!scoreMap.has(e.startup_id)) {
        scoreMap.set(e.startup_id, e.total_score ?? 0);
      }
    }

    const ranked = [...scoreMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([startup_id, score], idx) => ({ startup_id, score, rank: idx + 1 }));

    // Upsert challenge_progress
    for (const entry of ranked) {
      await supabase.from("challenge_progress").upsert(
        {
          challenge_id: challenge.id,
          startup_id: entry.startup_id,
          current_score: entry.score,
          rank_position: entry.rank,
          updated_at: now,
        },
        { onConflict: "challenge_id,startup_id" }
      );
    }

    updated++;
  }

  console.log(`[challenge-progress-updater] updated ${updated} challenges`);
  return new Response(JSON.stringify({ ok: true, updated }));
});
