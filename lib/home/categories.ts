import type { Database } from "@/lib/supabase/types";

export type Division = Database["public"]["Enums"]["league_division"];
export type Vertical = Database["public"]["Enums"]["startup_vertical"];

export const DIVISIONS_IN_ORDER: Division[] = ["ideation", "seed", "growth", "elite"];

export const VERTICALS_IN_ORDER: Vertical[] = [
  "deeptech_ai",
  "robotics_automation",
  "mobility",
  "energy_cleantech",
  "agrifood",
  "healthtech_medtech",
  "industrial_manufacturing",
  "space_aerospace",
  "materials_chemistry",
  "cybersecurity",
];

export const DIVISION_LABELS: Record<Division, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
};

export const DIVISION_SUBTITLES: Record<Division, string> = {
  ideation: "Idea validada, equipo incipiente",
  seed: "Primer producto, tracción inicial",
  growth: "Modelo validado, escalando",
  elite: "Liderazgo nacional, revenue sólido",
};

export const VERTICAL_LABELS: Record<Vertical, string> = {
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

export const DIVISION_TINT: Record<Division, string> = {
  ideation: "#b8c5d6",
  seed: "#a8d5ba",
  growth: "#f4a9aa",
  elite: "#c8a2c8",
};

export function formatDivisionLabel(value: string): string {
  return DIVISION_LABELS[value as Division] ?? value;
}

export function formatVerticalLabel(value: string): string {
  return VERTICAL_LABELS[value as Vertical] ?? value;
}
