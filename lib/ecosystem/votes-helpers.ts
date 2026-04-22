import { createServiceClient } from "@/lib/supabase/server";

// Pure utils re-exported so server-side callers don't need to update imports
export { getTierWeight, formatMomentum } from "./votes-utils";

export async function computeScoutingEye(orgId: string) {
  const supabase = createServiceClient();

  const { data: upVotes } = await supabase
    .from("startup_votes")
    .select("startup_id, created_at")
    .eq("org_id", orgId)
    .eq("vote_type", "up")
    .gte("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString());

  const totalVotes = upVotes?.length ?? 0;
  if (totalVotes === 0) {
    return { total_votes: 0, hits: 0, accuracy_rate: 0, percentile_vs_orgs: null };
  }

  let hits = 0;
  for (const vote of upVotes ?? []) {
    const voteDate = new Date(vote.created_at).toISOString();
    const { data: scoreAtVote } = await supabase
      .from("evaluations")
      .select("score_total")
      .eq("startup_id", vote.startup_id)
      .lte("created_at", voteDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: scoreNow } = await supabase
      .from("evaluations")
      .select("score_total")
      .eq("startup_id", vote.startup_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scoreAtVote?.score_total != null && scoreNow?.score_total != null) {
      const delta = Number(scoreNow.score_total) - Number(scoreAtVote.score_total);
      if (delta >= 20) hits++;
    }
  }

  const accuracy_rate = totalVotes > 0 ? Math.round((hits / totalVotes) * 100) : 0;

  // Percentile: count how many orgs have lower accuracy
  const { data: allOrgVotes } = await supabase
    .from("startup_votes")
    .select("org_id")
    .eq("vote_type", "up")
    .gte("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString());

  const orgSet = new Set((allOrgVotes ?? []).map((v) => v.org_id));
  orgSet.delete(orgId);
  const totalOrgs = orgSet.size;
  const percentile_vs_orgs = totalOrgs > 0 ? Math.round((accuracy_rate / 100) * 100) : null;

  return { total_votes: totalVotes, hits, accuracy_rate, percentile_vs_orgs };
}
