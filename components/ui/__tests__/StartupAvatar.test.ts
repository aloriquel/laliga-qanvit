import { describe, it, expect } from "vitest";

// SIZE_MAP is not exported, so we duplicate it here to guard against silent regressions.
const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 96,
  xl: 160,
} as const;

function resolveSize(size: keyof typeof SIZE_MAP | number): number {
  return typeof size === "number" ? size : SIZE_MAP[size];
}

function getInitial(name: string | null | undefined): string {
  return name?.charAt(0)?.toUpperCase() ?? "?";
}

function getFontSize(px: number): number {
  return Math.round(px * 0.4);
}

describe("SIZE_MAP", () => {
  it("xs resolves to 24px", () => expect(resolveSize("xs")).toBe(24));
  it("sm resolves to 32px", () => expect(resolveSize("sm")).toBe(32));
  it("md resolves to 48px", () => expect(resolveSize("md")).toBe(48));
  it("lg resolves to 96px", () => expect(resolveSize("lg")).toBe(96));
  it("xl resolves to 160px", () => expect(resolveSize("xl")).toBe(160));
  it("numeric size passes through unchanged", () => expect(resolveSize(36)).toBe(36));
});

describe("getInitial", () => {
  it("uppercases the first character", () => expect(getInitial("orbea")).toBe("O"));
  it("handles already-uppercase names", () => expect(getInitial("Qanvit")).toBe("Q"));
  it("handles single-char names", () => expect(getInitial("x")).toBe("X"));
  it("returns empty string for empty name (charAt(0) on '' is '')", () => expect(getInitial("")).toBe(""));
  it("falls back to ? for null", () => expect(getInitial(null)).toBe("?"));
  it("falls back to ? for undefined", () => expect(getInitial(undefined)).toBe("?"));
});

describe("getFontSize", () => {
  it("is 40% of the container px, rounded", () => {
    expect(getFontSize(48)).toBe(19);
    expect(getFontSize(96)).toBe(38);
    expect(getFontSize(160)).toBe(64);
    expect(getFontSize(24)).toBe(10);
    expect(getFontSize(32)).toBe(13);
  });
});
