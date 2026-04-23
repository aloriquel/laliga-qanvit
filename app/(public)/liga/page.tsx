import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { FilterContextBar } from "@/components/league/FilterContextBar";
import LeaderboardRow from "@/components/league/LeaderboardRow";
import { SPAIN_CA, getCaById, type CaId } from "@/lib/spain-regions";
import Link from "next/link";
import { getBatchForLeaderboard, isPreLaunchBatch } from "@/lib/batches";

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
  searchParams: { division?: string; vertical?: string; ca?: string; batch?: string };
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const d = searchParams.division ?? null;
  const v = searchParams.vertical ?? null;
  const c = searchParams.ca ?? null;
  const parts: string[] = [];
  if (d) parts.push(DIVISION_NAMES[d] ?? d);
  if (v) parts.push(VERTICAL_FULL[v] ?? v);
  if (c) parts.push(getCaById(c as CaId)?.name ?? c);
  const title = parts.length ? `${parts.join(" · ")} — Leaderboard` : "Leaderboard";
  return {
    title,
    description: "Ranking nacional de startups de La Liga Qanvit por División y Vertical.",
  };
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const [t, batch] = await Promise.all([
    getTranslations("leaderboard"),
    getBatchForLeaderboard(searchParams.batch ?? null),
  ]);

  const division = searchParams.division ?? null;
  const vertical = searchParams.vertical ?? null;
  const ca       = searchParams.ca ?? null;

  const safeDivision = division && division in DIVISION_NAMES ? division : null;
  const safeVertical = vertical && vertical in VERTICAL_FULL   ? vertical : null;
  const safeCa       = ca && SPAIN_CA.some((c) => c.id === ca) ? (ca as CaId) : null;

  let standings: Array<{
    startup_id: string | null;
    name: string | null;
    slug: string;
    one_liner: string | null;
    logo_url: string | null;
    region_ca: string | null;
    region_province: string | null;
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
    if (safeCa)       query = query.eq("region_ca", safeCa);

    const { data } = await query;
    standings = data;
  } catch {
    // Supabase not configured (local dev without .env.local)
  }

  const hasData = standings != null && standings.length > 0;
  const count = standings?.length ?? 0;

  const divName  = safeDivision ? DIVISION_NAMES[safeDivision] : null;
  const vertFull = safeVertical ? VERTICAL_FULL[safeVertical] : null;
  const vertShort = safeVertical ? VERTICAL_SHORT[safeVertical] : null;
  const caName   = safeCa ? getCaById(safeCa)?.name ?? safeCa : null;

  let headingTitle: string;
  let headingEyebrow: string;

  if (!safeDivision && !safeVertical && !safeCa) {
    headingTitle   = t("title");
    headingEyebrow = t("subtitle");
  } else if (safeCa && !safeDivision && !safeVertical) {
    headingTitle   = caName!;
    headingEyebrow = "Ranking regional";
  } else if (safeDivision && !safeVertical) {
    headingTitle   = `${divName} League`;
    headingEyebrow = safeCa ? caName! : "Todas las verticales";
  } else if (!safeDivision && safeVertical) {
    headingTitle   = vertFull!;
    headingEyebrow = safeCa ? caName! : "Todas las divisiones";
  } else {
    headingTitle   = `${divName} ${vertShort}`;
    headingEyebrow = safeCa ? caName! : "La celda oficial";
  }

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand">
        {/* Batch context banner */}
        {batch && isPreLaunchBatch(batch) && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                Pre-Lanzamiento · Q3 2026 arranca el 1 de julio
              </span>
            </div>
            <p className="font-body text-sm text-ink-secondary">
              Ficha tu startup hoy para aparecer desde el primer día del primer batch oficial.
            </p>
          </div>
        )}
        {batch && batch.status !== "active" && !isPreLaunchBatch(batch) && (
          <div className="mb-6 bg-brand-navy/8 border border-brand-navy/15 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="font-mono text-xs text-brand-navy font-semibold uppercase tracking-wider">
              {batch.status === "closed" ? "Histórico" : batch.display_name}
            </span>
            <p className="font-body text-sm text-ink-secondary">
              Estás viendo los resultados del batch <span className="font-semibold text-brand-navy">{batch.display_name}</span>.{" "}
              <Link href="/liga" className="underline underline-offset-2 hover:text-brand-navy transition-colors">
                Ver ranking actual →
              </Link>
            </p>
          </div>
        )}
        {batch && batch.status === "active" && !isPreLaunchBatch(batch) && (
          <div className="mb-6 flex items-center gap-2">
            <span className="font-mono text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
              {batch.display_name} · en curso
            </span>
            <span className="font-body text-xs text-ink-secondary">
              Finaliza el {new Date(batch.ends_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        )}

        {/* Heading */}
        <div className="mb-10">
          <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
            {"— { } —"}
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy">
            {headingTitle}
          </h1>
          <p className="font-body text-ink-secondary mt-2">{headingEyebrow}</p>

          <FilterContextBar
            division={safeDivision}
            vertical={safeVertical}
            ca={safeCa}
            count={count}
          />
        </div>

        {/* Rankings no oficiales notice */}
        {batch && isPreLaunchBatch(batch) && (
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded">
              Rankings no oficiales
            </span>
            <span className="font-body text-xs text-ink-secondary">
              Los resultados se consolidan al inicio de Q3 2026
            </span>
          </div>
        )}

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
              {safeCa ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="font-sora font-bold text-brand-navy text-lg">
                    Aún no hay startups en {caName}
                  </p>
                  <p className="font-body text-ink-secondary text-sm">
                    ¡Sé la primera de tu Comunidad Autónoma!
                  </p>
                  <Link
                    href="/play"
                    className="mt-2 inline-block bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 font-body text-sm hover:bg-brand-navy/90 transition-colors"
                  >
                    Ficha tu startup
                  </Link>
                </div>
              ) : (
                <p className="font-mono text-ink-secondary text-sm">{t("empty")}</p>
              )}
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
