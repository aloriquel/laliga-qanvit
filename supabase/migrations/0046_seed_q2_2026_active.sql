-- ── 0046_seed_q2_2026_active.sql ─────────────────────────────────────────────
-- Crea Q2 2026 como batch ACTIVO (temporada en curso, desde 2026-04-01).
-- Ajusta Batch 0 para que termine el 2026-03-31 (antes de Q2).
-- Re-ejecuta el backfill para evaluaciones y votos en rango Q2.
-- Siembra batch_participations para startups con evaluaciones en Q2.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Batch 0: recortar ends_at a fin de Q1 y archivar definitivamente
UPDATE batches
SET ends_at = '2026-03-31 23:59:59+01:00'::timestamptz,
    status  = 'archived'
WHERE slug = 'batch-0-historico';

-- 2. Insertar Q2 2026 como activo
INSERT INTO batches (slug, quarter, year, display_name, starts_at, ends_at, status)
VALUES (
  'q2-2026',
  'Q2',
  2026,
  'Q2 2026',
  '2026-04-01 00:00:00+02:00'::timestamptz,
  '2026-06-30 23:59:59+02:00'::timestamptz,
  'active'
)
ON CONFLICT (slug) DO UPDATE
  SET status    = 'active',
      starts_at = EXCLUDED.starts_at,
      ends_at   = EXCLUDED.ends_at,
      display_name = EXCLUDED.display_name;

-- 3. Re-asignar evaluaciones y votos del rango Q2 al nuevo batch
UPDATE evaluations
SET batch_id = get_batch_for_date(created_at)
WHERE created_at >= '2026-04-01 00:00:00+02:00'::timestamptz;

UPDATE startup_votes
SET batch_id = get_batch_for_date(created_at)
WHERE created_at >= '2026-04-01 00:00:00+02:00'::timestamptz;

-- 4. Sembrar batch_participations para Q2 2026
--    Una fila por startup con la evaluación más reciente en Q2 como baseline.
INSERT INTO batch_participations (
  batch_id,
  startup_id,
  baseline_score,
  baseline_evaluation_id,
  deck_uploads_count,
  participated_via
)
SELECT DISTINCT ON (e.startup_id)
  (SELECT id FROM batches WHERE slug = 'q2-2026'),
  e.startup_id,
  e.score_total,
  e.id,
  1,
  'deck_nuevo'
FROM evaluations e
WHERE e.batch_id = (SELECT id FROM batches WHERE slug = 'q2-2026')
ORDER BY e.startup_id, e.created_at DESC
ON CONFLICT (batch_id, startup_id) DO UPDATE
  SET baseline_score         = EXCLUDED.baseline_score,
      baseline_evaluation_id = EXCLUDED.baseline_evaluation_id,
      participated_via       = EXCLUDED.participated_via,
      updated_at             = now();

-- ── VERIFICACIÓN tras aplicar 0046 ───────────────────────────────────────────
-- Batches actuales:
-- SELECT slug, display_name, status,
--        starts_at AT TIME ZONE 'Europe/Madrid' AS starts_madrid,
--        ends_at   AT TIME ZONE 'Europe/Madrid' AS ends_madrid
-- FROM batches ORDER BY starts_at;
-- -- Esperado: batch-0-historico (archived, hasta 2026-03-31), q2-2026 (active), q3-2026 (upcoming)

-- Participaciones Q2:
-- SELECT b.slug, count(*) AS startups
-- FROM batch_participations bp
-- JOIN batches b ON b.id = bp.batch_id
-- WHERE b.slug = 'q2-2026'
-- GROUP BY b.slug;

-- Evaluaciones por batch (no deben quedar evaluaciones recientes en batch-0):
-- SELECT b.slug, count(*)
-- FROM evaluations e
-- LEFT JOIN batches b ON b.id = e.batch_id
-- GROUP BY b.slug;
