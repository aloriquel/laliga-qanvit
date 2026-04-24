import { describe, it, expect } from "vitest";
import { BRIDGE_COPY, buildBridgeCtaUrl } from "../bridge-copy";

describe("BRIDGE_COPY", () => {
  it("defines copy for all four org_type enum values", () => {
    const keys = Object.keys(BRIDGE_COPY).sort();
    expect(keys).toEqual([
      "cluster",
      "innovation_association",
      "other",
      "science_park",
    ]);
    for (const key of keys) {
      const entry = BRIDGE_COPY[key as keyof typeof BRIDGE_COPY];
      expect(entry.headline.length).toBeGreaterThan(0);
      expect(entry.subline.length).toBeGreaterThan(0);
    }
  });
});

describe("buildBridgeCtaUrl", () => {
  it("points to www.qanvit.com with the expected UTM campaign and the orgType as utm_term", () => {
    const url = buildBridgeCtaUrl("science_park");
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://www.qanvit.com/");
    expect(parsed.searchParams.get("utm_source")).toBe("laliga");
    expect(parsed.searchParams.get("utm_medium")).toBe("banner");
    expect(parsed.searchParams.get("utm_campaign")).toBe("ecosystem_bridge");
    expect(parsed.searchParams.get("utm_term")).toBe("science_park");
  });

  it("changes utm_term per org_type so analytics can segment by surface audience", () => {
    expect(new URL(buildBridgeCtaUrl("cluster")).searchParams.get("utm_term")).toBe("cluster");
    expect(new URL(buildBridgeCtaUrl("innovation_association")).searchParams.get("utm_term")).toBe("innovation_association");
    expect(new URL(buildBridgeCtaUrl("other")).searchParams.get("utm_term")).toBe("other");
  });
});
