"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

import { initPostHog, trackPageview } from "@/lib/analytics/posthog";
import { hasConsent } from "@/lib/analytics/consent";

const NO_RECORDING_PREFIXES = ["/ecosistema/dashboard"];

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

function RecordingGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !hasConsent()) return;
    const isRestricted = NO_RECORDING_PREFIXES.some((p) => pathname.startsWith(p));
    try {
      if (isRestricted) {
        posthog.stopSessionRecording();
      } else {
        posthog.startSessionRecording();
      }
    } catch {
      /* PostHog may not be initialized yet; the next pathname change retries. */
    }
  }, [pathname]);

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
        <RecordingGuard />
      </Suspense>
      {children}
    </>
  );
}
