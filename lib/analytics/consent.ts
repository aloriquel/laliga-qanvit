/**
 * Cookie-based consent for analytics. GDPR-strict, AEPD-aligned.
 *
 * - Cookie: `qanvit_analytics_consent`.
 * - Values: "accepted" | "rejected" | undefined (no decision yet).
 * - Expiry: 13 months (max recommended by AEPD).
 * - SameSite=Lax; Secure in production.
 *
 * The functions below are deliberately small + pure so they unit-test
 * without DOM. The DOM accessors are gated by `typeof document !== 'undefined'`.
 */

export type ConsentDecision = "accepted" | "rejected";

export const CONSENT_COOKIE_NAME = "qanvit_analytics_consent";
const CONSENT_TTL_DAYS = 395; // ≈13 months

/** Pure: extract consent from a raw cookie string. */
export function readConsentFromCookieString(
  cookie: string | null | undefined
): ConsentDecision | null {
  if (!cookie) return null;
  const prefix = `${CONSENT_COOKIE_NAME}=`;
  for (const part of cookie.split("; ")) {
    if (!part.startsWith(prefix)) continue;
    const raw = decodeURIComponent(part.slice(prefix.length));
    if (raw === "accepted" || raw === "rejected") return raw;
    return null;
  }
  return null;
}

/** Pure: build the Set-Cookie value for a given decision. */
export function buildConsentCookie(
  decision: ConsentDecision,
  options: { isProduction?: boolean; now?: Date } = {}
): string {
  const { isProduction = false, now = new Date() } = options;
  const expires = new Date(now);
  expires.setDate(expires.getDate() + CONSENT_TTL_DAYS);
  const flags = [
    `${CONSENT_COOKIE_NAME}=${decision}`,
    `expires=${expires.toUTCString()}`,
    "path=/",
    "SameSite=Lax",
  ];
  if (isProduction) flags.push("Secure");
  return flags.join("; ");
}

/** Browser: read current decision (null if undecided). */
export function getConsent(): ConsentDecision | null {
  if (typeof document === "undefined") return null;
  return readConsentFromCookieString(document.cookie);
}

export function hasConsent(): boolean {
  return getConsent() === "accepted";
}

/** Browser: persist a decision and notify listeners. */
export function setConsent(decision: ConsentDecision): void {
  if (typeof document === "undefined") return;
  const isProduction = process.env.NODE_ENV === "production";
  document.cookie = buildConsentCookie(decision, { isProduction });
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("qanvit:consent-changed", { detail: { decision } })
    );
  }
}
