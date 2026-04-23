export const FUNDING_STAGES = [
  { id: "pre_seed",      label: "Pre-seed",  description: "Idea validada, equipo formado, sin producto o con MVP muy temprano" },
  { id: "seed",          label: "Seed",       description: "Producto en el mercado, primeros clientes o usuarios" },
  { id: "series_a",      label: "Serie A",    description: "Product-market fit, escalando ventas" },
  { id: "series_b",      label: "Serie B",    description: "Escala consolidada, expansión de mercado" },
  { id: "series_c",      label: "Serie C",    description: "Consolidación de posición, expansión internacional" },
  { id: "series_d_plus", label: "Serie D+",   description: "Ronda tardía, preparando IPO o exit" },
  { id: "bootstrapped",  label: "Bootstrapped", description: "Crecimiento con revenue propio, sin ronda externa" },
] as const;

export type FundingStage = typeof FUNDING_STAGES[number]["id"];

export const FUNDING_STAGE_IDS = FUNDING_STAGES.map((s) => s.id) as readonly FundingStage[];

export const FUNDING_STAGE_TO_DIVISION: Record<FundingStage, "ideation" | "seed" | "growth" | "elite"> = {
  pre_seed:      "ideation",
  seed:          "seed",
  series_a:      "growth",
  series_b:      "elite",
  series_c:      "elite",
  series_d_plus: "elite",
  bootstrapped:  "seed",
};

export function getDivisionFromFundingStage(
  stage: FundingStage | null | undefined
): "ideation" | "seed" | "growth" | "elite" | null {
  if (!stage) return null;
  return FUNDING_STAGE_TO_DIVISION[stage];
}

export function getFundingStageLabel(stage: FundingStage | string | null | undefined): string | null {
  if (!stage) return null;
  return FUNDING_STAGES.find((s) => s.id === stage)?.label ?? null;
}

export function getFundingStageDescription(stage: FundingStage | null | undefined): string | null {
  if (!stage) return null;
  return FUNDING_STAGES.find((s) => s.id === stage)?.description ?? null;
}

export function isFundingStage(value: unknown): value is FundingStage {
  return typeof value === "string" && FUNDING_STAGE_IDS.includes(value as FundingStage);
}
