import { createServiceClient } from "@/lib/supabase/server";
import MetricsTabs from "@/components/admin/MetricsTabs";
import { getMetricsSummary, getCohortRetention, getDivisionVerticalHeatmap, getLLMCostTrend, getWeeklyGrowth } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const [summary, cohorts, heatmap, costTrend, weeklyGrowth] = await Promise.all([
    getMetricsSummary(),
    getCohortRetention(12),
    getDivisionVerticalHeatmap(),
    getLLMCostTrend(),
    getWeeklyGrowth(),
  ]);

  const supabase = createServiceClient();
  const { data: budgetSetting } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "llm_budget_monthly_usd")
    .maybeSingle();

  const monthlyBudget = Number((budgetSetting?.value as number | null) ?? 500);

  return (
    <div className="space-y-6">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Métricas</h1>
      <MetricsTabs
        summary={summary}
        cohorts={cohorts}
        heatmap={heatmap}
        costTrend={costTrend}
        weeklyGrowth={weeklyGrowth}
        monthlyBudget={monthlyBudget}
      />
    </div>
  );
}
