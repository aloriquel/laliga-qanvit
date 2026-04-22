import type { Database } from "@/lib/supabase/types";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];

export function getTierWeight(tier: Tier): 1 | 2 | 3 {
  if (tier === "elite") return 3;
  if (tier === "pro") return 2;
  return 1;
}

export function formatMomentum(score: number): string {
  if (score > 0) return `+${score}`;
  if (score < 0) return `${score}`;
  return "0";
}
