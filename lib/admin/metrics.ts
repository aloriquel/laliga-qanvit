import { createServiceClient } from "@/lib/supabase/server";

export async function getMetricsSummary() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("metrics_summary")
    .select("*")
    .maybeSingle();
  return data;
}

export async function refreshMetricsSummary() {
  const supabase = createServiceClient();
  await supabase.rpc("refresh_metrics_summary" as never);
}

export async function getPendingCounts() {
  const supabase = createServiceClient();
  const [apps, deckErrors, appeals, drafts] = await Promise.all([
    supabase
      .from("ecosystem_organizations")
      .select("id", { count: "exact", head: true })
      .eq("is_verified", false),
    supabase
      .from("decks")
      .select("id", { count: "exact", head: true })
      .eq("status", "error"),
    supabase
      .from("evaluation_appeals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
  ]);
  return {
    applications: apps.count ?? 0,
    deckErrors: deckErrors.count ?? 0,
    appeals: appeals.count ?? 0,
    challengeDrafts: drafts.count ?? 0,
  };
}

export async function getLLMCostTrend() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("evaluations")
    .select("created_at, cost_estimate_usd, tokens_input, tokens_output, evaluator_model, latency_ms")
    .gte("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString())
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getWeeklyGrowth() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("startups")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString())
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getCohortRetention(weeksBack = 12) {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("get_cohort_retention", { weeks_back: weeksBack });
  return data ?? [];
}

export async function getDivisionVerticalHeatmap() {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("get_division_vertical_heatmap");
  return data ?? [];
}
