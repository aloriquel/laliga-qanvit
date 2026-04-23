import { getCaById, type CaId } from "@/lib/spain-regions";
import type { ChampionBadgeData } from "@/lib/batches";

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
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

function badgeText(badge: ChampionBadgeData): string {
  const { category, segment_key, batch } = badge;
  const b = batch.display_name;
  switch (category) {
    case "national_top1":
      return `🏆 Campeón Nacional · ${b}`;
    case "national_top2":
      return `🥈 Subcampeón · ${b}`;
    case "national_top3":
      return `🥉 Tercero · ${b}`;
    case "division_top1": {
      const label = segment_key ? DIVISION_LABELS[segment_key] ?? segment_key : "";
      return `🏆 Campeón ${label} · ${b}`;
    }
    case "region_ca_top1": {
      const name = segment_key ? getCaById(segment_key as CaId)?.name ?? segment_key : "";
      return `🏆 Campeón ${name} · ${b}`;
    }
    case "vertical_top1": {
      const name = segment_key ? VERTICAL_LABELS[segment_key] ?? segment_key : "";
      return `🏆 Campeón ${name} · ${b}`;
    }
    default:
      return `🏆 Ganador · ${b}`;
  }
}

export default function ChampionBadge({ badge }: { badge: ChampionBadgeData }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-sora font-medium text-sm bg-gradient-to-r from-brand-salmon/25 to-amber-100 border border-brand-salmon/60 text-brand-navy rounded-full px-4 py-1.5 shadow-sm">
      {badgeText(badge)}
    </span>
  );
}
