import { describe, it, expect } from "vitest";
import {
  isBannerDismissedFromCookieString,
  DISMISS_COOKIE_PREFIX,
  DISMISS_DAYS,
} from "../useDismissibleBanner";

const KEY = "qanvit_bridge_liga";
const NAME = `${DISMISS_COOKIE_PREFIX}${KEY}`;
const DAY_MS = 24 * 60 * 60 * 1000;

describe("isBannerDismissedFromCookieString", () => {
  it("returns false when the banner cookie is absent", () => {
    expect(isBannerDismissedFromCookieString("other=1; foo=bar", KEY)).toBe(false);
  });

  it("returns false for an empty cookie string", () => {
    expect(isBannerDismissedFromCookieString("", KEY)).toBe(false);
  });

  it("returns true when dismissed within the 7-day window", () => {
    const now = 1_700_000_000_000;
    const recent = now - 2 * DAY_MS;
    expect(
      isBannerDismissedFromCookieString(`${NAME}=${recent}`, KEY, now)
    ).toBe(true);
  });

  it("returns false when the dismissal is older than 7 days", () => {
    const now = 1_700_000_000_000;
    const old = now - (DISMISS_DAYS + 1) * DAY_MS;
    expect(
      isBannerDismissedFromCookieString(`${NAME}=${old}`, KEY, now)
    ).toBe(false);
  });

  it("returns false when the stored value is not a number", () => {
    expect(
      isBannerDismissedFromCookieString(`${NAME}=notanumber`, KEY)
    ).toBe(false);
  });

  it("isolates keys — a dismissal for one surface does not dismiss another", () => {
    const now = 1_700_000_000_000;
    const recent = now - DAY_MS;
    const cookieString = `${DISMISS_COOKIE_PREFIX}qanvit_bridge_dashboard=${recent}`;
    expect(
      isBannerDismissedFromCookieString(cookieString, "qanvit_bridge_liga", now)
    ).toBe(false);
    expect(
      isBannerDismissedFromCookieString(cookieString, "qanvit_bridge_dashboard", now)
    ).toBe(true);
  });
});
