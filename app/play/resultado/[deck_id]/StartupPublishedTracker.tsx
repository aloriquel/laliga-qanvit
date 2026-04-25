"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

type Props = {
  startupId: string;
  hasDeck: boolean;
  vertical: string;
  division: string;
};

/**
 * Emits STARTUP_PUBLISHED once when the post-evaluation result page mounts.
 *
 * The result page is the canonical "publish complete" surface: an evaluation
 * exists for the deck, the startup row is in the league. We use a ref to
 * make sure StrictMode double-invocation does not double-emit.
 *
 * Persistence layer: a local cookie `qanvit_published_<startup_id>` makes
 * sure repeat visits to the same result page do not re-emit the event for
 * the same startup.
 */
export default function StartupPublishedTracker({
  startupId,
  hasDeck,
  vertical,
  division,
}: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (typeof document === "undefined") return;

    const cookieKey = `qanvit_published_${startupId}`;
    if (document.cookie.split("; ").some((c) => c.startsWith(`${cookieKey}=`))) {
      return;
    }

    track(EVENTS.STARTUP_PUBLISHED, {
      startup_id: startupId,
      has_deck: hasDeck,
      vertical,
      division,
    });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 365);
    document.cookie = `${cookieKey}=1; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
  }, [startupId, hasDeck, vertical, division]);

  return null;
}
