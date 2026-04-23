import { describe, it, expect } from "vitest";
import {
  batchDisplayLabel,
  batchSlug,
  isPreLaunchBatch,
  CURRENT_BATCH_STATUSES,
  DECK_UPLOAD_LIMIT_PER_BATCH,
  calculateNextBatchStart,
  type BatchStatus,
  type BatchQuarter,
  type Batch,
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

  it("matches the seeded slug for the active batch", () => {
    expect(batchSlug("Q2", 2026)).toBe("q2-2026");
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

describe("DECK_UPLOAD_LIMIT_PER_BATCH", () => {
  it("is 2", () => {
    expect(DECK_UPLOAD_LIMIT_PER_BATCH).toBe(2);
  });
});

describe("isPreLaunchBatch", () => {
  const base: Batch = {
    id: "test-id",
    slug: "pre-lanzamiento-2026",
    quarter: "Q0_HISTORICO",
    year: 2026,
    display_name: "Pre-Lanzamiento",
    starts_at: "2026-04-23T10:00:00+00:00",
    ends_at: "2026-06-30T21:59:59+00:00",
    status: "active",
    closed_at: null,
    winners_computed_at: "1970-01-01T00:00:00+00:00",
  };

  it("returns true for a Q0_HISTORICO batch with 1970 sentinel", () => {
    expect(isPreLaunchBatch(base)).toBe(true);
  });

  it("returns false for a regular Q3 batch", () => {
    const q3: Batch = { ...base, slug: "q3-2026", quarter: "Q3", winners_computed_at: null };
    expect(isPreLaunchBatch(q3)).toBe(false);
  });

  it("returns false for Q0_HISTORICO with a real winners_computed_at", () => {
    const legacy: Batch = { ...base, winners_computed_at: "2024-12-31T23:59:59+00:00" };
    expect(isPreLaunchBatch(legacy)).toBe(false);
  });

  it("returns false when winners_computed_at is null", () => {
    expect(isPreLaunchBatch({ ...base, winners_computed_at: null })).toBe(false);
  });
});

describe("calculateNextBatchStart", () => {
  it("returns Q2 start after Q1", () => {
    const date = calculateNextBatchStart("Q1", 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(3); // April = 3
    expect(date.getDate()).toBe(1);
  });

  it("returns Q3 start after Q2", () => {
    const date = calculateNextBatchStart("Q2", 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // July = 6
    expect(date.getDate()).toBe(1);
  });

  it("returns Q4 start after Q3", () => {
    const date = calculateNextBatchStart("Q3", 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9); // October = 9
    expect(date.getDate()).toBe(1);
  });

  it("returns Q1 of next year after Q4", () => {
    const date = calculateNextBatchStart("Q4", 2026);
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(0); // January = 0
    expect(date.getDate()).toBe(1);
  });

  it("returns next year Jan 1 for Q0_HISTORICO", () => {
    const date = calculateNextBatchStart("Q0_HISTORICO", 2024);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });
});
