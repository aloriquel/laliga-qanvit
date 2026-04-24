import { describe, it, expect } from "vitest";
import { hashIp, isValidEmail } from "../hash";

describe("hashIp", () => {
  it("produces deterministic hash for the same ip+secret", () => {
    const a = hashIp("1.2.3.4", "secret");
    const b = hashIp("1.2.3.4", "secret");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("differs when secret changes", () => {
    expect(hashIp("1.2.3.4", "s1")).not.toBe(hashIp("1.2.3.4", "s2"));
  });

  it("differs when ip changes", () => {
    expect(hashIp("1.2.3.4", "s")).not.toBe(hashIp("5.6.7.8", "s"));
  });

  it("never leaks the input", () => {
    const h = hashIp("10.0.0.1", "secret");
    expect(h).not.toContain("10.0.0.1");
  });
});

describe("isValidEmail", () => {
  it("accepts reasonable emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a.b+tag@domain.co")).toBe(true);
  });

  it("rejects non-strings and malformed inputs", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("plain")).toBe(false);
    expect(isValidEmail("no@dot")).toBe(false);
    expect(isValidEmail("@x.co")).toBe(false);
    expect(isValidEmail("a @b.co")).toBe(false);
  });

  it("rejects absurdly long emails", () => {
    const big = "a".repeat(400) + "@x.co";
    expect(isValidEmail(big)).toBe(false);
  });
});
