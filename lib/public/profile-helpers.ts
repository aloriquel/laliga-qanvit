import { createServiceClient } from "@/lib/supabase/server";
import { selectHighlights, getTopDimensions } from "./profile-utils";
import type { DimensionKey, Dimension, PublicProfile } from "./profile-utils";

export { selectHighlights, getTopDimensions };
export type { DimensionKey, Dimension, PublicProfile };
export type { PublicEvaluation } from "./profile-utils";

type FeedbackDim = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  evidence_quotes: string[];
};

const DIMENSION_KEYS: DimensionKey[] = [
  "problem",
  "market",
  "solution",
  "team",
  "traction",
  "business_model",
  "gtm",
];

export async function getPublicProfileData(slug: string): Promise<PublicProfile | null> {
  const supabase = createServiceClient();

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("consent_public_profile", true)
    .maybeSingle();

  if (!startup) return null;

  const { data: evalRow } = await supabase
    .from("evaluations")
    .select(
      "score_problem, score_market, score_solution, score_team, score_traction, score_business_model, score_gtm, score_total, feedback, summary"
    )
    .eq("startup_id", startup.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evalRow) {
    return { startup: startup as PublicProfile["startup"], evaluation: null, highlights: [] };
  }

  const row = evalRow as Record<string, unknown>;
  const feedback = (row.feedback ?? {}) as Record<string, FeedbackDim>;

  const scoreMap: Record<DimensionKey, number> = {
    problem: Number(row.score_problem ?? 0),
    market: Number(row.score_market ?? 0),
    solution: Number(row.score_solution ?? 0),
    team: Number(row.score_team ?? 0),
    traction: Number(row.score_traction ?? 0),
    business_model: Number(row.score_business_model ?? 0),
    gtm: Number(row.score_gtm ?? 0),
  };

  const dimensions: Dimension[] = DIMENSION_KEYS.map((key) => ({
    key,
    score: scoreMap[key],
    strengths: (feedback[key]?.strengths ?? []).filter(
      (s): s is string => typeof s === "string"
    ),
  }));

  const highlights = selectHighlights(dimensions);

  return {
    startup: startup as PublicProfile["startup"],
    evaluation: {
      overall_score: Number(row.score_total ?? 0),
      summary: typeof row.summary === "string" ? row.summary : "",
      dimensions,
    },
    highlights,
  };
}
