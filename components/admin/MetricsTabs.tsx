"use client";

import { useState } from "react";

type CohortRow = { cohort: string; cohort_size: number; retention_w1: number; retention_w4: number; retention_w8: number; retention_w12: number };
type HeatmapRow = { division: string; vertical: string; startup_count: number; avg_score: number };
type CostRow = { created_at: string; cost_estimate_usd: number | null; tokens_input: number | null; tokens_output: number | null; evaluator_model: string; latency_ms: number | null };
type GrowthRow = { created_at: string };
type Summary = {
  startups_with_score?: number | null;
  orgs_verified?: number | null;
  decks_evaluated_total?: number | null;
  decks_evaluated_7d?: number | null;
  decks_error_7d?: number | null;
  pipeline_success_rate_7d?: number | null;
  total_cost_usd?: number | null;
  cost_usd_7d?: number | null;
  cost_usd_30d?: number | null;
  avg_cost_per_eval_30d?: number | null;
  degraded_evals_30d?: number | null;
  avg_latency_ms_7d?: number | null;
  refreshed_at?: string | null;
} | null;

const DIVISIONS = ["ideation", "seed", "growth", "elite"] as const;
const VERTICALS = ["deeptech_ai", "robotics_automation", "mobility", "energy_cleantech", "agrifood", "healthtech_medtech", "industrial_manufacturing", "space_aerospace", "materials_chemistry", "cybersecurity"] as const;

