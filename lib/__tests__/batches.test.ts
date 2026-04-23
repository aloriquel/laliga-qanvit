import { describe, it, expect } from "vitest";
import {
  batchDisplayLabel,
  batchSlug,
  CURRENT_BATCH_STATUSES,
  type BatchStatus,
  type BatchQuarter,
} from "../batches";

describe("batchDisplayLabel", () => {
  it("returns 'Batch 0 (Histórico)' for Q0_HISTORICO", () => {
    expect(batchDisplayLabel("Q0_HISTORICO", 2024)).toBe("Batch 0 (Histórico)");
  });

  it("ignores year for Q0_HISTORICO", () => {
    expect(batchDisplayLabel("Q0_HISTORICO", 9999)).toBe("Batch 0 (Histórico)");
  });

  it("formats quarterly batches as '<Quarter> <Year>'", () => {
    expect(batchDisplayLabel("Q1", 2026)).toBe("Q1 2026");
    expect(batchDisplayLabel("Q2", 2026)).toBe("Q2 2026");
    expect(batchDisplayLabel("Q3", 2026)).toBe("Q3 2026");
    expect(batchDisplayLabel("Q4", 2026)).toBe("Q4 2026");
  });

  it("works across multiple years", () => {
    expect(batchDisplayLabel("Q1", 2027)).toBe("Q1 2027");
    expect(batchDisplayLabel("Q4", 2099)).toBe("Q4 2099");
  });
});

describe("batchSlug", () => {
  it("returns 'batch-0-historico' for Q0_HISTORICO", () => {
    expect(batchSlug("Q0_HISTORICO", 2024)).toBe("batch-0-historico");
  });

  it("ignores year for Q0_HISTORICO", () => {
    expect(batchSlug("Q0_HISTORICO", 9999)).toBe("batch-0-historico");
  });

  it("formats quarterly batches as lowercase '<quarter>-<year>'", () => {
    expect(batchSlug("Q1", 2026)).toBe("q1-2026");
    expect(batchSlug("Q2", 2026)).toBe("q2-2026");
    expect(batchSlug("Q3", 2026)).toBe("q3-2026");
    expect(batchSlug("Q4", 2026)).toBe("q4-2026");
  });

  it("matches the seeded slug for the first real batch", () => {
    expect(batchSlug("Q3", 2026)).toBe("q3-2026");
  });
});

describe("CURRENT_BATCH_STATUSES", () => {
  it("contains 'active' and 'upcoming'", () => {
    expect(CURRENT_BATCH_STATUSES).toContain("active");
    expect(CURRENT_BATCH_STATUSES).toContain("upcoming");
  });

  it("does not contain 'closed' or 'archived'", () => {
    expect(CURRENT_BATCH_STATUSES).not.toContain("closed");
    expect(CURRENT_BATCH_STATUSES).not.toContain("archived");
  });
});
