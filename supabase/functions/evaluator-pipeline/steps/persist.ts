import { getServiceClient } from "../_shared/supabase.ts";
import { calculateWeightedScore, scoreToPhase, type Phase } from "../_shared/weights.ts";
import { estimateCost } from "../_shared/openai.ts";
import type { ClassifyOutput } from "./classify.ts";
import type { EvaluateOutput } from "./evaluate.ts";
import type { EmbeddedChunk } from "./embed_chunks.ts";

type PersistArgs = {
  deckId: string;
  startupId: string;
  rawText: string;
  pageCount: number;
  language: string;
  classification: ClassifyOutput;
  evaluation: EvaluateOutput;
  chunks: EmbeddedChunk[];
  embeddingTokens: number;
  pipelineStartMs: number;
};

export type PersistResult = {
  evaluationId: string;
  assignedDivision: Phase;
  assignedVertical: string;
};

export async function persistResults(args: PersistArgs): Promise<PersistResult> {
  const db = getServiceClient();

  // Determine final division (score override if diverges from classifier)
  const classifierPhase = args.classification.detected_phase as Phase;
  const computedScore = calculateWeightedScore(args.evaluation.scores, classifierPhase);
  const scorePhase = scoreToPhase(computedScore);
  const assignedDivision = scorePhase;
  const assignedVertical = args.classification.detected_vertical;

  // Log divergence in feedback.notes if classifier ≠ score phase
  const feedbackPayload: Record<string, unknown> = { ...args.evaluation.feedback };
  if (classifierPhase !== scorePhase) {
    feedbackPayload["_notes"] = `Classifier detected ${classifierPhase} but score (${computedScore.toFixed(1)}) maps to ${scorePhase}. Score wins per rubric §5.`;
  }
  if (args.evaluation.degraded) {
    feedbackPayload["degraded_mode"] = true;
    feedbackPayload["degraded_reason"] = args.evaluation.degraded_reason ?? "";
  }

  const latencyMs = Math.round(Date.now() - args.pipelineStartMs);
  const totalTokensIn = args.classification.tokens_input + args.evaluation.tokens_input;
  const totalTokensOut = args.classification.tokens_output + args.evaluation.tokens_output;
  const costEstimate =
    estimateCost("claude-haiku-4-5-20251001", args.classification.tokens_input, args.classification.tokens_output) +
    estimateCost(args.evaluation.evaluator_model, args.evaluation.tokens_input, args.evaluation.tokens_output) +
    (args.embeddingTokens / 1000) * 0.00002; // text-embedding-3-small price

  // --- INSERT deck_chunks (batch) ---
  if (args.chunks.length > 0) {
    const chunkRows = args.chunks.map((c) => ({
      deck_id: args.deckId,
      chunk_index: c.chunk_index,
      content: c.content,
      token_count: c.token_count,
      embedding: `[${c.embedding.join(",")}]`, // pgvector expects array literal
      metadata: c.metadata,
    }));

    const { error: chunksError } = await db.from("deck_chunks").insert(chunkRows);
    if (chunksError) throw new Error(`deck_chunks insert: ${chunksError.message}`);
  }

  // --- INSERT evaluation ---
  const evaluationId = crypto.randomUUID();
  const { error: evalError } = await db.from("evaluations").insert({
    id: evaluationId,
    deck_id: args.deckId,
    startup_id: args.startupId,
    assigned_division: assignedDivision,
    assigned_vertical: assignedVertical,
    classification_confidence: args.classification.phase_confidence,
    score_problem: args.evaluation.scores.problem,
    score_market: args.evaluation.scores.market,
    score_solution: args.evaluation.scores.solution,
    score_team: args.evaluation.scores.team,
    score_traction: args.evaluation.scores.traction,
    score_business_model: args.evaluation.scores.business_model,
    score_gtm: args.evaluation.scores.gtm,
    score_total: computedScore,
    feedback: feedbackPayload,
    summary: args.evaluation.summary,
    next_actions: args.evaluation.next_actions,
    prompt_version: "v1",
    rubric_version: "v1",
    classifier_model: "claude-haiku-4-5-20251001",
    evaluator_model: args.evaluation.evaluator_model,
    tokens_input: totalTokensIn,
    tokens_output: totalTokensOut,
    cost_estimate_usd: costEstimate,
    latency_ms: latencyMs,
  });

  if (evalError) {
    if (evalError.code === "23505") {
      // Unique constraint: already evaluated with this prompt_version/rubric_version — idempotent noop
      const { data: existing } = await db
        .from("evaluations")
        .select("id, assigned_division, assigned_vertical")
        .eq("deck_id", args.deckId)
        .eq("prompt_version", "v1")
        .single();
      if (existing) return { evaluationId: existing.id, assignedDivision: existing.assigned_division as Phase, assignedVertical: existing.assigned_vertical };
    }
    throw new Error(`evaluations insert: ${evalError.message}`);
  }

  // --- UPDATE decks: status='evaluated', raw_text, page_count, language ---
  const { error: deckUpdateError } = await db
    .from("decks")
    .update({
      status: "evaluated",
      processed_at: new Date().toISOString(),
      raw_text: args.rawText,
      page_count: args.pageCount,
      language: args.language,
    })
    .eq("id", args.deckId);

  if (deckUpdateError) throw new Error(`decks update: ${deckUpdateError.message}`);

  // The trigger sync_startup_current_eval fires on INSERT evaluations → refreshes league_standings.

  return { evaluationId, assignedDivision, assignedVertical };
}
