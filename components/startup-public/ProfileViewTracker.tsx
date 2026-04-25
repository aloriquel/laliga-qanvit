"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

type Source = "direct" | "liga" | "home_card" | "follow_email" | "other";

function inferSource(): Source {
  if (typeof document === "undefined") return "direct";
  const ref = document.referrer || "";
  if (!ref) return "direct";
  try {
    const refUrl = new URL(ref);
    const sameOrigin = refUrl.origin === window.location.origin;
    if (!sameOrigin) {
      // Email-clicked links typically lack a referrer at all (mail clients
      // strip it). Anything cross-origin we cannot classify reliably.
      return "other";
    }
    const path = refUrl.pathname || "/";
    if (path.startsWith("/liga")) return "liga";
    if (path === "/") return "home_card";
    return "other";
  } catch {
    return "other";
  }
}

export default function ProfileViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track(EVENTS.PROFILE_PUBLIC_VIEWED, {
      startup_slug: slug,
      source: inferSource(),
    });
  }, [slug]);

  return null;
}
