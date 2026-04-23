import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getServiceClient } from "./_shared/supabase.ts";
import { extractText } from "./steps/extract_text.ts";
import { chunkText } from "./steps/chunk_text.ts";
import { embedChunks } from "./steps/embed_chunks.ts";
import { classifyDeck } from "./steps/classify.ts";
import { evaluateWithRetry } from "./steps/evaluate.ts";
import { persistResults } from "./steps/persist.ts";
import { notifyStartup } from "./steps/notify.ts";
import type { Phase } from "./_shared/weights.ts";
import { getFundingStageLabelDeno, getDivisionFromFundingStageDeno } from "./_shared/funding-stage.ts";

serve(async (req) => {

  const pipelineStart = Date.now();

  let deckId = "";
  try {
    const body = await req.json();
    deckId = body.deck_id as string;
    if (!deckId) throw new Error("deck_id is required");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const db = getServiceClient();

  // Mark as processing immediately
  await db.from("decks").update({ status: "processing" }).eq("id", deckId);

  console.log(JSON.stringify({ deck_id: deckId, step: "start", ok: true }));

  try {
    // ── STEP 2: Get deck record + startup info ────────────────────────────
    const { data: deck, error: deckError } = await db
      .from("decks")
      .select("id, startup_id, storage_path, version")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) throw new Error(`Deck not found: ${deckError?.message}`);

    const { data: startup, error: startupError } = await db
      .from("startups")
      .select("id, name, slug, funding_stage")
      .eq("id", deck.startup_id)
      .single();

    if (startupError || !startup) throw new Error(`Startup not found: ${startupError?.message}`);

    // Build funding stage context for evaluator prompt
    const fundingStage = (startup as any).funding_stage as string | null;
    const fundingStageLabel = getFundingStageLabelDeno(fundingStage);
    const fundingDivision = getDivisionFromFundingStageDeno(fundingStage);
    const fundingStageContext = fundingStageLabel
      ? `[CONTEXTO DE LA STARTUP]\n- Fase declarada por la startup: ${fundingStageLabel}\n- División resultante: ${fundingDivision ?? "desconocida"}\n\nAl scorear, usa esta fase declarada como referencia. NO reasignes división automáticamente basándote en el deck — respeta la autodeclaración.\n\nSi detectas discrepancia GRAVE entre la fase declarada y lo que ves en el deck (ejemplo: declara Serie A pero el deck muestra solo MVP sin clientes, o declara pre-seed pero el deck muestra $5M ARR y 50 empleados), incluye en tu respuesta el campo "funding_stage_discrepancy" con:\n{\n  "suspected_stage": "<la fase que tú inferirías>",\n  "severity": "low|medium|high",\n  "reasoning": "<explicación breve>"\n}\n\nSi no hay discrepancia significativa, omite ese campo.`
      : "";

    // Get owner email for notification
    const { data: profile } = await db
      .from("profiles")
      .select("email")
      .eq("id", (await db.from("startups").select("owner_id").eq("id", deck.startup_id).single()).data?.owner_id ?? "")
      .single();

    // ── STEP 2: Download PDF from Storage ────────────────────────────────
    const { data: fileData, error: downloadError } = await db.storage
      .from("decks")
      .download(deck.storage_path);

    if (downloadError || !fileData) throw new Error(`Storage download failed: ${downloadError?.message}`);

    const pdfBuffer = new Uint8Array(await fileData.arrayBuffer());
    console.log(JSON.stringify({ deck_id: deckId, step: "download", ok: true, bytes: pdfBuffer.length }));

    // ── STEP 3: Extract text ───────────────────────────────────────────────
    const { text, page_count, language } = await extractText(pdfBuffer);
    console.log(JSON.stringify({ deck_id: deckId, step: "extract_text", ok: true, chars: text.length, pages: page_count, language }));

    // ── STEP 4: Update raw_text immediately (partial progress) ─────────────
    await db.from("decks").update({ raw_text: text, page_count, language }).eq("id", deckId);

    // ── STEP 5: Chunk text ─────────────────────────────────────────────────
    const chunks = chunkText(text);
    console.log(JSON.stringify({ deck_id: deckId, step: "chunk_text", ok: true, chunks: chunks.length }));

    // ── STEP 6: Embed chunks ───────────────────────────────────────────────
    const embeddedChunks = await embedChunks(chunks);
    const embeddingTokens = embeddedChunks.reduce((sum, c) => sum + c.token_count, 0);
    console.log(JSON.stringify({ deck_id: deckId, step: "embed_chunks", ok: true, chunks: embeddedChunks.length, tokens: embeddingTokens }));

    // ── STEP 8: Classify ───────────────────────────────────────────────────
    const classification = await classifyDeck(text);
    console.log(JSON.stringify({
      deck_id: deckId, step: "classify", ok: true,
      phase: classification.detected_phase, vertical: classification.detected_vertical,
      confidence: classification.phase_confidence,
    }));

    // ── STEP 9: Evaluate with retry/fallback ──────────────────────────────
    const evaluation = await evaluateWithRetry({
      deckText: text,
      phase: classification.detected_phase as Phase,
      vertical: classification.detected_vertical,
      fundingStageContext,
    });
    console.log(JSON.stringify({
      deck_id: deckId, step: "evaluate", ok: true,
      model: evaluation.evaluator_model, degraded: evaluation.degraded,
      score_total: evaluation.score_total,
    }));

    // ── STEPS 10-12: Persist ───────────────────────────────────────────────
    const { evaluationId, assignedDivision, assignedVertical } = await persistResults({
      deckId,
      startupId: deck.startup_id,
      rawText: text,
      pageCount: page_count,
      language,
      classification,
      evaluation,
      chunks: embeddedChunks,
      embeddingTokens,
      pipelineStartMs: pipelineStart,
      fundingStage,
    });
    console.log(JSON.stringify({ deck_id: deckId, step: "persist", ok: true, evaluation_id: evaluationId, duration_ms: Date.now() - pipelineStart }));

    // ── STEP 13: Notify ────────────────────────────────────────────────────
    if (profile?.email) {
      try {
        await notifyStartup({
          to: profile.email,
          startupName: startup.name,
          startupSlug: startup.slug,
          division: assignedDivision,
          vertical: assignedVertical,
          scoreTotal: evaluation.score_total,
          deckId,
        });
        console.log(JSON.stringify({ deck_id: deckId, step: "notify", ok: true }));
      } catch (emailErr) {
        // Non-fatal — email failure doesn't fail the pipeline
        console.error(JSON.stringify({ deck_id: deckId, step: "notify", ok: false, error: String(emailErr) }));
      }
    }

    // ── STEP 14: Fire-and-forget thumbnail generation ─────────────────────
    const { data: startupFull } = await db
      .from("startups")
      .select("consent_public_deck, current_division, current_vertical")
      .eq("id", deck.startup_id)
      .single();

    if (startupFull?.consent_public_deck) {
      const vercelUrl = Deno.env.get("VERCEL_API_URL") ?? "";
      const secret = Deno.env.get("INTERNAL_WEBHOOK_SECRET") ?? "";
      fetch(`${vercelUrl}/api/internal/generate-deck-thumbnails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": secret,
        },
        body: JSON.stringify({
          deck_id: deck.id,
          startup_id: deck.startup_id,
          overall_score: evaluation.score_total,
          division: assignedDivision ?? startupFull.current_division,
          vertical: assignedVertical ?? startupFull.current_vertical,
        }),
      }).catch((err: unknown) =>
        console.error(JSON.stringify({ deck_id: deckId, step: "thumbnail_webhook", ok: false, error: String(err) }))
      );
    }

    return new Response(
      JSON.stringify({ ok: true, evaluation_id: evaluationId, duration_ms: Date.now() - pipelineStart }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ deck_id: deckId, step: "pipeline_error", ok: false, error: errorMsg }));

    await db
      .from("decks")
      .update({ status: "error", error_message: errorMsg })
      .eq("id", deckId);

    return new Response(
      JSON.stringify({ ok: false, error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