function weekBucket(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export default function MetricsTabs({
  summary,
  cohorts,
  heatmap,
  costTrend,
  weeklyGrowth,
  monthlyBudget,
}: {
  summary: Summary;
  cohorts: CohortRow[];
  heatmap: HeatmapRow[];
  costTrend: CostRow[];
  weeklyGrowth: GrowthRow[];
  monthlyBudget: number;
}) {
  const [tab, setTab] = useState<"overview" | "cohorts" | "costs">("overview");

  // Precompute weekly growth buckets
  const weeklyMap = weeklyGrowth.reduce<Record<string, number>>((acc, s) => {
    const w = weekBucket(s.created_at);
    acc[w] = (acc[w] ?? 0) + 1;
    return acc;
  }, {});
  const weeklyKeys = Object.keys(weeklyMap).sort().slice(-12);

  // Cost per week
  const costMap = costTrend.reduce<Record<string, number>>((acc, e) => {
    const w = weekBucket(e.created_at);
    acc[w] = (acc[w] ?? 0) + Number(e.cost_estimate_usd ?? 0);
    return acc;
  }, {});
  const costKeys = Object.keys(costMap).sort().slice(-8);

  // 7d cost trend for forecast
  const last7d = costTrend.filter((e) => new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 3600 * 1000));
  const cost7d = last7d.reduce((s, e) => s + Number(e.cost_estimate_usd ?? 0), 0);
  const forecastMonthly = (cost7d / 7) * 30;
  const forecast2x = forecastMonthly * 2;
  const forecast3x = forecastMonthly * 3;

  // Latency percentiles (naive)
  const latencies = costTrend.map((e) => e.latency_ms ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)] ?? 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;

  // Model cost breakdown
  const modelCosts = costTrend.reduce<Record<string, { cost: number; tokens_in: number; tokens_out: number }>>((acc, e) => {
    const m = e.evaluator_model ?? "unknown";
    if (!acc[m]) acc[m] = { cost: 0, tokens_in: 0, tokens_out: 0 };
    acc[m].cost += Number(e.cost_estimate_usd ?? 0);
    acc[m].tokens_in += e.tokens_input ?? 0;
    acc[m].tokens_out += e.tokens_output ?? 0;
    return acc;
  }, {});

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "cohorts" as const, label: "Cohortes" },
    { key: "costs" as const, label: "LLM Costs" },
  ];

  return (
    <>
      <div className="flex gap-1 border-b border-border-soft mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-body text-sm border-b-2 transition-colors ${tab === t.key ? "border-brand-salmon text-brand-navy font-semibold" : "border-transparent text-ink-secondary hover:text-brand-navy"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Startups con score", value: summary?.startups_with_score ?? 0 },
              { label: "Orgs verificadas", value: summary?.orgs_verified ?? 0 },
              { label: "Decks evaluados", value: summary?.decks_evaluated_total ?? 0 },
              { label: "Éxito pipeline (7d)", value: `${summary?.pipeline_success_rate_7d ?? 0}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-border-soft rounded-2xl p-5">
                <p className="font-sora text-3xl font-bold text-brand-navy">{String(stat.value)}</p>
                <p className="font-body text-sm text-ink-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* División × Vertical heatmap */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-sora font-semibold text-brand-navy mb-4">Heatmap División × Vertical</h3>
            <div className="overflow-x-auto">
              <table className="text-xs font-body">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-ink-secondary font-medium w-32">División</th>
                    {VERTICALS.map((v) => (
                      <th key={v} className="px-2 py-1 text-center text-ink-secondary font-medium" style={{ writingMode: "vertical-rl", maxWidth: 32 }}>
                        {v.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIVISIONS.map((div) => (
                    <tr key={div}>
                      <td className="px-2 py-1 font-semibold text-brand-navy capitalize">{div}</td>
                      {VERTICALS.map((vert) => {
                        const cell = heatmap.find((h) => h.division === div && h.vertical === vert);
                        const count = cell?.startup_count ?? 0;
                        const intensity = count === 0 ? 0 : Math.min(count / 10, 1);
                        return (
                          <td key={vert} className="px-2 py-1 text-center rounded"
                            style={{ backgroundColor: count > 0 ? `rgba(244, 169, 170, ${0.1 + intensity * 0.9})` : "transparent" }}>
                            {count > 0 ? count : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly growth chart */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-sora font-semibold text-brand-navy mb-4">Startups nuevas por semana (12w)</h3>
            <div className="flex items-end gap-2 h-32">
              {weeklyKeys.map((w) => {
                const val = weeklyMap[w] ?? 0;
                const max = Math.max(...weeklyKeys.map((k) => weeklyMap[k] ?? 0), 1);
                return (
                  <div key={w} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-brand-salmon/60 rounded-t" style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? 4 : 0 }} title={`${val} startups`} />
                    <span className="text-xs text-ink-secondary" style={{ writingMode: "vertical-rl" }}>{w.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "cohorts" && (
        <div className="space-y-6">
          <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border-soft bg-brand-lavender/50">
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Cohorte</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Tamaño</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">W1</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">W4</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">W8</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">W12</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {cohorts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-secondary">Sin datos de cohortes aún.</td></tr>
                ) : cohorts.map((c) => (
                  <tr key={c.cohort} className="hover:bg-brand-lavender/20">
                    <td className="px-4 py-2.5 font-semibold text-brand-navy">{c.cohort}</td>
                    <td className="px-4 py-2.5">{c.cohort_size}</td>
                    {[c.retention_w1, c.retention_w4, c.retention_w8, c.retention_w12].map((r, i) => {
                      const pct = Number(r ?? 0);
                      return (
                        <td key={i} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-brand-lavender/50 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-salmon rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span>{pct}%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "costs" && (
        <div className="space-y-6">
          {forecastMonthly > monthlyBudget && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-body text-sm text-amber-800">
              ⚠ Coste mensual proyectado (${forecastMonthly.toFixed(0)}) supera presupuesto (${monthlyBudget}).
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Coste total", value: `$${Number(summary?.total_cost_usd ?? 0).toFixed(2)}` },
              { label: "Coste 30d", value: `$${Number(summary?.cost_usd_30d ?? 0).toFixed(2)}` },
              { label: "Coste medio/eval", value: `$${Number(summary?.avg_cost_per_eval_30d ?? 0).toFixed(3)}` },
              { label: "Evals degraded (30d)", value: summary?.degraded_evals_30d ?? 0 },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-border-soft rounded-2xl p-5">
                <p className="font-sora text-2xl font-bold text-brand-navy">{String(s.value)}</p>
                <p className="font-body text-sm text-ink-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Forecast */}
          <div className="bg-white border border-border-soft rounded-2xl p-6 space-y-3">
            <h3 className="font-sora font-semibold text-brand-navy">Proyección de coste mensual</h3>
            <div className="grid grid-cols-3 gap-4 text-sm font-body">
              <div>
                <p className="text-ink-secondary">Ritmo actual (×1)</p>
                <p className={`font-sora font-bold text-xl ${forecastMonthly > monthlyBudget ? "text-amber-600" : "text-brand-navy"}`}>${forecastMonthly.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-ink-secondary">Si crece ×2</p>
                <p className={`font-sora font-bold text-xl ${forecast2x > monthlyBudget ? "text-red-600" : "text-brand-navy"}`}>${forecast2x.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-ink-secondary">Si crece ×3</p>
                <p className="font-sora font-bold text-xl text-red-600">${forecast3x.toFixed(0)}</p>
              </div>
            </div>
            <p className="text-xs text-ink-secondary">Presupuesto configurado: ${monthlyBudget}/mes</p>
          </div>

          {/* Latency */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-sora font-semibold text-brand-navy mb-3">Latencia del pipeline (90d)</h3>
            <div className="grid grid-cols-3 gap-4 text-sm font-body">
              {[["p50", p50], ["p90", p90], ["p99", p99]].map(([label, val]) => (
                <div key={String(label)}>
                  <p className="text-ink-secondary font-mono">{label}</p>
                  <p className={`font-sora font-bold text-xl ${Number(val) > 90000 && label === "p90" ? "text-amber-600" : "text-brand-navy"}`}>
                    {Number(val) > 0 ? `${(Number(val) / 1000).toFixed(1)}s` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Model breakdown */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-sora font-semibold text-brand-navy mb-3">Coste por modelo</h3>
            <div className="space-y-2">
              {Object.entries(modelCosts).map(([model, data]) => (
                <div key={model} className="flex items-center gap-4 text-sm font-body">
                  <span className="font-mono text-brand-navy w-48 truncate">{model}</span>
                  <span className="text-ink-secondary w-20">${data.cost.toFixed(3)}</span>
                  <span className="text-ink-secondary text-xs">{(data.tokens_in / 1000).toFixed(0)}k in · {(data.tokens_out / 1000).toFixed(0)}k out</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly cost chart */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-sora font-semibold text-brand-navy mb-4">Coste por semana (8w)</h3>
            <div className="flex items-end gap-2 h-24">
              {costKeys.map((w) => {
                const val = costMap[w] ?? 0;
                const max = Math.max(...costKeys.map((k) => costMap[k] ?? 0), 0.01);
                return (
                  <div key={w} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-brand-navy/70 rounded-t" style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? 4 : 0 }} title={`$${val.toFixed(2)}`} />
                    <span className="text-xs text-ink-secondary" style={{ writingMode: "vertical-rl" }}>{w.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
