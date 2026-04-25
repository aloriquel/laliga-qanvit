import { describe, it, expect } from "vitest";
import {
  readConsentFromCookieString,
  buildConsentCookie,
  CONSENT_COOKIE_NAME,
} from "../consent";

describe("readConsentFromCookieString", () => {
  it("returns null when the cookie is absent", () => {
    expect(readConsentFromCookieString("foo=bar; baz=qux")).toBeNull();
    expect(readConsentFromCookieString("")).toBeNull();
    expect(readConsentFromCookieString(null)).toBeNull();
  });

  it("returns the decision when the cookie is present", () => {
    expect(
      readConsentFromCookieString(`${CONSENT_COOKIE_NAME}=accepted`)
    ).toBe("accepted");
    expect(
      readConsentFromCookieString(`x=1; ${CONSENT_COOKIE_NAME}=rejected; y=2`)
    ).toBe("rejected");
  });

  it("returns null for unrecognized values", () => {
    expect(
      readConsentFromCookieString(`${CONSENT_COOKIE_NAME}=maybe`)
    ).toBeNull();
  });
});

describe("buildConsentCookie", () => {
  const fixedNow = new Date("2026-01-01T00:00:00Z");

  it("includes path, SameSite=Lax and the decision", () => {
    const cookie = buildConsentCookie("accepted", { now: fixedNow });
    expect(cookie).toContain(`${CONSENT_COOKIE_NAME}=accepted`);
    expect(cookie).toContain("path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("expires=");
  });

  it("adds Secure only when isProduction is true", () => {
    const dev = buildConsentCookie("accepted", {
      isProduction: false,
      now: fixedNow,
    });
    expect(dev).not.toContain("Secure");
    const prod = buildConsentCookie("accepted", {
      isProduction: true,
      now: fixedNow,
    });
    expect(prod).toContain("Secure");
  });

  it("sets expiry roughly 13 months ahead", () => {
    const cookie = buildConsentCookie("rejected", { now: fixedNow });
    const m = cookie.match(/expires=([^;]+)/);
    expect(m).toBeTruthy();
    const expires = new Date(m![1]);
    const days = (expires.getTime() - fixedNow.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(390);
    expect(days).toBeLessThan(400);
  });
});
