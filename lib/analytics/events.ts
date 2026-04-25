/**
 * Strict event catalog for La Liga Qanvit (PROMPT_POSTHOG).
 *
 * Naming: snake_case_imperative.
 * 18 events across 4 funnels. NO new events without explicit decision.
 * Property shapes are TS-checked at every call-site via `track()`.
 */

export const EVENTS = {
  // Funnel 1 — Visitante anónimo en perfil público
  PROFILE_PUBLIC_VIEWED: "profile_public_viewed",
  ANONYMOUS_VOTE_CLICKED: "anonymous_vote_clicked",
  FOLLOW_MODAL_OPENED: "follow_modal_opened",
  FOLLOW_EMAIL_SUBMITTED: "follow_email_submitted",
  FOLLOW_CONFIRMATION_CLICKED: "follow_confirmation_clicked",
  FOLLOW_UNSUBSCRIBE_CLICKED: "follow_unsubscribe_clicked",

  // Funnel 2 — Founder ficha startup
  PLAY_STARTED: "play_started",
  PLAY_STEP_COMPLETED: "play_step_completed",
  PLAY_ABANDONED: "play_abandoned",
  STARTUP_PUBLISHED: "startup_published",

  // Funnel 3 — Org del ecosystem
  ECOSYSTEM_APPLICATION_STARTED: "ecosystem_application_started",
  ECOSYSTEM_APPLICATION_SUBMITTED: "ecosystem_application_submitted",
  ECOSYSTEM_DASHBOARD_VIEWED: "ecosystem_dashboard_viewed",
  ECOSYSTEM_QANVIT_CTA_CLICKED: "ecosystem_qanvit_cta_clicked",
  ECOSYSTEM_VOTE_CAST: "ecosystem_vote_cast",

  // Funnel 4 — Discovery / Home
  HOME_CATEGORY_ROW_SCROLLED: "home_category_row_scrolled",
  HOME_EMPTY_SLOT_CLICKED: "home_empty_slot_clicked",
  HOME_PROMO_CARD_CLICKED: "home_promo_card_clicked",
  LIGA_FULL_RANKING_CLICKED: "liga_full_ranking_clicked",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export type Tier = "rookie" | "pro" | "elite";

export type EventProperties = {
  [EVENTS.PROFILE_PUBLIC_VIEWED]: {
    startup_slug: string;
    source?: "direct" | "liga" | "home_card" | "follow_email" | "other";
  };
  [EVENTS.ANONYMOUS_VOTE_CLICKED]: {
    startup_slug: string;
    vote_count_after: number;
  };
  [EVENTS.FOLLOW_MODAL_OPENED]: {
    startup_slug: string;
    trigger: "after_vote" | "manual";
  };
  [EVENTS.FOLLOW_EMAIL_SUBMITTED]: {
    startup_slug: string;
  };
  [EVENTS.FOLLOW_CONFIRMATION_CLICKED]: {
    startup_slug: string;
    hours_to_confirm: number;
  };
  [EVENTS.FOLLOW_UNSUBSCRIBE_CLICKED]: {
    startup_slug: string;
    days_subscribed: number;
  };
  [EVENTS.PLAY_STARTED]: {
    source: "home_cta" | "empty_slot" | "promo_card" | "direct" | "other";
  };
  [EVENTS.PLAY_STEP_COMPLETED]: {
    step_name: string;
    step_number: number;
  };
  [EVENTS.PLAY_ABANDONED]: {
    last_step: string;
    time_spent_seconds: number;
  };
  [EVENTS.STARTUP_PUBLISHED]: {
    startup_id: string;
    has_deck: boolean;
    vertical: string;
    division: string;
  };
  [EVENTS.ECOSYSTEM_APPLICATION_STARTED]: {
    source?: string;
  };
  [EVENTS.ECOSYSTEM_APPLICATION_SUBMITTED]: {
    org_type: string;
  };
  [EVENTS.ECOSYSTEM_DASHBOARD_VIEWED]: {
    tier: Tier;
  };
  [EVENTS.ECOSYSTEM_QANVIT_CTA_CLICKED]: {
    tier: Tier;
    cta_location: "banner" | "tile" | "email" | "landing" | "other";
  };
  [EVENTS.ECOSYSTEM_VOTE_CAST]: {
    startup_id: string;
    vote_type: "up" | "down";
    tier: Tier;
  };
  [EVENTS.HOME_CATEGORY_ROW_SCROLLED]: {
    category_type: "division" | "vertical";
    category_value: string;
  };
  [EVENTS.HOME_EMPTY_SLOT_CLICKED]: {
    category_type: "division" | "vertical";
    category_value: string;
    slot_position: number;
  };
  [EVENTS.HOME_PROMO_CARD_CLICKED]: {
    category_type: "division" | "vertical";
    category_value: string;
  };
  [EVENTS.LIGA_FULL_RANKING_CLICKED]: {
    source: "home_cta" | "nav" | "other";
  };
};
