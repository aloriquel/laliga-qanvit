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
  it("returns zero active rows and all 14 empty categories when DB is empty", async () => {
    const { activeDivisionRows, activeVerticalRows, emptyCategories, totalStartups } = await getHomeCategoryRows();
    expect(totalStartups).toBe(0);
    expect(activeDivisionRows).toHaveLength(0);
    expect(activeVerticalRows).toHaveLength(0);
    expect(emptyCategories).toHaveLength(14);
    // Divisiones primero (4), luego verticales (10).
    expect(emptyCategories.slice(0, 4).every((c) => c.category_type === "division")).toBe(true);
    expect(emptyCategories.slice(4).every((c) => c.category_type === "vertical")).toBe(true);
  });

  it("places real startups first and fills the row tail with empty slots", async () => {
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

    const { activeDivisionRows, activeVerticalRows, totalStartups } = await getHomeCategoryRows();
    expect(totalStartups).toBe(1);

    const seed = activeDivisionRows.find((r) => r.category_value === "seed");
    expect(seed?.items).toHaveLength(5);
    expect(seed?.items[0]).toMatchObject({ kind: "startup", slug: "qanvit", current_rank_in_category: 1 });
    expect(seed?.items.slice(1).every((i) => i.kind === "empty")).toBe(true);

    const deeptech = activeVerticalRows.find((r) => r.category_value === "deeptech_ai");
    expect(deeptech).toBeTruthy();
  });

  it("active rows contain only populated categories, no placeholders in the active list", async () => {
    mockData.push({
      startup_id: "s1",
      name: "Qanvit",
      slug: "qanvit",
      one_liner: null,
      logo_url: null,
      current_division: "seed",
      current_vertical: "deeptech_ai",
      current_score: 87,
      rank_division: 1,
      rank_division_vertical: 1,
    });

    const { activeDivisionRows, activeVerticalRows } = await getHomeCategoryRows();
    expect(activeDivisionRows).toHaveLength(1);
    expect(activeDivisionRows[0].category_value).toBe("seed");
    expect(activeVerticalRows).toHaveLength(1);
    expect(activeVerticalRows[0].category_value).toBe("deeptech_ai");
  });

  it("assigns sequential slot_position to empty placeholders inside an active row", async () => {
    mockData.push({
      startup_id: "s1",
      name: "Qanvit",
      slug: "qanvit",
      one_liner: null,
      logo_url: null,
      current_division: "seed",
      current_vertical: "deeptech_ai",
      current_score: 87,
      rank_division: 1,
      rank_division_vertical: 1,
    });

    const { activeDivisionRows } = await getHomeCategoryRows();
    const seed = activeDivisionRows.find((r) => r.category_value === "seed")!;
    const emptyPositions = seed.items
      .filter((i) => i.kind === "empty")
      .map((i) => (i.kind === "empty" ? i.slot_position : -1));
    // Qanvit occupies slot 1 → emptys span 2..5.
    expect(emptyPositions).toEqual([2, 3, 4, 5]);
  });

  it("categorías sin startups se devuelven en emptyCategories, no en activeRows", async () => {
    mockData.push({
      startup_id: "s1",
      name: "Qanvit",
      slug: "qanvit",
      one_liner: null,
      logo_url: null,
      current_division: "seed",
      current_vertical: "deeptech_ai",
      current_score: 87,
      rank_division: 1,
      rank_division_vertical: 1,
    });

    const { activeDivisionRows, activeVerticalRows, emptyCategories } = await getHomeCategoryRows();
    // 4 divisions total, 1 active → 3 empty; 10 verticals total, 1 active → 9 empty; total 12.
    expect(emptyCategories).toHaveLength(12);

    const activeDivValues = new Set(activeDivisionRows.map((r) => r.category_value));
    const activeVertValues = new Set(activeVerticalRows.map((r) => r.category_value));

    for (const c of emptyCategories) {
      if (c.category_type === "division") {
        expect(activeDivValues.has(c.category_value)).toBe(false);
      } else {
        expect(activeVertValues.has(c.category_value)).toBe(false);
      }
    }
  });
});
