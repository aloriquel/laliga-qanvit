import type { ClassificationResult } from "./schemas";

type Phase = ClassificationResult["detected_phase"];

type DimensionWeights = {
  problem: number;
  market: number;
  solution: number;
  team: number;
  traction: number;
  business_model: number;
  gtm: number;
};

// Weights per division/phase. Sum = 1.0 (100%)
// Ideation: team + problem + solution matter most (little else to evaluate)
// Seed: traction starts to count
// Growth: traction dominates, BM and GTM grow
// Elite: BM and traction are determinant; rest assumed solved
export const DIVISION_WEIGHTS: Record<Phase, DimensionWeights> = {
  ideation: {
    problem: 0.25,
    market: 0.20,
    solution: 0.20,
    team: 0.25,
    traction: 0.00,
    business_model: 0.05,
    gtm: 0.05,
  },
  seed: {
    problem: 0.15,
    market: 0.15,
    solution: 0.20,
    team: 0.20,
    traction: 0.15,
    business_model: 0.10,
    gtm: 0.05,
  },
  growth: {
    problem: 0.10,
    market: 0.15,
    solution: 0.15,
    team: 0.10,
    traction: 0.25,
    business_model: 0.15,
    gtm: 0.10,
  },
  elite: {
    problem: 0.05,
    market: 0.15,
    solution: 0.10,
    team: 0.10,
    traction: 0.30,
    business_model: 0.20,
    gtm: 0.10,
  },
};

export function calculateWeightedScore(
  scores: Record<keyof DimensionWeights, number>,
  phase: Phase
): number {
  const weights = DIVISION_WEIGHTS[phase];
  return Object.entries(weights).reduce((acc, [dim, weight]) => {
    return acc + (scores[dim as keyof DimensionWeights] ?? 0) * weight;
  }, 0);
}

// Override: if score diverges strongly from classifier phase, use score-based division
export function scoreToPhase(score: number): Phase {
  if (score <= 40) return "ideation";
  if (score <= 60) return "seed";
  if (score <= 80) return "growth";
  return "elite";
}
