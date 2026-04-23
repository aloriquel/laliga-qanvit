-- ── 0049_decks_batch_id.sql ───────────────────────────────────────────────────
-- Añade batch_id FK a la tabla decks.
-- Backfill usando get_batch_for_date(uploaded_at).
-- BEFORE INSERT trigger para asignar batch_id automáticamente.
-- Aplicar DESPUÉS de 0046 (necesita los batches q2-2026 y batch-0-historico).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_decks_batch_id
  ON decks(batch_id);

CREATE INDEX IF NOT EXISTS idx_decks_startup_batch_active
  ON decks(startup_id, batch_id)
  WHERE status != 'archived';

-- Backfill: asignar batch_id a los decks existentes según su uploaded_at
UPDATE decks
SET batch_id = get_batch_for_date(uploaded_at)
WHERE batch_id IS NULL;

-- Función de trigger específica para decks (usa uploaded_at, no created_at)
CREATE OR REPLACE FUNCTION assign_deck_batch_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.batch_id IS NULL THEN
    NEW.batch_id := get_batch_for_date(COALESCE(NEW.uploaded_at, now()));
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION assign_deck_batch_id_on_insert() IS
  'Asigna batch_id al insertar un deck, usando get_batch_for_date(uploaded_at).
   Respeta override manual si batch_id ya viene informado.';

CREATE TRIGGER decks_assign_batch_id
  BEFORE INSERT ON decks
  FOR EACH ROW EXECUTE FUNCTION assign_deck_batch_id_on_insert();

-- ── VERIFICACIÓN tras aplicar 0049 ───────────────────────────────────────────
-- Columna presente:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'decks' AND column_name = 'batch_id';
-- -- Esperado: 1 fila, data_type = 'uuid'

-- Trigger activo:
-- SELECT trigger_name FROM information_schema.triggers
-- WHERE trigger_name = 'decks_assign_batch_id';
-- -- Esperado: 1 fila

-- Backfill OK (debe ser 0):
-- SELECT count(*) FROM decks WHERE batch_id IS NULL;

-- Distribución por batch:
-- SELECT b.slug, count(*) AS decks
-- FROM decks d
-- LEFT JOIN batches b ON b.id = d.batch_id
-- GROUP BY b.slug;
