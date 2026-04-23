// Duplicado mínimo de lib/funding-stage.ts para uso en Deno Edge Functions.
// Mantener en sync con la versión Next.js.

export const FUNDING_STAGE_TO_DIVISION: Record<string, string> = {
  pre_seed:      "ideation",
  seed:          "seed",
  series_a:      "growth",
  series_b:      "elite",
  series_c:      "elite",
  series_d_plus: "elite",
  bootstrapped:  "seed",
};

const FUNDING_STAGE_LABELS: Record<string, string> = {
  pre_seed:      "Pre-seed",
  seed:          "Seed",
  series_a:      "Serie A",
  series_b:      "Serie B",
  series_c:      "Serie C",
  series_d_plus: "Serie D+",
  bootstrapped:  "Bootstrapped",
};

export function getFundingStageLabelDeno(stage: string | null | undefined): string | null {
  if (!stage) return null;
  return FUNDING_STAGE_LABELS[stage] ?? null;
}

export function getDivisionFromFundingStageDeno(stage: string | null | undefined): string | null {
  if (!stage) return null;
  return FUNDING_STAGE_TO_DIVISION[stage] ?? null;
}
