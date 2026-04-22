import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { FilterContextBar } from "@/components/league/FilterContextBar";
import LeaderboardRow from "@/components/league/LeaderboardRow";

export const revalidate = 60; // ISR per unique URL

const DIVISION_NAMES: Record<string, string> = {
  ideation: "Ideation",
  seed:     "Seed",
  growth:   "Growth",
  elite:    "Elite",
};

const VERTICAL_FULL: Record<string, string> = {
  deeptech_ai:              "Deeptech & AI",
  robotics_automation:      "Robotics & Automation",
  mobility:                 "Mobility",
  energy_cleantech:         "Energy & Cleantech",
  agrifood:                 "AgriFood",
  healthtech_medtech:       "HealthTech & MedTech",
  industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace:          "Space & Aerospace",
  materials_chemistry:      "Materials & Chemistry",
  cybersecurity:            "Cybersecurity",
};

// Short labels used in the combined heading "Seed Robotics"
const VERTICAL_SHORT: Record<string, string> = {
  deeptech_ai:              "Deeptech",
  robotics_automation:      "Robotics",
  mobility:                 "Mobility",
  energy_cleantech:         "Energy",
  agrifood:                 "AgriFood",
  healthtech_medtech:       "HealthTech",
  industrial_manufacturing: "Industrial",
  space_aerospace:          "Space",
  materials_chemistry:      "Materials",
  cybersecurity:            "Cyber",
};


type PageProps = {
  searchParams: { division?: string; vertical?: string };
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const d = searchParams.division ?? null;
  const v = searchParams.vertical ?? null;
  const parts: string[] = [];
  if (d) parts.push(DIVISION_NAMES[d] ?? d);
  if (v) parts.push(VERTICAL_FULL[v] ?? v);
  const title = parts.length ? `${parts.join(" · ")} — Leaderboard` : "Leaderboard";
  return {
    title,
    description: "Ranking nacional de startups de La Liga Qanvit por División y Vertical.",
  };
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const [t] = await Promise.all([getTranslations("leaderboard")]);

  const division = searchParams.division ?? null;
  const vertical = searchParams.vertical ?? null;

  // Validate params to prevent injecting arbitrary values into DB queries
  const safeDivision =
    division && division in DIVISION_NAMES ? division : null;
  const safeVertical =
    vertical && vertical in VERTICAL_FULL ? vertical : null;

  let standings: Array<{
    startup_id: string | null;
    name: string | null;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("league_standings")
      .select("*")
      .order("rank_national", { ascending: true })
      .limit(100);

    if (safeDivision) query = query.eq("current_division", safeDivision);
    if (safeVertical) query = query.eq("current_vertical", safeVertical);

    const { data } = await query;
    standings = data;
  } catch {
    // Supabase not configured (local dev without .env.local)
  }

  const hasData = standings != null && standings.length > 0;
  const count = standings?.length ?? 0;

  // ── Contextual heading ──────────────────────────────────────────────────────
  const divName = safeDivision ? DIVISION_NAMES[safeDivision] : null;
  const vertFull = safeVertical ? VERTICAL_FULL[safeVertical] : null;
  const vertShort = safeVertical ? VERTICAL_SHORT[safeVertical] : null;

  let headingTitle: string;
  let headingEyebrow: string;

  if (!safeDivision && !safeVertical) {
    headingTitle  = t("title");
    headingEyebrow = t("subtitle");
  } else if (safeDivision && !safeVertical) {
    headingTitle  = `${divName} League`;
    headingEyebrow = "Todas las verticales";
  } else if (!safeDivision && safeVertical) {
    headingTitle  = vertFull!;
    headingEyebrow = "Todas las divisiones";
  } else {
    headingTitle  = `${divName} ${vertShort}`;
    headingEyebrow = "La celda oficial";
  }

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand">
        {/* Heading */}
        <div className="mb-10">
          <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
            {"— { } —"}
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy">
            {headingTitle}
          </h1>
          <p className="font-body text-ink-secondary mt-2">{headingEyebrow}</p>

          {/* Contextual filter bar — only when filters are active */}
          <FilterContextBar
            division={safeDivision}
            vertical={safeVertical}
            count={count}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-card shadow-card border border-border-soft overflow-hidden">
          {/* Table header */}
          <div className="bg-brand-navy/5 px-6 py-3 grid grid-cols-[3rem_1fr_auto_auto_auto_20px] gap-4 text-xs font-semibold text-ink-secondary uppercase tracking-wider">
            <span>{t("rank")}</span>
            <span>{t("startup")}</span>
            <span className="hidden lg:block">{t("division")}</span>
            <span className="hidden md:block">{t("vertical")}</span>
            <span>{t("score")}</span>
            <span />
          </div>

          {!hasData ? (
            <div className="py-20 text-center">
              <p className="font-mono text-ink-secondary text-sm">
                {t("empty")}
              </p>
            </div>
          ) : (
            standings!.map((row, idx) => (
              <LeaderboardRow key={row.startup_id ?? idx} row={row} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
