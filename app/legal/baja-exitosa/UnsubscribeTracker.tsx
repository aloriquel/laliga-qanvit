"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Mounts on the unsubscribe success page and emits the funnel event.
 *
 * `from_slug` and `days` are propagated by the email template through the
 * `/api/followers/unsubscribe` redirect. They default to "" / 0 when the
 * link is hit without those params (e.g. someone bookmarked the page).
 */
export default function UnsubscribeTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromSlug = searchParams?.get("from_slug") ?? "";
    const daysRaw = searchParams?.get("days") ?? "";
    const daysSubscribed = /^\d+$/.test(daysRaw) ? Number(daysRaw) : 0;
    track(EVENTS.FOLLOW_UNSUBSCRIBE_CLICKED, {
      startup_slug: fromSlug,
      days_subscribed: daysSubscribed,
    });
  }, [searchParams]);
  return null;
}
