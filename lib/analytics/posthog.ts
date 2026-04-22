import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    // Stops POST /flags (401) and GET array/{key}/config (404) on invalid/deleted projects.
    advanced_disable_decide: true,
    // @ts-expect-error — runtime option added ~1.83, not yet reflected in type stubs
    disable_remote_config: true,
  });

  initialized = true;
}

export function enablePostHogAnalytics() {
  if (!initialized) {
    initPostHog();
  } else {
    posthog.opt_in_capturing();
  }
}

export function disablePostHogAnalytics() {
  if (initialized) posthog.opt_out_capturing();
}

// Typed event catalog
export type AnalyticsEvent =
  | { event: "landing_view" }
  | { event: "play_start" }
  | { event: "deck_uploaded"; props: { startup_name: string; file_size_mb: number } }
  | { event: "evaluation_completed"; props: { score: number; division: string; vertical: string } }
  | { event: "evaluation_error"; props: { error_type: string } }
  | { event: "leaderboard_view"; props?: { filter_division?: string; filter_vertical?: string } }
  | { event: "startup_profile_view"; props: { slug: string; division?: string; vertical?: string } }
  | { event: "share_card_click"; props: { slug: string } }
  | { event: "share_card_download"; props: { slug: string } }
  | { event: "ecosystem_application_submit" }
  | { event: "ecosystem_tier_unlocked"; props: { tier: number } }
  | { event: "startup_vote_cast"; props: { startup_id: string; vote_type: "up" | "down"; tier: string } }
  | { event: "feedback_validated"; props: { startup_id: string; positive: boolean } }
  | { event: "admin_action"; props: { action_type: string; target_type: string } };

export function track(e: AnalyticsEvent) {
  if (typeof window === "undefined" || !initialized) return;
  if ("props" in e) {
    posthog.capture(e.event, e.props);
  } else {
    posthog.capture(e.event);
  }
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialized) return;
  posthog.identify(userId, traits);
}

export function reset() {
  if (typeof window === "undefined" || !initialized) return;
  posthog.reset();
}
