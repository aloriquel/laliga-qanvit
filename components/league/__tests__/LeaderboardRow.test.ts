import { describe, it, expect } from "vitest";
import { buildStartupHref } from "../../../lib/league/url-helpers";

// Note: full component rendering requires jsdom + @testing-library/react (not configured).
// These tests cover the href-construction logic that LeaderboardRow uses.

describe("buildStartupHref", () => {
  it("builds correct href for a simple slug", () => {
    expect(buildStartupHref("orbea-robotics")).toBe("/startup/orbea-robotics");
  });

  it("builds correct href for slugs with numbers", () => {
    expect(buildStartupHref("startup-2024")).toBe("/startup/startup-2024");
  });

  it("handles slugs with multiple hyphens", () => {
    expect(buildStartupHref("my-super-cool-startup")).toBe(
      "/startup/my-super-cool-startup"
    );
  });

  it("always produces paths rooted at /startup/", () => {
    const href = buildStartupHref("any-slug");
    expect(href.startsWith("/startup/")).toBe(true);
  });

  it("the slug appears verbatim in the path", () => {
    const slug = "deeptech-ai-solutions";
    expect(buildStartupHref(slug)).toContain(slug);
  });
});
