import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BEARER_SECRET = "laliga-dev-secret-32chars-local1";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${BEARER_SECRET}`) return new Response("Unauthorized", { status: 401 });

  const { export_id } = await req.json() as { export_id: string };
  if (!export_id) return new Response("Missing export_id", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Mark as generating
  await supabase.from("dataset_exports").update({ status: "generating" }).eq("id", export_id);

  const { data: exportRow } = await supabase
    .from("dataset_exports")
    .select("scope, filters")
    .eq("id", export_id)
    .single();

  if (!exportRow) {
    await supabase.from("dataset_exports").update({ status: "error", error_message: "Export row not found" }).eq("id", export_id);
    return new Response("Not found", { status: 404 });
  }

  try {
    const filters = (exportRow.filters ?? {}) as Record<string, unknown>;

    let query = supabase
      .from("startups")
      .select(`
        id, slug, name, one_liner, location_region, founded_year, website,
        consent_internal_use, current_division, current_vertical, current_score, created_at,
        evaluations(
          id, assigned_division, assigned_vertical, score_total,
          score_problem, score_market, score_solution, score_team, score_traction, score_business_model, score_gtm,
          feedback, summary, next_actions, prompt_version, rubric_version,
          evaluator_model, classifier_model, tokens_input, tokens_output, cost_estimate_usd, latency_ms, created_at
        ),
        decks(
          id, version, language, page_count, raw_text, uploaded_at,
          deck_chunks(chunk_index, content, token_count)
        )
      `)
      .eq("consent_internal_use", true);

    if (exportRow.scope === "vertical" && filters.vertical) {
      query = query.eq("current_vertical", filters.vertical as string);
    }

    if (exportRow.scope === "date_range" && filters.date_from && filters.date_to) {
      query = query.gte("created_at", filters.date_from as string).lte("created_at", filters.date_to as string);
    }

    const { data: startups, error: queryError } = await query;
    if (queryError) throw new Error(queryError.message);

    const exportPayload = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        exported_by_admin_id: export_id,
        scope: exportRow.scope,
        filters,
        record_count: startups?.length ?? 0,
        pipeline_versions: ["v1"],
      },
      startups: (startups ?? []).map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        one_liner: s.one_liner,
        location_region: s.location_region,
        founded_year: s.founded_year,
        website: s.website,
        consent_internal_use: s.consent_internal_use,
        current_division: s.current_division,
        current_vertical: s.current_vertical,
        current_score: s.current_score,
        created_at: s.created_at,
        evaluations: (s.evaluations ?? []).map((e: Record<string, unknown>) => ({
          id: e.id,
          assigned_division: e.assigned_division,
          assigned_vertical: e.assigned_vertical,
          scores: {
            problem: e.score_problem,
            market: e.score_market,
            solution: e.score_solution,
            team: e.score_team,
            traction: e.score_traction,
            business_model: e.score_business_model,
            gtm: e.score_gtm,
          },
          score_total: e.score_total,
          feedback: e.feedback,
          summary: e.summary,
          next_actions: e.next_actions,
          metadata: {
            model: e.evaluator_model,
            prompt_version: e.prompt_version,
            rubric_version: e.rubric_version,
            tokens_in: e.tokens_input,
            tokens_out: e.tokens_output,
            cost_usd: e.cost_estimate_usd,
            latency_ms: e.latency_ms,
          },
        })),
        decks: (s.decks ?? []).map((d: Record<string, unknown>) => ({
          id: d.id,
          version: d.version,
          language: d.language,
          page_count: d.page_count,
          raw_text: d.raw_text,
          uploaded_at: d.uploaded_at,
          chunks: ((d.deck_chunks as Record<string, unknown>[] | undefined) ?? []).map((c) => ({
            index: c.chunk_index,
            content: c.content,
            token_count: c.token_count,
          })),
        })),
      })),
    };

    const jsonStr = JSON.stringify(exportPayload);
    const bytes = new TextEncoder().encode(jsonStr);
    const filePath = `${export_id}.json`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, bytes, { contentType: "application/json", upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    await supabase.from("dataset_exports").update({
      status: "completed",
      storage_path: `exports/${filePath}`,
      record_count: startups?.length ?? 0,
      file_size_bytes: bytes.length,
      completed_at: new Date().toISOString(),
      expires_at: expiresAt,
    }).eq("id", export_id);

    return new Response(JSON.stringify({ ok: true, records: startups?.length ?? 0 }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("dataset_exports").update({ status: "error", error_message: msg }).eq("id", export_id);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
