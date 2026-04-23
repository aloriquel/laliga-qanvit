import { describe, it, expect } from "vitest";
import {
  FUNDING_STAGES,
  FUNDING_STAGE_TO_DIVISION,
  FUNDING_STAGE_IDS,
  getDivisionFromFundingStage,
  getFundingStageLabel,
  isFundingStage,
  type FundingStage,
} from "../funding-stage";

describe("FUNDING_STAGES dataset", () => {
  it("has exactly 7 stages", () => {
    expect(FUNDING_STAGES.length).toBe(7);
  });

  it("all stage ids are unique", () => {
    const ids = FUNDING_STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(7);
  });

  it("every stage has a non-empty label and description", () => {
    for (const stage of FUNDING_STAGES) {
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.description.length).toBeGreaterThan(0);
    }
  });
});

describe("FUNDING_STAGE_TO_DIVISION mapping", () => {
  it("pre_seed maps to ideation", () => {
    expect(FUNDING_STAGE_TO_DIVISION.pre_seed).toBe("ideation");
  });

  it("seed maps to seed", () => {
    expect(FUNDING_STAGE_TO_DIVISION.seed).toBe("seed");
  });

  it("series_a maps to growth", () => {
    expect(FUNDING_STAGE_TO_DIVISION.series_a).toBe("growth");
  });

  it("series_b, series_c, series_d_plus all map to elite", () => {
    expect(FUNDING_STAGE_TO_DIVISION.series_b).toBe("elite");
    expect(FUNDING_STAGE_TO_DIVISION.series_c).toBe("elite");
    expect(FUNDING_STAGE_TO_DIVISION.series_d_plus).toBe("elite");
  });

  it("bootstrapped maps to seed (default)", () => {
    expect(FUNDING_STAGE_TO_DIVISION.bootstrapped).toBe("seed");
  });

  it("covers all 7 stages", () => {
    for (const id of FUNDING_STAGE_IDS) {
      expect(FUNDING_STAGE_TO_DIVISION[id]).toBeDefined();
    }
  });
});

describe("getDivisionFromFundingStage", () => {
  it("returns correct division for each stage", () => {
    expect(getDivisionFromFundingStage("pre_seed")).toBe("ideation");
    expect(getDivisionFromFundingStage("series_a")).toBe("growth");
    expect(getDivisionFromFundingStage("series_d_plus")).toBe("elite");
  });

  it("returns null for null input", () => {
    expect(getDivisionFromFundingStage(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getDivisionFromFundingStage(undefined)).toBeNull();
  });
});

describe("getFundingStageLabel", () => {
  it("returns Spanish label for known stages", () => {
    expect(getFundingStageLabel("series_a")).toBe("Serie A");
    expect(getFundingStageLabel("pre_seed")).toBe("Pre-seed");
    expect(getFundingStageLabel("series_d_plus")).toBe("Serie D+");
    expect(getFundingStageLabel("bootstrapped")).toBe("Bootstrapped");
  });

  it("returns null for null or undefined", () => {
    expect(getFundingStageLabel(null)).toBeNull();
    expect(getFundingStageLabel(undefined)).toBeNull();
  });

  it("returns null for unknown string", () => {
    expect(getFundingStageLabel("unknown_stage")).toBeNull();
  });
});

describe("isFundingStage", () => {
  it("returns true for all valid stage ids", () => {
    for (const id of FUNDING_STAGE_IDS) {
      expect(isFundingStage(id)).toBe(true);
    }
  });

  it("returns false for invalid strings", () => {
    expect(isFundingStage("series_e")).toBe(false);
    expect(isFundingStage("angel")).toBe(false);
    expect(isFundingStage("")).toBe(false);
  });

  it("returns false for non-string values", () => {
    expect(isFundingStage(null)).toBe(false);
    expect(isFundingStage(42)).toBe(false);
    expect(isFundingStage(undefined)).toBe(false);
  });
});

describe("bootstrapped division override logic", () => {
  it("bootstrapped → seed unless startup is already growth/elite", () => {
    // Simulates the API endpoint logic
    function resolveBootstrappedDivision(
      fundingStage: FundingStage,
      currentDivision: string | null
    ): string | null {
      const mapped = getDivisionFromFundingStage(fundingStage);
      if (
        fundingStage === "bootstrapped" &&
        currentDivision &&
        ["growth", "elite"].includes(currentDivision)
      ) {
        return currentDivision;
      }
      return mapped;
    }

    expect(resolveBootstrappedDivision("bootstrapped", null)).toBe("seed");
    expect(resolveBootstrappedDivision("bootstrapped", "seed")).toBe("seed");
    expect(resolveBootstrappedDivision("bootstrapped", "growth")).toBe("growth");
    expect(resolveBootstrappedDivision("bootstrapped", "elite")).toBe("elite");
    expect(resolveBootstrappedDivision("bootstrapped", "ideation")).toBe("seed");
  });
});
