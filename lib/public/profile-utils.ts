export type DimensionKey =
  | "problem"
  | "market"
  | "solution"
  | "team"
  | "traction"
  | "business_model"
  | "gtm";

export type Dimension = {
  key: DimensionKey;
  score: number;
  strengths: string[];
};

export type PublicEvaluation = {
  overall_score: number;
  summary: string;
  dimensions: Dimension[];
};

export type PublicProfile = {
  startup: Record<string, unknown> & {
    id: string;
    name: string;
    slug: string;
    one_liner: string | null;
    website: string | null;
    owner_id: string;
    show_public_timeline: boolean;
    consent_public_profile: boolean;
    is_public: boolean;
    // Added in 0036/0037
    region_ca: string | null;
    region_province: string | null;
    consent_public_deck: boolean;
    funding_stage: string | null;
    is_raising: boolean;
  };
  evaluation: PublicEvaluation | null;
  highlights: string[];
};

const SEMANTIC_DEDUP_LEN = 15;
const MAX_HIGHLIGHT_CHARS = 80;

function trimToWordBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "").trim().replace(/[,;:(]+$/, "");
}

export function selectHighlights(dimensions: Dimension[]): string[] {
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const selected: string[] = [];

  for (const dim of sorted) {
    for (const raw of dim.strengths) {
      if (selected.length >= 3) break;
      const candidate = trimToWordBoundary(raw.trim(), MAX_HIGHLIGHT_CHARS);
      if (!candidate) continue;

      const lower = candidate.toLowerCase();
      const isDupe = selected.some((existing) => {
        const el = existing.toLowerCase();
        for (let i = 0; i <= lower.length - SEMANTIC_DEDUP_LEN; i++) {
          if (el.includes(lower.slice(i, i + SEMANTIC_DEDUP_LEN))) return true;
        }
        return false;
      });

      if (!isDupe) selected.push(candidate);
    }
    if (selected.length >= 3) break;
  }

  return selected;
}

export function getTopDimensions(dimensions: Dimension[], n = 3): Dimension[] {
  return [...dimensions].sort((a, b) => b.score - a.score).slice(0, n);
}
