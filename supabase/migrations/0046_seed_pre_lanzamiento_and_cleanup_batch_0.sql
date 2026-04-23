-- ── 0046_seed_pre_lanzamiento_and_cleanup_batch_0.sql ─────────────────────────
-- Elimina Batch 0 (datos de prueba, viola CHECK batch_date_order).
-- Inserta Pre-Lanzamiento (Q0_HISTORICO, activo, winners_computed_at=1970 sentinel).
-- El sentinel indica a rotate_batches() que NO calcule ganadores sino que migre
-- las participaciones al primer batch oficial (Q3 2026).
-- Asegura Q3 2026 como upcoming (idempotente, ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Limpiar datos ligados a batch-0-historico (test data)
DO $$
DECLARE
  batch0_id uuid;
BEGIN
  SELECT id INTO batch0_id FROM batches WHERE slug = 'batch-0-historico';
  IF batch0_id IS NOT NULL THEN
    DELETE FROM batch_winners        WHERE batch_id = batch0_id;
    DELETE FROM batch_participations WHERE batch_id = batch0_id;
    DELETE FROM evaluations          WHERE batch_id = batch0_id;
    DELETE FROM startup_votes        WHERE batch_id = batch0_id;
    DELETE FROM decks                WHERE batch_id = batch0_id;
    DELETE FROM batches              WHERE id       = batch0_id;
  END IF;
END;
$$;

-- 2. Insertar Pre-Lanzamiento como batch activo
--    winners_computed_at = 1970-01-01 (sentinel) → rotate_batches lo detecta
--    y llama a migrate_pre_lanzamiento_to_q3() en lugar de close_batch_and_assign_winners().
INSERT INTO batches (slug, quarter, year, display_name, starts_at, ends_at, status, winners_computed_at)
VALUES (
  'pre-lanzamiento-2026',
  'Q0_HISTORICO',
  2026,
  'Pre-Lanzamiento',
  now(),
  '2026-06-30 23:59:59+02:00'::timestamptz,
  'active',
  '1970-01-01 00:00:00+00'::timestamptz
)
ON CONFLICT (slug) DO UPDATE
  SET status              = 'active',
      ends_at             = EXCLUDED.ends_at,
      display_name        = EXCLUDED.display_name,
      winners_computed_at = EXCLUDED.winners_computed_at;

-- 3. Asegurar Q3 2026 como upcoming (primer batch oficial con ganadores)
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
ON CONFLICT (slug) DO NOTHING;

-- ── VERIFICACIÓN tras aplicar 0046 ───────────────────────────────────────────
-- SELECT slug, display_name, status, quarter,
--        starts_at AT TIME ZONE 'Europe/Madrid' AS starts_madrid,
--        ends_at   AT TIME ZONE 'Europe/Madrid' AS ends_madrid,
--        winners_computed_at
-- FROM batches ORDER BY starts_at;
-- -- Esperado: pre-lanzamiento-2026 (active, Q0_HISTORICO, sentinel 1970),
-- --           q3-2026 (upcoming, Q3)
