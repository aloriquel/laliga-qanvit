"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { enablePostHogAnalytics, track } from "@/lib/analytics/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Init PostHog only if user has given consent
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "analytics" || consent === "all") {
      enablePostHogAnalytics();
    }

    // Listen for future consent grants (from CookieBanner)
    function handleConsent() {
      enablePostHogAnalytics();
    }
    window.addEventListener("posthog:consent-granted", handleConsent);
    return () => window.removeEventListener("posthog:consent-granted", handleConsent);
  }, []);

  useEffect(() => {
    if (pathname === "/") track({ event: "landing_view" });
    if (pathname === "/liga") track({ event: "leaderboard_view" });
    if (pathname === "/play") track({ event: "play_start" });
  }, [pathname]);

  return <>{children}</>;
}
