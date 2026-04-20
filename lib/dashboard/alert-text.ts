import type { Database } from "@/lib/supabase/types";

type AlertType = Database["public"]["Enums"]["alert_type"];

type AlertPayload = {
  from?: string | number;
  to?: string | number;
  vertical?: string;
  division?: string;
  new_rank?: number;
  scope?: "national" | "division";
  new_score?: number;
  old_score?: number;
};

const DIVISION_DISPLAY: Record<string, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
};

const VERTICAL_DISPLAY: Record<string, string> = {
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

export function renderAlertText(alertType: AlertType, payload: AlertPayload): string {
  const div = (key: string | undefined) => DIVISION_DISPLAY[key ?? ""] ?? key ?? "";
  const vert = (key: string | undefined) => VERTICAL_DISPLAY[key ?? ""] ?? key ?? "";

  switch (alertType) {
    case "moved_up_division":
      return `Has subido a ${div(String(payload.to))}. Bienvenido.`;
    case "moved_down_division":
      return `Has bajado a ${div(String(payload.to))}. Revisa el feedback.`;
    case "new_top3_vertical":
      return `Top ${payload.new_rank} en ${div(payload.division)} ${vert(payload.vertical)}. Eres de los grandes.`;
    case "new_top10_vertical":
      return `Top 10 en ${div(payload.division)} ${vert(payload.vertical)}.`;
    case "new_top10_division":
      return `Top 10 en la ${div(payload.division)} League.`;
    case "position_milestone": {
      const scopeLabel = payload.scope === "national" ? "nacional" : "en tu división";
      return `Has subido de #${String(payload.from)} a #${String(payload.to)} (${scopeLabel}).`;
    }
    default:
      return "Nueva notificación.";
  }
}

export function alertIcon(alertType: AlertType): string {
  switch (alertType) {
    case "moved_up_division":    return "🚀";
    case "moved_down_division":  return "↘️";
    case "new_top3_vertical":    return "🥇";
    case "new_top10_vertical":   return "🏅";
    case "new_top10_division":   return "📊";
    case "position_milestone":   return "⚡";
    default:                     return "🔔";
  }
}

export function alertEmailSubject(alertType: AlertType, payload: AlertPayload): string {
  const div = (key: string | undefined) => DIVISION_DISPLAY[key ?? ""] ?? key ?? "";
  const vert = (key: string | undefined) => VERTICAL_DISPLAY[key ?? ""] ?? key ?? "";

  switch (alertType) {
    case "moved_up_division":
      return `[La Liga Qanvit] Has subido a ${div(String(payload.to))} 🚀`;
    case "moved_down_division":
      return `[La Liga Qanvit] Cambio de división a ${div(String(payload.to))}`;
    case "new_top3_vertical":
      return `[La Liga Qanvit] Top ${payload.new_rank} en ${div(payload.division)} ${vert(payload.vertical)} 🥇`;
    case "new_top10_vertical":
      return `[La Liga Qanvit] Estás en el Top 10 de ${vert(payload.vertical)}`;
    case "new_top10_division":
      return `[La Liga Qanvit] Top 10 en ${div(payload.division)} League`;
    case "position_milestone":
      return `[La Liga Qanvit] Has ganado posiciones en La Liga`;
    default:
      return "[La Liga Qanvit] Nueva notificación";
  }
}
