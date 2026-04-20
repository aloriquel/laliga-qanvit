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

const EXPECTED_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";

serve(async (req) => {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!EXPECTED_SECRET || token !== EXPECTED_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

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
      .select("id, name, slug")
      .eq("id", deck.startup_id)
      .single();

    if (startupError || !startup) throw new Error(`Startup not found: ${startupError?.message}`);

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
