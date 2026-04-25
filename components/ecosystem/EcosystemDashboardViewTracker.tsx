"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/posthog";
import { EVENTS, type Tier } from "@/lib/analytics/events";

export default function EcosystemDashboardViewTracker({ tier }: { tier: Tier }) {
  useEffect(() => {
    track(EVENTS.ECOSYSTEM_DASHBOARD_VIEWED, { tier });
  }, [tier]);
  return null;
}
