import { getServiceClient } from "../_shared/supabase.ts";
import { calculateWeightedScore, scoreToPhase, type Phase } from "../_shared/weights.ts";
import { estimateCost } from "../_shared/openai.ts";
import { getDivisionFromFundingStageDeno } from "../_shared/funding-stage.ts";
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
  fundingStage: string | null;
};

export type PersistResult = {
  evaluationId: string;
  assignedDivision: Phase;
  assignedVertical: string;
};

export async function persistResults(args: PersistArgs): Promise<PersistResult> {
  const db = getServiceClient();

  // Determine final division:
  // - If startup declared funding_stage → use that mapping (primary source per PROMPT_11)
  // - Otherwise fall back to score-derived phase (pre-PROMPT_11 behaviour)
  const classifierPhase = args.classification.detected_phase as Phase;
  const computedScore = calculateWeightedScore(args.evaluation.scores, classifierPhase);
  const scorePhase = scoreToPhase(computedScore);

  let assignedDivision: Phase;
  if (args.fundingStage) {
    const mapped = getDivisionFromFundingStageDeno(args.fundingStage) as Phase | null;
    assignedDivision = mapped ?? scorePhase;
  } else {
    assignedDivision = scorePhase;
  }
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

  // --- UPSERT deck_chunks (idempotent on retry) ---
  if (args.chunks.length > 0) {
    const chunkRows = args.chunks.map((c) => ({
      deck_id: args.deckId,
      chunk_index: c.chunk_index,
      content: c.content,
      token_count: c.token_count,
      embedding: `[${c.embedding.join(",")}]`, // pgvector expects array literal
      metadata: c.metadata,
    }));

    const { error: chunksError } = await db
      .from("deck_chunks")
      .upsert(chunkRows, { onConflict: "deck_id,chunk_index" });
    if (chunksError) throw new Error(`deck_chunks upsert: ${chunksError.message}`);
  }

  // --- UPSERT evaluation (idempotent on retry) ---
  // Fetch existing id first so foreign keys to evaluations.id remain stable across retries.
  const { data: existingEval } = await db
    .from("evaluations")
    .select("id")
    .eq("deck_id", args.deckId)
    .eq("prompt_version", "v1")
    .eq("rubric_version", "v1")
    .maybeSingle();

  const evaluationId = existingEval?.id ?? crypto.randomUUID();

  const { error: evalError } = await db.from("evaluations").upsert({
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
  }, { onConflict: "deck_id,prompt_version,rubric_version" });

  if (evalError) throw new Error(`evaluations upsert: ${evalError.message}`);

  // --- INSERT discrepancy if evaluator flagged one ---
  const discrepancy = args.evaluation.funding_stage_discrepancy;
  if (args.fundingStage && discrepancy && discrepancy.suspected_stage && discrepancy.severity) {
    const { error: discErr } = await db
      .from("admin_evaluator_discrepancies" as never)
      .insert({
        startup_id: args.startupId,
        evaluation_id: evaluationId,
        declared_funding_stage: args.fundingStage,
        suspected_funding_stage: discrepancy.suspected_stage,
        severity: discrepancy.severity,
        evaluator_reasoning: discrepancy.reasoning ?? "",
        status: "pending",
      } as never);
    if (discErr) {
      console.error(JSON.stringify({ deck_id: args.deckId, step: "discrepancy_insert", ok: false, error: discErr.message }));
    } else {
      console.log(JSON.stringify({ deck_id: args.deckId, step: "discrepancy_insert", ok: true, severity: discrepancy.severity }));
    }
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
