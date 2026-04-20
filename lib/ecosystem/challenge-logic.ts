import type { Database } from "@/lib/supabase/types";

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type ChallengeObjective = Database["public"]["Enums"]["challenge_objective_type"];

export function isChallengeActive(challenge: Challenge): boolean {
  if (challenge.status !== "active") return false;
  const now = Date.now();
  if (challenge.active_starts_at && new Date(challenge.active_starts_at).getTime() > now) return false;
  if (challenge.active_ends_at && new Date(challenge.active_ends_at).getTime() < now) return false;
  return true;
}

export function isChallengeVoting(challenge: Challenge): boolean {
  if (challenge.status !== "voting") return false;
  const now = Date.now();
  if (challenge.voting_starts_at && new Date(challenge.voting_starts_at).getTime() > now) return false;
  if (challenge.voting_ends_at && new Date(challenge.voting_ends_at).getTime() < now) return false;
  return true;
}

export const OBJECTIVE_LABELS: Record<ChallengeObjective, string> = {
  referred_in_vertical:    "Referidos en vertical",
  referred_in_region:      "Referidos en región",
  referred_top10:          "Referidos en top-10",
  validations_in_vertical: "Validaciones en vertical",
};

export function prizeForPosition(prizeStructure: Record<string, number>, position: number): number {
  return prizeStructure[String(position)] ?? 0;
}
