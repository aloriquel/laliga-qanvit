import { describe, it, expect } from "vitest";
import { tierFromPoints, pointsToNextTier, TIER_THRESHOLDS } from "../points-helpers";

describe("tierFromPoints", () => {
  it("returns rookie below 1000", () => {
    expect(tierFromPoints(0)).toBe("rookie");
    expect(tierFromPoints(999)).toBe("rookie");
  });

  it("returns pro between 1000 and 4999", () => {
    expect(tierFromPoints(1000)).toBe("pro");
    expect(tierFromPoints(4999)).toBe("pro");
  });

  it("returns elite at 5000+", () => {
    expect(tierFromPoints(5000)).toBe("elite");
    expect(tierFromPoints(99999)).toBe("elite");
  });
});

describe("pointsToNextTier", () => {
  it("points to pro for rookie with correct remaining", () => {
    const result = pointsToNextTier(0);
    expect(result.next).toBe("pro");
    expect(result.remaining).toBe(TIER_THRESHOLDS.pro);
  });

  it("points to elite for pro with correct remaining", () => {
    const result = pointsToNextTier(2000);
    expect(result.next).toBe("elite");
    expect(result.remaining).toBe(TIER_THRESHOLDS.elite - 2000);
  });

  it("returns null next tier when already elite", () => {
    const result = pointsToNextTier(6000);
    expect(result.next).toBeNull();
    expect(result.remaining).toBe(0);
  });
});
