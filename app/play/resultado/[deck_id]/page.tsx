import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Props = { params: { deck_id: string } };

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"];
type StartupRow = Database["public"]["Tables"]["startups"]["Row"];

export const revalidate = 0; // Always fresh — the user just landed here

const DIVISION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  ideation: { label: "Ideation", emoji: "🥚", color: "bg-league-ideation text-ink-primary" },
  seed:     { label: "Seed",     emoji: "🌱", color: "bg-league-seed text-ink-primary" },
  growth:   { label: "Growth",   emoji: "🚀", color: "bg-league-growth text-brand-navy" },
  elite:    { label: "Elite",    emoji: "👑", color: "bg-league-elite text-ink-primary" },
};

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI",
  robotics_automation: "Robotics & Automation",
  mobility: "Mobility",
  energy_cleantech: "Energy & Cleantech",
  agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech",
  industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace",
  materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

const DIMENSION_LABELS: Record<string, string> = {
  problem: "Problem Severity",
  market: "Market Size & Timing",
  solution: "Solution & Moat",
  team: "Team Strength",
  traction: "Traction & Validation",
  business_model: "Business Model",
  gtm: "Go-to-Market",
};

type DimensionFeedback = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  evidence_quotes: string[];
};

type FeedbackPayload = Record<string, DimensionFeedback>;

export default async function ResultadoPage({ params }: Props) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Find the latest evaluation for this deck
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("deck_id", params.deck_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() as { data: EvaluationRow | null };

  if (!evaluation) notFound();

  // Verify ownership (startup owner can see, admin can see)
  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("id", evaluation.startup_id)
    .single() as { data: StartupRow | null };

  if (!startup) notFound();

  if (user?.id !== startup.owner_id) {
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .single();
    if (!profile || profile.role !== "admin") notFound();
  }

  // Standings
  const { data: standing } = await supabase
    .from("league_standings")
    .select("rank_national, rank_division, rank_division_vertical")
    .eq("startup_id", startup.id)
    .maybeSingle();

  const division = DIVISION_LABELS[evaluation.assigned_division];
  const vertical = VERTICAL_LABELS[evaluation.assigned_vertical] ?? evaluation.assigned_vertical;
  const feedback = evaluation.feedback as FeedbackPayload;
  const nextActions = evaluation.next_actions as string[] | null;
  const dimensions = Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>;

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-3xl">

        {/* ── Header card ── */}
        <div className="bg-brand-navy rounded-hero p-10 mb-6 text-center">
          <p className="font-sora text-brand-salmon text-xs font-semibold tracking-widest uppercase mb-4">
            { "{ La Liga Qanvit }" }
          </p>
          <h1 className="font-sora font-bold text-white text-3xl md:text-4xl mb-2">
            {startup.name}
          </h1>
          <p className="font-body text-white/60 mb-8">
            {division?.emoji} {division?.label} · {vertical}
          </p>

          {/* Score */}
          <div className="inline-block">
            <p className="font-mono text-brand-salmon font-bold leading-none"
               style={{ fontSize: "clamp(4rem, 12vw, 7rem)" }}>
              {Number(evaluation.score_total).toFixed(0)}
            </p>
            <p className="font-body text-white/40 text-xs uppercase tracking-widest mt-1">Score</p>
          </div>

          {/* Standings */}
          {standing && (
            <div className="grid grid-cols-3 gap-4 mt-8 border-t border-white/10 pt-8">
              <div>
                <p className="font-sora font-bold text-white text-2xl">#{standing.rank_division_vertical}</p>
                <p className="font-body text-white/40 text-xs mt-0.5">en {division?.label} {vertical}</p>
              </div>
              <div>
                <p className="font-sora font-bold text-white text-2xl">#{standing.rank_division}</p>
                <p className="font-body text-white/40 text-xs mt-0.5">en {division?.label}</p>
              </div>
              <div>
                <p className="font-sora font-bold text-white text-2xl">#{standing.rank_national}</p>
                <p className="font-body text-white/40 text-xs mt-0.5">nacional</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary ── */}
        {evaluation.summary && (
          <div className="bg-white rounded-card shadow-card border border-border-soft p-6 mb-6">
            <p className="font-body text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-2">Resumen</p>
            <p className="font-body text-brand-navy leading-relaxed">{evaluation.summary}</p>
          </div>
        )}

        {/* ── Next actions ── */}
        {nextActions && nextActions.length > 0 && (
          <div className="bg-brand-navy/5 rounded-card border border-border-soft p-6 mb-6">
            <p className="font-sora font-semibold text-brand-navy mb-4">Próximas acciones</p>
            <ol className="flex flex-col gap-3">
              {nextActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-brand-salmon text-sm font-bold w-5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-body text-sm text-brand-navy leading-relaxed">{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── 7 Dimension cards ── */}
        <div className="flex flex-col gap-4 mb-8">
          <h2 className="font-sora font-bold text-xl text-brand-navy">Feedback por dimensión</h2>
          {dimensions.map((dim) => {
            const dimData = feedback[dim];
            if (!dimData) return null;
            const score = dimData.score;
            const pct = Math.round(score);
            const scoreColor = score >= 70 ? "text-green-600" : score >= 45 ? "text-yellow-600" : "text-red-500";

            return (
              <details
                key={dim}
                className="bg-white rounded-card shadow-card border border-border-soft overflow-hidden group"
              >
                <summary className="flex items-center gap-4 px-6 py-4 cursor-pointer list-none select-none hover:bg-brand-lavender/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold text-brand-navy text-sm">{DIMENSION_LABELS[dim]}</p>
                    <div className="mt-1.5 h-1.5 w-full bg-brand-lavender rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-red-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn("font-mono font-bold text-xl tabular-nums flex-shrink-0", scoreColor)}>
                    {pct}
                  </span>
                  <span className="text-ink-secondary text-xs group-open:rotate-90 transition-transform">▶</span>
                </summary>

                <div className="px-6 pb-6 pt-2 border-t border-border-soft">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-body text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Fortalezas</p>
                      <ul className="flex flex-col gap-1.5">
                        {dimData.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 font-body text-sm text-brand-navy">
                            <span className="text-green-500 flex-shrink-0 mt-0.5">+</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-body text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Debilidades</p>
                      <ul className="flex flex-col gap-1.5">
                        {dimData.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 font-body text-sm text-brand-navy">
                            <span className="text-red-400 flex-shrink-0 mt-0.5">−</span>{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {dimData.evidence_quotes.length > 0 && (
                    <div className="mt-4">
                      <p className="font-body text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Citas del deck</p>
                      <div className="flex flex-col gap-2">
                        {dimData.evidence_quotes.map((q, i) => (
                          <blockquote key={i} className="border-l-2 border-brand-salmon pl-3 font-body text-sm text-ink-secondary italic">
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

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/startup/${startup.slug}`}
            className="flex-1 text-center bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 font-body text-sm hover:bg-brand-navy/90 transition-colors"
          >
            Ver perfil público
          </Link>
          <Link
            href="/liga"
            className="flex-1 text-center border border-border-soft rounded-xl px-6 py-3 font-body text-sm text-ink-secondary hover:bg-white transition-colors"
          >
            Ver el leaderboard
          </Link>
        </div>

        {/* Model metadata (subtle) */}
        <p className="text-center font-mono text-xs text-ink-secondary/40 mt-8">
          evaluado con {evaluation.evaluator_model} · prompt {evaluation.prompt_version} · rubric {evaluation.rubric_version}
        </p>
      </div>
    </div>
  );
}
