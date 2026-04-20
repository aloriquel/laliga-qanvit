import { describe, it, expect } from "vitest";
import { renderAlertText, alertIcon } from "../alert-text";

describe("renderAlertText", () => {
  it("moved_up_division", () => {
    const text = renderAlertText("moved_up_division", { from: "seed", to: "growth" });
    expect(text).toContain("Growth");
    expect(text).toContain("subido");
  });

  it("moved_down_division", () => {
    const text = renderAlertText("moved_down_division", { from: "growth", to: "seed" });
    expect(text).toContain("Seed");
    expect(text).toContain("bajado");
  });

  it("new_top3_vertical", () => {
    const text = renderAlertText("new_top3_vertical", {
      vertical: "robotics_automation",
      division: "seed",
      new_rank: 2,
    });
    expect(text).toContain("Top 2");
    expect(text).toContain("Robotics");
    expect(text).toContain("grandes");
  });

  it("new_top10_vertical", () => {
    const text = renderAlertText("new_top10_vertical", {
      vertical: "agrifood",
      division: "ideation",
      new_rank: 7,
    });
    expect(text).toContain("Top 10");
    expect(text).toContain("AgriFood");
  });

  it("new_top10_division", () => {
    const text = renderAlertText("new_top10_division", { division: "elite" });
    expect(text).toContain("Elite");
    expect(text).toContain("10");
  });

  it("position_milestone national", () => {
    const text = renderAlertText("position_milestone", { scope: "national", from: 150, to: 80 });
    expect(text).toContain("#150");
    expect(text).toContain("#80");
    expect(text).toContain("nacional");
  });

  it("position_milestone division", () => {
    const text = renderAlertText("position_milestone", { scope: "division", from: 40, to: 18 });
    expect(text).toContain("división");
  });
});

describe("alertIcon", () => {
  it("returns emoji for each type", () => {
    expect(alertIcon("moved_up_division")).toBe("🚀");
    expect(alertIcon("moved_down_division")).toBe("↘️");
    expect(alertIcon("new_top3_vertical")).toBe("🥇");
    expect(alertIcon("new_top10_vertical")).toBe("🏅");
    expect(alertIcon("new_top10_division")).toBe("📊");
    expect(alertIcon("position_milestone")).toBe("⚡");
  });
});
