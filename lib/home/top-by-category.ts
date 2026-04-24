import { createServiceClient } from "@/lib/supabase/server";
import {
  DIVISIONS_IN_ORDER,
  VERTICALS_IN_ORDER,
  DIVISION_LABELS,
  VERTICAL_LABELS,
  DIVISION_SUBTITLES,
  type Division,
  type Vertical,
} from "./categories";

export type RankedStartup = {
  kind: "startup";
  id: string;
  slug: string;
  name: string;
  one_liner: string | null;
  division: string;
  vertical: string;
  current_score: number;
  current_rank_in_category: number;
  logo_url: string | null;
};

export type EmptySlot = {
  kind: "empty";
  category_type: "division" | "vertical";
  category_value: string;
  slot_position: number;
};

export type CategoryItem = RankedStartup | EmptySlot;

export type CategoryRow = {
  category_type: "division" | "vertical";
  category_value: string;
  title: string;
  subtitle?: string;
  items: CategoryItem[];
};

export type EmptyCategory = {
  category_type: "division" | "vertical";
  category_value: string;
  label: string;
  subtitle?: string;
};

const SLOTS = 5;

type StandingRow = {
  startup_id: string | null;
  name: string | null;
  slug: string | null;
  one_liner: string | null;
  logo_url: string | null;
  current_division: string | null;
  current_vertical: string | null;
  current_score: number | null;
  rank_division: number | null;
  rank_division_vertical: number | null;
};

function toRanked(
  row: StandingRow,
  rankField: "rank_division" | "rank_division_vertical"
): RankedStartup | null {
  if (!row.startup_id || !row.name || !row.slug || !row.current_division || !row.current_vertical) return null;
  return {
    kind: "startup",
    id: row.startup_id,
    slug: row.slug,
    name: row.name,
    one_liner: row.one_liner,
    division: row.current_division,
    vertical: row.current_vertical,
    current_score: row.current_score ?? 0,
    current_rank_in_category: row[rankField] ?? 0,
    logo_url: row.logo_url,
  };
}

function fillWithEmptySlots(
  startups: RankedStartup[],
  categoryType: "division" | "vertical",
  categoryValue: string
): CategoryItem[] {
  const items: CategoryItem[] = [...startups];
  for (let i = startups.length + 1; i <= SLOTS; i++) {
    items.push({
      kind: "empty",
      category_type: categoryType,
      category_value: categoryValue,
      slot_position: i,
    });
  }
  return items;
}

/**
 * Single DB round-trip that fetches every league_standings row we need for the
 * homepage carousels. The page slices it locally into per-division and
 * per-vertical groups.
 */
async function fetchAllStandings(): Promise<StandingRow[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("league_standings")
    .select(
      "startup_id, name, slug, one_liner, logo_url, current_division, current_vertical, current_score, rank_division, rank_division_vertical"
    )
    .order("current_score", { ascending: false });
  return (data ?? []) as StandingRow[];
}

export async function getHomeCategoryRows(): Promise<{
  activeDivisionRows: CategoryRow[];
  activeVerticalRows: CategoryRow[];
  emptyCategories: EmptyCategory[];
  totalStartups: number;
}> {
  const standings = await fetchAllStandings();

  const activeDivisionRows: CategoryRow[] = [];
  const emptyDivisions: EmptyCategory[] = [];

  for (const d of DIVISIONS_IN_ORDER) {
    const top = standings
      .filter((r) => r.current_division === d)
      .slice(0, SLOTS)
      .map((r) => toRanked(r, "rank_division"))
      .filter((r): r is RankedStartup => r !== null);
    if (top.length > 0) {
      activeDivisionRows.push({
        category_type: "division",
        category_value: d,
        title: DIVISION_LABELS[d as Division],
        subtitle: DIVISION_SUBTITLES[d as Division],
        items: fillWithEmptySlots(top, "division", d),
      });
    } else {
      emptyDivisions.push({
        category_type: "division",
        category_value: d,
        label: DIVISION_LABELS[d as Division],
        subtitle: DIVISION_SUBTITLES[d as Division],
      });
    }
  }

  const activeVerticalRows: CategoryRow[] = [];
  const emptyVerticals: EmptyCategory[] = [];

  for (const v of VERTICALS_IN_ORDER) {
    const top = standings
      .filter((r) => r.current_vertical === v)
      .slice(0, SLOTS)
      .map((r) => toRanked(r, "rank_division_vertical"))
      .filter((r): r is RankedStartup => r !== null);
    if (top.length > 0) {
      activeVerticalRows.push({
        category_type: "vertical",
        category_value: v,
        title: VERTICAL_LABELS[v],
        items: fillWithEmptySlots(top, "vertical", v),
      });
    } else {
      emptyVerticals.push({
        category_type: "vertical",
        category_value: v,
        label: VERTICAL_LABELS[v],
      });
    }
  }

  // Divisiones primero (orden lógico) y luego verticales (orden del enum).
  const emptyCategories: EmptyCategory[] = [...emptyDivisions, ...emptyVerticals];

  return {
    activeDivisionRows,
    activeVerticalRows,
    emptyCategories,
    totalStartups: standings.length,
  };
}
