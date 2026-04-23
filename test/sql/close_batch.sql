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

-- 5. Verificar fórmula: eval_score + vote_bonus = final_score
SELECT
  s.name,
  e.score_total                                      AS eval_score,
  bp.votes_up,
  bp.vote_bonus,
  e.score_total + bp.vote_bonus                      AS computed,
  bp.final_score                                     AS stored,
  ABS((e.score_total + bp.vote_bonus) - bp.final_score) < 0.01 AS matches
FROM batch_participations bp
JOIN startups s ON s.id = bp.startup_id
JOIN batches  b ON b.id = bp.batch_id
JOIN LATERAL (
  SELECT score_total FROM evaluations
  WHERE startup_id = bp.startup_id AND batch_id = b.id
  ORDER BY created_at DESC LIMIT 1
) e ON true
WHERE b.status IN ('active', 'closed')
  AND bp.final_score IS NOT NULL
LIMIT 20;

-- ── Test en staging (cierra batch activo — NO ejecutar en prod) ───────────────
-- AVISO: esto cierra el batch activo permanentemente.
-- Ejecutar SOLO en staging o para forzar cierre manual en admin.

-- SELECT close_batch_and_assign_winners(
--   (SELECT id FROM batches WHERE status = 'active' LIMIT 1)
-- );

-- Reapertura de emergencia (si se cerró por error):
-- UPDATE batches SET status = 'active', closed_at = NULL, winners_computed_at = NULL
-- WHERE slug = 'q2-2026';
