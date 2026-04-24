-- ────────────────────────────────────────────────────────────────────────────
-- 0055_fix_metrics_summary_singleton_index.sql  —  PROMPT_14 (C1)
--
-- metrics_summary's previous UNIQUE index was on the constant expression (1),
-- which Postgres refuses for REFRESH MATERIALIZED VIEW CONCURRENTLY. Result:
-- 90/90 cron runs failed over 7 days with the hint "Create a unique index
-- with no WHERE clause on one or more columns of the materialized view."
--
-- Fix: add a real `singleton smallint` column and put the unique index on it.
-- The MV still returns exactly one row.
-- ────────────────────────────────────────────────────────────────────────────

DROP MATERIALIZED VIEW IF EXISTS public.metrics_summary CASCADE;

CREATE MATERIALIZED VIEW public.metrics_summary AS
SELECT
  ((SELECT count(*) FROM startups WHERE startups.current_score IS NOT NULL))::integer                                                                                                   AS startups_with_score,
  ((SELECT count(*) FROM ecosystem_organizations WHERE ecosystem_organizations.is_verified = true))::integer                                                                            AS orgs_verified,
  ((SELECT count(*) FROM decks WHERE decks.status = 'evaluated'::deck_status))::integer                                                                                                  AS decks_evaluated_total,
  ((SELECT count(*) FROM decks WHERE decks.status = 'error'::deck_status))::integer                                                                                                       AS decks_error_total,
  ((SELECT count(*) FROM decks WHERE decks.status = 'evaluated'::deck_status AND decks.processed_at > now() - interval '7 days'))::integer                                               AS decks_evaluated_7d,
  ((SELECT count(*) FROM decks WHERE decks.status = 'error'::deck_status AND decks.uploaded_at > now() - interval '7 days'))::integer                                                    AS decks_error_7d,
  round(100.0 * (
    (SELECT count(*) FROM decks WHERE decks.status = 'evaluated'::deck_status AND decks.processed_at > now() - interval '7 days'))::numeric
    / NULLIF((SELECT count(*) FROM decks WHERE decks.status = ANY (ARRAY['evaluated'::deck_status,'error'::deck_status]) AND decks.uploaded_at > now() - interval '7 days'), 0)::numeric,
    2)                                                                                                                                                                                    AS pipeline_success_rate_7d,
  COALESCE((SELECT sum(evaluations.cost_estimate_usd) FROM evaluations), 0::numeric)                                                                                                      AS total_cost_usd,
  COALESCE((SELECT sum(evaluations.cost_estimate_usd) FROM evaluations WHERE evaluations.created_at > now() - interval '7 days'), 0::numeric)                                             AS cost_usd_7d,
  COALESCE((SELECT sum(evaluations.cost_estimate_usd) FROM evaluations WHERE evaluations.created_at > now() - interval '30 days'), 0::numeric)                                            AS cost_usd_30d,
  COALESCE((SELECT avg(evaluations.cost_estimate_usd) FROM evaluations WHERE evaluations.created_at > now() - interval '30 days'), 0::numeric)                                            AS avg_cost_per_eval_30d,
  ((SELECT count(*) FROM evaluations WHERE ((evaluations.feedback ->> 'degraded_mode')::boolean) = true AND evaluations.created_at > now() - interval '30 days'))::integer                AS degraded_evals_30d,
  COALESCE((SELECT avg(evaluations.latency_ms) FROM evaluations WHERE evaluations.latency_ms IS NOT NULL AND evaluations.created_at > now() - interval '7 days'), 0::numeric)             AS avg_latency_ms_7d,
  now()                                                                                                                                                                                   AS refreshed_at,
  1::smallint                                                                                                                                                                             AS singleton;

CREATE UNIQUE INDEX metrics_summary_singleton_key
  ON public.metrics_summary (singleton);

REFRESH MATERIALIZED VIEW public.metrics_summary;
