import { describe, it, expect, vi, beforeEach } from "vitest";

const mockData: unknown[] = [];
const mockService = {
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: mockData, error: null }),
    }),
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => mockService,
}));

import { getHomeCategoryRows } from "../top-by-category";

beforeEach(() => {
  mockData.length = 0;
});

describe("getHomeCategoryRows", () => {
  it("fills every division row to exactly 5 slots", async () => {
    const { divisionRows } = await getHomeCategoryRows();
    expect(divisionRows).toHaveLength(4);
    for (const row of divisionRows) {
      expect(row.items).toHaveLength(5);
      expect(row.items.every((i) => i.kind === "empty")).toBe(true);
    }
  });

  it("fills every vertical row to exactly 5 slots", async () => {
    const { verticalRows } = await getHomeCategoryRows();
    expect(verticalRows).toHaveLength(10);
    for (const row of verticalRows) {
      expect(row.items).toHaveLength(5);
    }
  });

  it("places real startups first and fills the tail with empty slots", async () => {
    mockData.push({
      startup_id: "s1",
      name: "Qanvit",
      slug: "qanvit",
      one_liner: "AI agents for CVC",
      logo_url: null,
      current_division: "seed",
      current_vertical: "deeptech_ai",
      current_score: 87,
      rank_division: 1,
      rank_division_vertical: 1,
    });

    const { divisionRows, verticalRows, totalStartups } = await getHomeCategoryRows();
    expect(totalStartups).toBe(1);

    const seed = divisionRows.find((r) => r.category_value === "seed");
    expect(seed?.items[0]).toMatchObject({ kind: "startup", slug: "qanvit", current_rank_in_category: 1 });
    expect(seed?.items.slice(1).every((i) => i.kind === "empty")).toBe(true);

    // Deeptech should come first (more populated).
    expect(verticalRows[0].category_value).toBe("deeptech_ai");
  });

  it("assigns sequential slot_position to empty placeholders", async () => {
    const { divisionRows } = await getHomeCategoryRows();
    const ideation = divisionRows.find((r) => r.category_value === "ideation");
    const positions = ideation!.items.map((i) => (i.kind === "empty" ? i.slot_position : -1));
    expect(positions).toEqual([1, 2, 3, 4, 5]);
  });
});
