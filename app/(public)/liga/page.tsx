import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const revalidate = 60; // ISR: refresh every 60s

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Ranking nacional de startups de La Liga Qanvit por División y Vertical.",
};

const DIVISION_LABELS: Record<string, string> = {
  ideation: "🥚 Ideation",
  seed: "🌱 Seed",
  growth: "🚀 Growth",
  elite: "👑 Elite",
};

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI",
  robotics_automation: "Robotics",
  mobility: "Mobility",
  energy_cleantech: "Energy",
  agrifood: "AgriFood",
  healthtech_medtech: "HealthTech",
  industrial_manufacturing: "Industrial",
  space_aerospace: "Space",
  materials_chemistry: "Materials",
  cybersecurity: "Cybersecurity",
};

export default async function LeaderboardPage() {
  let standings: Array<{
    startup_id: string;
    name: string;
    slug: string;
    one_liner: string | null;
    logo_url: string | null;
    current_division: string | null;
    current_vertical: string | null;
    current_score: number | null;
    rank_national: number;
  }> | null = null;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("league_standings")
      .select("*")
      .order("rank_national", { ascending: true })
      .limit(50);
    standings = data;
  } catch {
    // Supabase not configured (local dev without .env.local)
  }

  const hasData = standings != null && standings.length > 0;

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand">
        <div className="mb-10">
          <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
            {"— { } —"}
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy">
            Leaderboard
          </h1>
          <p className="font-body text-ink-secondary mt-2">
            Ranking nacional de startups · La Liga Qanvit
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-border-soft overflow-hidden">
          {/* Table header */}
          <div className="bg-brand-navy/5 px-6 py-3 grid grid-cols-[3rem_1fr_auto_auto_auto] gap-4 text-xs font-semibold text-ink-secondary uppercase tracking-wider">
            <span>#</span>
            <span>Startup</span>
            <span className="hidden lg:block">División</span>
            <span className="hidden md:block">Vertical</span>
            <span>Score</span>
          </div>

          {!hasData ? (
            <div className="py-20 text-center">
              <p className="font-mono text-ink-secondary text-sm">
                {"{ la liga está empezando }"} · Sé la primera en tu vertical.
              </p>
            </div>
          ) : (
            standings!.map((row) => (
              <div
                key={row.startup_id}
                className="px-6 py-4 grid grid-cols-[3rem_1fr_auto_auto_auto] gap-4 items-center border-t border-border-soft hover:bg-brand-lavender/30 transition-colors"
              >
                {/* Rank */}
                <span className="font-mono text-sm font-medium text-ink-secondary">
                  #{row.rank_national}
                </span>

                {/* Startup */}
                <div className="flex items-center gap-3 min-w-0">
                  {row.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.logo_url}
                      alt={`Logo de ${row.name}`}
                      className="h-9 w-9 rounded-full object-cover border border-border-soft flex-shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-brand-lavender flex items-center justify-center text-brand-navy font-sora font-bold text-sm flex-shrink-0">
                      {row.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-sora font-semibold text-sm text-brand-navy truncate">
                      {row.name}
                    </p>
                    {row.one_liner && (
                      <p className="font-body text-xs text-ink-secondary truncate">
                        {row.one_liner}
                      </p>
                    )}
                  </div>
                </div>

                {/* División */}
                <span className="hidden lg:block font-body text-xs text-ink-secondary whitespace-nowrap">
                  {row.current_division ? DIVISION_LABELS[row.current_division] : "—"}
                </span>

                {/* Vertical */}
                <span className="hidden md:block font-body text-xs text-ink-secondary whitespace-nowrap">
                  {row.current_vertical ? VERTICAL_LABELS[row.current_vertical] : "—"}
                </span>

                {/* Score */}
                <span className="font-mono font-medium text-sm text-brand-navy tabular-nums">
                  {row.current_score != null
                    ? Number(row.current_score).toFixed(0)
                    : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
