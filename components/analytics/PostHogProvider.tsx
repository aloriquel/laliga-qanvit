"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { initPostHog, trackPageview } from "@/lib/analytics/posthog";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    trackPageview(url);
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
    function onConsentChanged() {
      // Re-attempt init after the user accepts (no-op if consent rejected).
      initPostHog();
    }
    window.addEventListener("qanvit:consent-changed", onConsentChanged);
    return () =>
      window.removeEventListener("qanvit:consent-changed", onConsentChanged);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}
