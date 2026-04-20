import { describe, it, expect } from "vitest";
import { getRateLimitUnlockDate, RATE_LIMIT_DAYS } from "../upload-core";

describe("getRateLimitUnlockDate", () => {
  it("returns a date 7 days after uploadedAt", () => {
    const uploadedAt = "2026-01-01T00:00:00Z";
    const unlock = getRateLimitUnlockDate(uploadedAt);
    const expected = new Date("2026-01-08T00:00:00Z");
    expect(unlock.getTime()).toBe(expected.getTime());
  });

  it(`uses RATE_LIMIT_DAYS = ${RATE_LIMIT_DAYS}`, () => {
    const now = new Date("2026-04-01T12:00:00Z");
    const unlock = getRateLimitUnlockDate(now.toISOString());
    const diffDays = (unlock.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(RATE_LIMIT_DAYS);
  });

  it("returns a future date if uploadedAt is recent", () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const unlock = getRateLimitUnlockDate(recent);
    expect(unlock.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns a past date if uploadedAt is 8 days ago", () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const unlock = getRateLimitUnlockDate(old);
    expect(unlock.getTime()).toBeLessThan(Date.now());
  });
});
