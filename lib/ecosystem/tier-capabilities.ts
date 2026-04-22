import type { Database } from "@/lib/supabase/types";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];

export type TierCapabilities = {
  can_vote: boolean;
  vote_weight: 1 | 2 | 3;
  reason_required_on_down: boolean;
  max_vertical_alerts: number;
  alert_frequency: "weekly" | "daily";
  csv_rows_per_month: number;
  can_see_advanced_filters: boolean;
  can_see_summary_llm: boolean;
  can_see_timeline: boolean;
  can_see_advanced_columns: boolean;
  has_early_access_new_startups: boolean;
  has_elite_scouter_badge: boolean;
  dataset_export_limit_monthly: 0 | 1;
  can_request_qanvit_session: boolean;
};

const CAPABILITIES: Record<Tier, TierCapabilities> = {
  rookie: {
    can_vote:                        true,
    vote_weight:                     1,
    reason_required_on_down:         false,
    max_vertical_alerts:             1,
    alert_frequency:                 "weekly",
    csv_rows_per_month:              0,
    can_see_advanced_filters:        false,
    can_see_summary_llm:             false,
    can_see_timeline:                false,
    can_see_advanced_columns:        false,
    has_early_access_new_startups:   false,
    has_elite_scouter_badge:         false,
    dataset_export_limit_monthly:    0,
    can_request_qanvit_session:      false,
  },
  pro: {
    can_vote:                        true,
    vote_weight:                     2,
    reason_required_on_down:         true,
    max_vertical_alerts:             3,
    alert_frequency:                 "daily",
    csv_rows_per_month:              100,
    can_see_advanced_filters:        true,
    can_see_summary_llm:             true,
    can_see_timeline:                true,
    can_see_advanced_columns:        true,
    has_early_access_new_startups:   false,
    has_elite_scouter_badge:         false,
    dataset_export_limit_monthly:    0,
    can_request_qanvit_session:      false,
  },
  elite: {
    can_vote:                        true,
    vote_weight:                     3,
    reason_required_on_down:         true,
    max_vertical_alerts:             10,
    alert_frequency:                 "daily",
    csv_rows_per_month:              500,
    can_see_advanced_filters:        true,
    can_see_summary_llm:             true,
    can_see_timeline:                true,
    can_see_advanced_columns:        true,
    has_early_access_new_startups:   true,
    has_elite_scouter_badge:         true,
    dataset_export_limit_monthly:    1,
    can_request_qanvit_session:      true,
  },
};

export function getCapabilities(tier: Tier): TierCapabilities {
  return CAPABILITIES[tier];
}

export function canAccessFeature<K extends keyof TierCapabilities>(
  tier: Tier,
  feature: K
): TierCapabilities[K] {
  return CAPABILITIES[tier][feature];
}
