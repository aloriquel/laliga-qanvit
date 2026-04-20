// ⚠️ DUPLICADO de lib/evaluator/weights.ts. Mantener en sync hasta V1.5 (shared package).

export type Phase = "ideation" | "seed" | "growth" | "elite";

export type DimensionWeights = {
  problem: number;
  market: number;
  solution: number;
  team: number;
  traction: number;
  business_model: number;
  gtm: number;
};

export const DIVISION_WEIGHTS: Record<Phase, DimensionWeights> = {
  ideation: { problem: 0.25, market: 0.20, solution: 0.20, team: 0.25, traction: 0.00, business_model: 0.05, gtm: 0.05 },
  seed:     { problem: 0.15, market: 0.15, solution: 0.20, team: 0.20, traction: 0.15, business_model: 0.10, gtm: 0.05 },
  growth:   { problem: 0.10, market: 0.15, solution: 0.15, team: 0.10, traction: 0.25, business_model: 0.15, gtm: 0.10 },
  elite:    { problem: 0.05, market: 0.15, solution: 0.10, team: 0.10, traction: 0.30, business_model: 0.20, gtm: 0.10 },
};

export function calculateWeightedScore(
  scores: Record<keyof DimensionWeights, number>,
  phase: Phase
): number {
  const w = DIVISION_WEIGHTS[phase];
  return (
    scores.problem * w.problem +
    scores.market * w.market +
    scores.solution * w.solution +
    scores.team * w.team +
    scores.traction * w.traction +
    scores.business_model * w.business_model +
    scores.gtm * w.gtm
  );
}

// Score override: if classifier phase diverges from score-implied phase, score wins.
export function scoreToPhase(score: number): Phase {
  if (score <= 40) return "ideation";
  if (score <= 60) return "seed";
  if (score <= 80) return "growth";
  return "elite";
}
