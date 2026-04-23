-- ── 0041_seed_initial_batches.sql ────────────────────────────────────────────
-- Siembra Batch 0 (histórico, closed) y Q3 2026 (upcoming).
-- Batch 0: starts_at = primera evaluación en DB (o 2024-01-01 si no hay ninguna).
--          ends_at   = 2026-06-30 23:59:59 Europe/Madrid (+02:00 verano).
-- Q3 2026: starts_at = 2026-07-01 00:00:00 Europe/Madrid (+02:00).
--          ends_at   = 2026-09-30 23:59:59 Europe/Madrid (+02:00).
-- Aplicar DESPUÉS de 0040 (usa get_batch_for_date — aunque aquí no se llama,
-- mantener orden de dependencias para claridad).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  first_eval_date timestamptz;
  batch_0_id      uuid;
  q3_2026_id      uuid;
BEGIN
  -- Fecha de la evaluación más antigua como starts_at del histórico
  SELECT COALESCE(MIN(created_at), '2024-01-01 00:00:00+00'::timestamptz)
  INTO first_eval_date
  FROM evaluations;

  -- Batch 0: histórico, ya cerrado
  INSERT INTO batches (slug, quarter, year, display_name, starts_at, ends_at, status, closed_at)
  VALUES (
    'batch-0-historico',
    'Q0_HISTORICO',
    2024,
    'Batch 0 (Histórico)',
    first_eval_date,
    '2026-06-30 23:59:59+02:00'::timestamptz,
    'closed',
    now()
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO batch_0_id;

  -- Q3 2026: próximo batch real
  INSERT INTO batches (slug, quarter, year, display_name, starts_at, ends_at, status)
  VALUES (
    'q3-2026',
    'Q3',
    2026,
    'Q3 2026',
    '2026-07-01 00:00:00+02:00'::timestamptz,
    '2026-09-30 23:59:59+02:00'::timestamptz,
    'upcoming'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO q3_2026_id;

  RAISE NOTICE 'Batch 0 id: %, Q3 2026 id: %, first_eval_date: %',
    batch_0_id, q3_2026_id, first_eval_date;
END $$;

-- ── VERIFICACIÓN tras aplicar 0041 ───────────────────────────────────────────
-- SELECT slug, display_name, status,
--        starts_at AT TIME ZONE 'Europe/Madrid' AS starts_madrid,
--        ends_at   AT TIME ZONE 'Europe/Madrid' AS ends_madrid
-- FROM batches ORDER BY starts_at;
-- -- Esperado: 2 filas
-- --   batch-0-historico | closed  | <fecha primera eval> | 2026-06-30 23:59:59
-- --   q3-2026           | upcoming| 2026-07-01 00:00:00  | 2026-09-30 23:59:59

-- Comprobación de get_batch_for_date con las filas recién creadas:
-- SELECT slug FROM batches
-- WHERE id = get_batch_for_date('2025-03-15 10:00:00+00'::timestamptz);
-- -- Esperado: batch-0-historico

-- SELECT slug FROM batches
-- WHERE id = get_batch_for_date('2026-08-01 00:00:00+00'::timestamptz);
-- -- Esperado: q3-2026
