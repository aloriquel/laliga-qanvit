-- ── 0042_backfill_batch_ids.sql ──────────────────────────────────────────────
-- Asigna batch_id a todas las evaluations y startup_votes existentes
-- basándose en su created_at. Todas deberían ir a Batch 0 dado que el
-- primer batch real (Q3 2026) arranca el 2026-07-01.
-- Aplicar DESPUÉS de 0041 (necesita batches sembrados).
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE evaluations
SET batch_id = get_batch_for_date(created_at)
WHERE batch_id IS NULL;

UPDATE startup_votes
SET batch_id = get_batch_for_date(created_at)
WHERE batch_id IS NULL;

-- ── VERIFICACIÓN tras aplicar 0042 ───────────────────────────────────────────
-- Evaluaciones por batch asignado:
-- SELECT
--   COALESCE(b.slug, 'sin_batch') AS batch_assigned,
--   count(*) AS total
-- FROM evaluations e
-- LEFT JOIN batches b ON b.id = e.batch_id
-- GROUP BY batch_assigned;
-- -- Esperado: todas en 'batch-0-historico', 0 en 'sin_batch'
-- --   (si alguna evaluation tiene created_at >= 2026-07-01 iría a q3-2026,
-- --    pero no debería existir ninguna aún)

-- Votos por batch asignado:
-- SELECT
--   COALESCE(b.slug, 'sin_batch') AS batch_assigned,
--   count(*) AS total
-- FROM startup_votes sv
-- LEFT JOIN batches b ON b.id = sv.batch_id
-- GROUP BY batch_assigned;
-- -- Esperado: todas en 'batch-0-historico', 0 en 'sin_batch'

-- Cuántas evaluaciones sin batch quedan (debe ser 0):
-- SELECT count(*) FROM evaluations WHERE batch_id IS NULL;
-- SELECT count(*) FROM startup_votes WHERE batch_id IS NULL;
