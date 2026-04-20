import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";

type Props = { params: { slug: string } };
type StartupRow = Database["public"]["Tables"]["startups"]["Row"];

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: startup } = await supabase
    .from("startups")
    .select("name, one_liner, is_public")
    .eq("slug", params.slug)
    .single();

  if (!startup || !startup.is_public) {
    return { title: "Startup no encontrada" };
  }

  return {
    title: startup.name,
    description: startup.one_liner ?? undefined,
  };
}

const DIVISION_LABELS: Record<string, { label: string; color: string }> = {
  ideation: { label: "🥚 Ideation", color: "bg-league-ideation text-ink-primary" },
  seed: { label: "🌱 Seed", color: "bg-league-seed text-ink-primary" },
  growth: { label: "🚀 Growth", color: "bg-league-growth text-brand-navy" },
  elite: { label: "👑 Elite", color: "bg-league-elite text-ink-primary" },
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

export default async function StartupPublicPage({ params }: Props) {
  let startup: StartupRow | null = null;
  let standing: {
    rank_national: number;
    rank_division: number;
    rank_division_vertical: number;
  } | null = null;

  try {
    const supabase = createClient();

    const { data: startupData } = await supabase
      .from("startups")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_public", true)
      .single();

    startup = startupData;

    if (startup) {
      const { data: standingData } = await supabase
        .from("league_standings")
        .select("rank_national, rank_division, rank_division_vertical")
        .eq("startup_id", startup.id)
        .single();
      standing = standingData;
    }
  } catch {
    // Supabase not configured or startup not found
  }

  if (!startup) notFound();

  const division = startup.current_division
    ? DIVISION_LABELS[startup.current_division]
    : null;

  const vertical = startup.current_vertical
    ? VERTICAL_LABELS[startup.current_vertical]
    : null;

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-2xl">
        <div className="bg-white rounded-hero shadow-card border border-border-soft p-10 flex flex-col items-center gap-6 text-center">
          {/* Logo */}
          {startup.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={startup.logo_url}
              alt={`Logo de ${startup.name}`}
              className="h-20 w-20 rounded-full object-cover border border-border-soft"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-lavender flex items-center justify-center text-brand-navy font-sora font-bold text-3xl">
              {startup.name.charAt(0)}
            </div>
          )}

          {/* Name + one-liner */}
          <div>
            <h1 className="font-sora font-bold text-3xl text-brand-navy">
              {startup.name}
            </h1>
            {startup.one_liner && (
              <p className="font-body text-ink-secondary mt-2">{startup.one_liner}</p>
            )}
          </div>

          {/* Division + Vertical badges */}
          {(division ?? vertical) && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {division && (
                <Badge className={`${division.color} font-body text-xs`}>
                  {division.label}
                </Badge>
              )}
              {vertical && (
                <Badge
                  variant="outline"
                  className="font-body text-xs border-border-soft text-ink-secondary"
                >
                  {vertical}
                </Badge>
              )}
            </div>
          )}

          {/* Score */}
          {startup.current_score != null && (
            <div className="bg-brand-navy rounded-card py-4 px-8">
              <p className="font-mono text-brand-salmon text-5xl font-bold">
                {Number(startup.current_score).toFixed(0)}
              </p>
              <p className="font-body text-white/50 text-xs mt-1">Score</p>
            </div>
          )}

          {/* Ranking info */}
          {standing && (
            <div className="grid grid-cols-3 gap-4 w-full pt-2">
              <div className="text-center">
                <p className="font-sora font-bold text-2xl text-brand-navy">
                  #{standing.rank_division_vertical}
                </p>
                <p className="font-body text-xs text-ink-secondary mt-0.5">
                  {startup.current_division && startup.current_vertical
                    ? `en ${DIVISION_LABELS[startup.current_division]?.label.replace(/^\S+\s/, "")} ${VERTICAL_LABELS[startup.current_vertical] ?? ""}`
                    : "División · Vertical"}
                </p>
              </div>
              <div className="text-center">
                <p className="font-sora font-bold text-2xl text-brand-navy">
                  #{standing.rank_division}
                </p>
                <p className="font-body text-xs text-ink-secondary mt-0.5">
                  en {startup.current_division
                    ? DIVISION_LABELS[startup.current_division]?.label
                    : "División"}
                </p>
              </div>
              <div className="text-center">
                <p className="font-sora font-bold text-2xl text-brand-navy">
                  #{standing.rank_national}
                </p>
                <p className="font-body text-xs text-ink-secondary mt-0.5">
                  nacional
                </p>
              </div>
            </div>
          )}

          {/* Website */}
          {startup.website && (
            <a
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors"
            >
              {startup.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
