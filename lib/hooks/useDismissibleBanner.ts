"use client";

import { useState, useEffect, useCallback } from "react";

export const DISMISS_COOKIE_PREFIX = "dismissed_banner_";
export const DISMISS_DAYS = 7;

export function isBannerDismissedFromCookieString(
  cookieString: string,
  bannerKey: string,
  now: number = Date.now(),
  dismissDays: number = DISMISS_DAYS
): boolean {
  const name = `${DISMISS_COOKIE_PREFIX}${bannerKey}=`;
  const row = cookieString
    .split("; ")
    .find((r) => r.startsWith(name));
  if (!row) return false;

  const raw = row.slice(name.length);
  const dismissedAt = parseInt(raw, 10);
  if (Number.isNaN(dismissedAt)) return false;

  const threshold = now - dismissDays * 24 * 60 * 60 * 1000;
  return dismissedAt > threshold;
}

export function useDismissibleBanner(bannerKey: string) {
  // Default true so SSR renders nothing and we avoid a flash on hydration.
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsDismissed(
      isBannerDismissedFromCookieString(document.cookie, bannerKey)
    );
  }, [bannerKey]);

  const dismiss = useCallback(() => {
    if (typeof document === "undefined") return;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + DISMISS_DAYS);
    document.cookie = `${DISMISS_COOKIE_PREFIX}${bannerKey}=${Date.now()}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
    setIsDismissed(true);
  }, [bannerKey]);

  return { isDismissed, dismiss };
}
