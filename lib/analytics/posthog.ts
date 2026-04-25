import posthog from "posthog-js";

import { hasConsent } from "./consent";
import type { EventName, EventProperties } from "./events";

let initialized = false;

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const UI_HOST = "https://eu.posthog.com";

/**
 * Initialize PostHog. Idempotent. Only runs in the browser AND only when the
 * user has given explicit consent. Returns true if PostHog was initialized
 * (now or earlier).
 */
export function initPostHog(): boolean {
  if (typeof window === "undefined") return false;
  if (initialized) return true;
  if (!POSTHOG_KEY) return false;
  if (!hasConsent()) return false;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: UI_HOST,
    capture_pageview: false, // we send $pageview manually on Next.js navigation
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage+cookie",
    ip: false, // anonymize IP
    respect_dnt: true,
    opt_out_capturing_by_default: true,
    advanced_disable_decide: true,
    // @ts-expect-error — runtime option, not in type stubs yet
    disable_remote_config: true,
    loaded: (ph) => {
      ph.opt_in_capturing();
      if (process.env.NODE_ENV === "development") ph.debug();
    },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-private]",
      recordCrossOriginIframes: false,
    },
    enable_recording_console_log: false,
    disable_session_recording: false,
  });

  initialized = true;
  return true;
}

/** Stop tracking and forget the user. Used on logout / consent revocation. */
export function disablePostHog(): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  try {
    posthog.opt_out_capturing();
    posthog.reset();
  } catch {
    /* noop */
  }
}

/** Strongly-typed capture. Compile-time enforces property shape per event. */
export function track<E extends EventName>(
  event: E,
  properties: EventProperties[E]
): void {
  if (typeof window === "undefined" || !initialized) return;
  if (!hasConsent()) return;
  try {
    posthog.capture(event, properties as Record<string, unknown>);
  } catch {
    /* noop */
  }
}

/** Send a manual $pageview event. Used by the provider on route changes. */
export function trackPageview(url: string): void {
  if (typeof window === "undefined" || !initialized) return;
  if (!hasConsent()) return;
  try {
    posthog.capture("$pageview", { $current_url: url });
  } catch {
    /* noop */
  }
}

export function identify(
  distinctId: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !initialized) return;
  if (!hasConsent()) return;
  try {
    posthog.identify(distinctId, properties);
  } catch {
    /* noop */
  }
}

export function resetUser(): void {
  if (typeof window === "undefined" || !initialized) return;
  try {
    posthog.reset();
  } catch {
    /* noop */
  }
}
