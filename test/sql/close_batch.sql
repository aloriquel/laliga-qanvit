-- ── test/sql/close_batch.sql ─────────────────────────────────────────────────
-- Consultas manuales para verificar close_batch_and_assign_winners().
-- Ejecutar en Supabase SQL Editor. NO hay queries de escritura — solo lectura,
-- salvo el bloque "Test en staging" marcado explícitamente.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Estado actual de los batches
SELECT
  slug,
  display_name,
  status,
  starts_at AT TIME ZONE 'Europe/Madrid' AS starts_madrid,
  ends_at   AT TIME ZONE 'Europe/Madrid' AS ends_madrid,
  winners_computed_at
FROM batches
ORDER BY starts_at;

-- 2. Participaciones por batch
SELECT
  b.slug        AS batch,
  b.status,
  count(*)      AS startups,
  count(*) FILTER (WHERE bp.final_score IS NOT NULL) AS con_final_score,
  round(avg(bp.final_score), 2)                       AS avg_final_score
FROM batch_participations bp
JOIN batches b ON b.id = bp.batch_id
GROUP BY b.slug, b.status
ORDER BY b.starts_at;

-- 3. Top 10 del batch activo
SELECT
  bp.rank_national,
  s.name,
  s.current_division,
  bp.baseline_score,
  bp.votes_up,
  bp.vote_bonus,
  bp.final_score
FROM batch_participations bp
JOIN startups s ON s.id = bp.startup_id
JOIN batches b  ON b.id = bp.batch_id
WHERE b.status = 'active'
  AND bp.final_score IS NOT NULL
ORDER BY bp.rank_national NULLS LAST
LIMIT 10;

-- 4. Ganadores del batch (tras close)
SELECT
  bw.category,
  bw.segment_key,
  s.name,
  bw.final_score,
  b.slug AS batch
FROM batch_winners bw
JOIN startups s ON s.id = bw.startup_id
JOIN batches  b ON b.id = bw.batch_id
ORDER BY b.starts_at DESC, bw.category, bw.final_score DESC;

-- 5. Verificar fórmula 70/30 normalizada
--    final = LEAST(0.7*base + 0.3*vote_score, base+10)
--    vote_score = 100*(up-down)/avg_batch_votes  (avg con piso=3)
WITH batch_avg AS (
  SELECT
    sv.batch_id,
    GREATEST(
      AVG(
        (SELECT count(*) FROM startup_votes WHERE startup_id = sv.startup_id AND batch_id = sv.batch_id AND vote_type = 'up') +
        (SELECT count(*) FROM startup_votes WHERE startup_id = sv.startup_id AND batch_id = sv.batch_id AND vote_type = 'down')
      )::numeric, 3.0
    ) AS avg_votes
  FROM (SELECT DISTINCT startup_id, batch_id FROM startup_votes) sv
  GROUP BY sv.batch_id
)
SELECT
  s.name,
  e.score_total                                                               AS base_score,
  bp.votes_up,
  bp.votes_down,
  ba.avg_votes,
  100.0 * (bp.votes_up - bp.votes_down) / ba.avg_votes                        AS vote_score,
  0.7 * e.score_total
    + 0.3 * (100.0 * (bp.votes_up - bp.votes_down) / ba.avg_votes)            AS final_prelim,
  LEAST(
    0.7 * e.score_total
      + 0.3 * (100.0 * (bp.votes_up - bp.votes_down) / ba.avg_votes),
    e.score_total + 10
  )                                                                            AS final_computed,
  bp.final_score                                                               AS final_stored,
  ABS(
    LEAST(
      0.7 * e.score_total
        + 0.3 * (100.0 * (bp.votes_up - bp.votes_down) / ba.avg_votes),
      e.score_total + 10
    ) - bp.final_score
  ) < 0.01                                                                     AS formula_matches
FROM batch_participations bp
JOIN startups s ON s.id = bp.startup_id
JOIN batches  b ON b.id = bp.batch_id
JOIN batch_avg ba ON ba.batch_id = b.id
JOIN LATERAL (
  SELECT score_total FROM evaluations
  WHERE startup_id = bp.startup_id AND batch_id = b.id
  ORDER BY created_at DESC LIMIT 1
) e ON true
WHERE b.status IN ('active', 'closed')
  AND bp.final_score IS NOT NULL
LIMIT 20;

-- 6. Test inline de la fórmula (no necesita datos reales)
WITH inputs(baseline, up, down, avg_v) AS (
  VALUES
    (60.0::numeric, 20, 0, 4.0::numeric),  -- espera final=70, vote_bonus=+10
    (70.0::numeric,  0, 2, 4.0::numeric)   -- espera final=34, vote_bonus=-36
)
SELECT
  baseline,
  up,
  down,
  avg_v,
  100.0*(up-down)/avg_v                                              AS vote_score,
  0.7*baseline + 0.3*(100.0*(up-down)/avg_v)                        AS final_prelim,
  LEAST(0.7*baseline + 0.3*(100.0*(up-down)/avg_v), baseline + 10)  AS final_capped,
  LEAST(0.7*baseline + 0.3*(100.0*(up-down)/avg_v), baseline + 10)
    - baseline                                                        AS vote_bonus
FROM inputs;

-- ── Test en staging (cierra batch activo — NO ejecutar en prod) ───────────────
-- AVISO: esto cierra el batch activo permanentemente.
-- Ejecutar SOLO en staging o para forzar cierre manual en admin.

-- SELECT close_batch_and_assign_winners(
--   (SELECT id FROM batches WHERE status = 'active' LIMIT 1)
-- );

-- Reapertura de emergencia (si se cerró por error):
-- UPDATE batches SET status = 'active', closed_at = NULL, winners_computed_at = NULL
-- WHERE slug = 'q2-2026';
