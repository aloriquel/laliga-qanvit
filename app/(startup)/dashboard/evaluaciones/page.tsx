import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import BenchmarkChart from "@/components/dashboard/BenchmarkChart";

export const metadata: Metadata = { title: "Evaluaciones — Dashboard" };
export const revalidate = 0;

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"];
type StartupRow = Database["public"]["Tables"]["startups"]["Row"];

const DIMENSION_LABELS: Record<string, string> = {
  problem: "Problem",
  market: "Market",
  solution: "Solution",
  team: "Team",
  traction: "Traction",
  business_model: "Biz Model",
  gtm: "GTM",
};

const DIMENSION_LABELS_FULL: Record<string, string> = {
  problem: "Problem Severity",
  market: "Market Size & Timing",
  solution: "Solution & Moat",
  team: "Team Strength",
  traction: "Traction & Validation",
  business_model: "Business Model",
  gtm: "Go-to-Market",
};

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation", seed: "Seed", growth: "Growth", elite: "Elite",
};
const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI", robotics_automation: "Robotics & Automation",
  mobility: "Mobility", energy_cleantech: "Energy & Cleantech", agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech", industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace", materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

type DimFeedback = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  evidence_quotes: string[];
};

export default async function EvaluacionesPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  const { data: startup } = await supabase
    .from("startups")
    .select("id, current_division, current_vertical")
    .eq("owner_id", user.id)
    .single() as { data: Pick<StartupRow, "id" | "current_division" | "current_vertical"> | null };

  if (!startup) redirect("/play");

  const { data: evalRows } = await supabase
    .from("evaluations")
    .select("*")
    .eq("startup_id", startup.id)
    .order("created_at", { ascending: false }) as { data: EvaluationRow[] | null };

  const evaluations = evalRows ?? [];

  // Benchmark: avg scores for same division+vertical (need >= 5 startups)
  let benchmarkData: { dimension: string; startup: number; media: number }[] = [];
  const hasCurrentClass = startup.current_division && startup.current_vertical;

  if (hasCurrentClass && evaluations.length > 0) {
    // Count startups in this combination
    const { count: groupCount } = await supabase
      .from("evaluations")
      .select("startup_id", { count: "exact" })
      .eq("assigned_division", startup.current_division!)
      .eq("assigned_vertical", startup.current_vertical!);

    if ((groupCount ?? 0) >= 5) {
      // Fetch avg scores
      const { data: avgRows } = await supabase.rpc("get_dimension_averages" as never, {
        p_division: startup.current_division,
        p_vertical: startup.current_vertical,
      } as never) as { data: Record<string, number>[] | null };

      // Fallback: compute from fetched rows (simpler approach without custom RPC)
      const { data: groupEvals } = await supabase
        .from("evaluations")
        .select("score_problem,score_market,score_solution,score_team,score_traction,score_business_model,score_gtm")
        .eq("assigned_division", startup.current_division!)
        .eq("assigned_vertical", startup.current_vertical!)
        .limit(100);

      if (groupEvals && groupEvals.length >= 5) {
        const dims = ["problem", "market", "solution", "team", "traction", "business_model", "gtm"] as const;
        const latestFeedback = evaluations[0].feedback as Record<string, DimFeedback>;

        benchmarkData = dims.map((dim) => {
          const col = `score_${dim}` as keyof typeof groupEvals[0];
          const avg = groupEvals.reduce((sum, r) => sum + Number(r[col] ?? 0), 0) / groupEvals.length;
          return {
            dimension: DIMENSION_LABELS[dim] ?? dim,
            startup: latestFeedback[dim]?.score ?? 0,
            media: Math.round(avg),
          };
        });
      }
    }
  }

  const divLabel = DIVISION_LABELS[startup.current_division ?? ""] ?? startup.current_division ?? "";
  const vertLabel = VERTICAL_LABELS[startup.current_vertical ?? ""] ?? startup.current_vertical ?? "";

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-sora font-bold text-2xl text-brand-navy">Evaluaciones</h1>
        <span className="font-mono text-xs text-ink-secondary">{evaluations.length} evaluación{evaluations.length !== 1 ? "es" : ""}</span>
      </div>

      {/* Benchmark chart */}
      {benchmarkData.length > 0 && (
        <div className="mb-8">
          <BenchmarkChart data={benchmarkData} divisionLabel={divLabel} verticalLabel={vertLabel} />
        </div>
      )}

      {evaluations.length === 0 ? (
        <div className="bg-white rounded-card border border-border-soft p-12 text-center">
          <p className="font-mono text-ink-secondary text-sm">{"{ sin evaluaciones aún }"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {evaluations.map((ev, index) => {
            const version = evaluations.length - index;
            const prevEval = evaluations[index + 1];
            const delta = prevEval ? Number(ev.score_total) - Number(prevEval.score_total) : null;
            const feedback = ev.feedback as Record<string, DimFeedback>;
            const nextActions = ev.next_actions as string[] | null;
            const degraded = (ev.feedback as Record<string, unknown>)?.degraded_mode === true;
            const dims = Object.keys(DIMENSION_LABELS_FULL);

            return (
              <div key={ev.id} className="bg-white rounded-card border border-border-soft overflow-hidden shadow-card">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-soft flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-brand-salmon font-bold">v{version}</span>
                      <span className="font-body text-sm text-ink-secondary">·</span>
                      <span className="font-body text-sm text-ink-secondary">
                        {new Date(ev.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {degraded && (
                        <span className="bg-gray-100 text-gray-500 text-xs rounded-md px-2 py-0.5 font-body">
                          Evaluación con modelo de respaldo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-body text-xs text-ink-secondary">
                        {DIVISION_LABELS[ev.assigned_division]} · {VERTICAL_LABELS[ev.assigned_vertical]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-sora font-bold text-2xl text-brand-navy">
                      {Number(ev.score_total).toFixed(0)}
                    </p>
                    {delta !== null && (
                      <p className={`font-mono text-xs ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {delta >= 0 ? `↑ +${delta.toFixed(1)}` : `↓ ${delta.toFixed(1)}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {ev.summary && (
                  <div className="px-6 py-4 bg-brand-lavender/30 border-b border-border-soft">
                    <p className="font-body text-sm text-brand-navy leading-relaxed">{ev.summary}</p>
                  </div>
                )}

                {/* Dimensions accordion */}
                <div className="divide-y divide-border-soft">
                  {dims.map((dim) => {
                    const dimData = feedback[dim];
                    if (!dimData) return null;
                    const score = dimData.score;
                    const scoreColor = score >= 70 ? "text-green-600" : score >= 45 ? "text-yellow-600" : "text-red-500";

                    return (
                      <details key={dim} className="group">
                        <summary className="flex items-center gap-4 px-6 py-3 cursor-pointer list-none select-none hover:bg-brand-lavender/20 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm text-brand-navy">{DIMENSION_LABELS_FULL[dim]}</p>
                            <div className="mt-1 h-1 w-full bg-brand-lavender rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-red-400")}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                          <span className={cn("font-mono font-bold text-lg tabular-nums flex-shrink-0", scoreColor)}>
                            {score.toFixed(0)}
                          </span>
                          <span className="text-ink-secondary/50 text-xs group-open:rotate-90 transition-transform">▶</span>
                        </summary>

                        <div className="px-6 pb-5 pt-2 border-t border-border-soft bg-brand-lavender/10">
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="font-body text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Fortalezas</p>
                              <ul className="flex flex-col gap-1">
                                {dimData.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2 font-body text-xs text-brand-navy">
                                    <span className="text-green-500 flex-shrink-0">+</span>{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-body text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Debilidades</p>
                              <ul className="flex flex-col gap-1">
                                {dimData.weaknesses.map((w, i) => (
                                  <li key={i} className="flex items-start gap-2 font-body text-xs text-brand-navy">
                                    <span className="text-red-400 flex-shrink-0">−</span>{w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {dimData.evidence_quotes.length > 0 && (
                            <div>
                              <p className="font-body text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Citas del deck</p>
                              <div className="flex flex-col gap-1.5">
                                {dimData.evidence_quotes.map((q, i) => (
                                  <blockquote key={i} className="border-l-2 border-brand-salmon pl-3 font-body text-xs text-ink-secondary italic">
                                    &ldquo;{q}&rdquo;
                                  </blockquote>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>

                {/* Next actions */}
                {nextActions && nextActions.length > 0 && (
                  <div className="px-6 py-4 border-t border-border-soft">
                    <p className="font-sora font-semibold text-brand-navy text-sm mb-3">Próximas acciones</p>
                    <ol className="flex flex-col gap-2">
                      {nextActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono text-brand-salmon text-xs font-bold w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="font-body text-xs text-brand-navy leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
