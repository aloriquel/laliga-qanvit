"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Mounts on the unsubscribe success page and emits the funnel event.
 *
 * The cancellation page is reached via a one-click GET that does not pass
 * the originating startup slug or the days-subscribed delta. We log
 * conservative defaults; PostHog still counts the unsubscribe.
 */
export default function UnsubscribeTracker() {
  useEffect(() => {
    track(EVENTS.FOLLOW_UNSUBSCRIBE_CLICKED, {
      startup_slug: "",
      days_subscribed: 0,
    });
  }, []);
  return null;
}
