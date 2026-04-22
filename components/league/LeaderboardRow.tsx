import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buildStartupHref } from "@/lib/league/url-helpers";

export type LeaderboardRowData = {
  startup_id: string | null;
  name: string | null;
  slug: string;
  one_liner: string | null;
  logo_url: string | null;
  current_division: string | null;
  current_vertical: string | null;
  current_score: number | null;
  rank_national: number;
};

const DIVISION_LABELS: Record<string, string> = {
  ideation: "🥚 Ideation",
  seed: "🌱 Seed",
  growth: "🚀 Growth",
  elite: "👑 Elite",
};

const VERTICAL_TABLE: Record<string, string> = {
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

type Props = { row: LeaderboardRowData };

export default function LeaderboardRow({ row }: Props) {
  const href = buildStartupHref(row.slug);

  return (
    <Link
      href={href}
      aria-label={`Ver perfil de ${row.name ?? "startup"}`}
      className="group block px-6 py-4 grid grid-cols-[3rem_1fr_auto_auto_auto_20px] gap-4 items-center border-t border-border-soft min-h-[48px] bg-white hover:bg-brand-lavender/40 active:bg-brand-lavender/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-salmon"
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
            alt={`Logo de ${row.name ?? ""}`}
            className="h-9 w-9 rounded-full object-cover border border-border-soft flex-shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-brand-lavender flex items-center justify-center text-brand-navy font-sora font-bold text-sm flex-shrink-0">
            {row.name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-sora font-semibold text-sm text-brand-navy truncate group-hover:text-brand-navy/80 transition-colors">
            {row.name ?? "—"}
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
        {row.current_division
          ? (DIVISION_LABELS[row.current_division] ?? row.current_division)
          : "—"}
      </span>

      {/* Vertical */}
      <span className="hidden md:block font-body text-xs text-ink-secondary whitespace-nowrap">
        {row.current_vertical
          ? (VERTICAL_TABLE[row.current_vertical] ?? row.current_vertical)
          : "—"}
      </span>

      {/* Score */}
      <span className="font-mono font-medium text-sm text-brand-navy tabular-nums">
        {row.current_score != null
          ? Number(row.current_score).toFixed(0)
          : "—"}
      </span>

      {/* Chevron */}
      <ChevronRight
        size={14}
        className="text-ink-secondary opacity-30 group-hover:opacity-70 transition-opacity flex-shrink-0"
        aria-hidden
      />
    </Link>
  );
}
