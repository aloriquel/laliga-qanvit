import { describe, it, expect } from "vitest";
import { getTierWeight, formatMomentum } from "../votes-utils";

describe("getTierWeight", () => {
  it("returns 1 for rookie", () => {
    expect(getTierWeight("rookie")).toBe(1);
  });

  it("returns 2 for pro", () => {
    expect(getTierWeight("pro")).toBe(2);
  });

  it("returns 3 for elite", () => {
    expect(getTierWeight("elite")).toBe(3);
  });
});

describe("formatMomentum", () => {
  it("prefixes positive scores with +", () => {
    expect(formatMomentum(14)).toBe("+14");
  });

  it("returns negative scores as-is", () => {
    expect(formatMomentum(-5)).toBe("-5");
  });

  it('returns "0" for zero', () => {
    expect(formatMomentum(0)).toBe("0");
  });
});
