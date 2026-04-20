import type { Database } from "@/lib/supabase/types";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];
type PointsEvent = Database["public"]["Enums"]["points_event_type"];

export const TIER_THRESHOLDS: Record<Tier, number> = {
  rookie: 0,
  pro: 1000,
  elite: 5000,
};

export const EVENT_LABELS: Partial<Record<PointsEvent, string>> = {
  startup_referred_signup:   "Referral confirmado (evaluación)",
  startup_referred_top10:    "Referral top-10 vertical",
  startup_referred_phase_up: "Referral sube de fase",
  feedback_validated:        "Validación enviada",
  challenge_winner:          "Premio en reto",
};

export function tierFromPoints(points: number): Tier {
  if (points >= TIER_THRESHOLDS.elite) return "elite";
  if (points >= TIER_THRESHOLDS.pro) return "pro";
  return "rookie";
}

export function pointsToNextTier(points: number): { next: Tier | null; remaining: number } {
  if (points < TIER_THRESHOLDS.pro) {
    return { next: "pro", remaining: TIER_THRESHOLDS.pro - points };
  }
  if (points < TIER_THRESHOLDS.elite) {
    return { next: "elite", remaining: TIER_THRESHOLDS.elite - points };
  }
  return { next: null, remaining: 0 };
}

// Tier-based access gates
export const TIER_LIMITS = {
  rookie: { csvRowsPerMonth: 0,   contactRequestsPerMonth: 0,  startupDetailUnlocks: 5  },
  pro:    { csvRowsPerMonth: 100, contactRequestsPerMonth: 5,  startupDetailUnlocks: 50 },
  elite:  { csvRowsPerMonth: 500, contactRequestsPerMonth: 25, startupDetailUnlocks: 999 },
} satisfies Record<Tier, { csvRowsPerMonth: number; contactRequestsPerMonth: number; startupDetailUnlocks: number }>;
