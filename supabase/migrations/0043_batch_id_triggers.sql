-- ── 0043_batch_id_triggers.sql ───────────────────────────────────────────────
-- Triggers BEFORE INSERT en evaluations y startup_votes que asignan
-- automáticamente batch_id usando get_batch_for_date(created_at).
-- El trigger respeta override manual: si batch_id ya viene en el INSERT, no lo toca.
-- Aplicar DESPUÉS de 0040 (necesita la función get_batch_for_date).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION assign_batch_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.batch_id IS NULL THEN
    NEW.batch_id := get_batch_for_date(COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION assign_batch_id_on_insert() IS
  'Asigna batch_id automáticamente al insertar evaluations o startup_votes,
   usando get_batch_for_date(created_at). Respeta override manual si batch_id
   ya viene informado en el INSERT.';

CREATE TRIGGER evaluations_assign_batch_id
  BEFORE INSERT ON evaluations
  FOR EACH ROW EXECUTE FUNCTION assign_batch_id_on_insert();

CREATE TRIGGER startup_votes_assign_batch_id
  BEFORE INSERT ON startup_votes
  FOR EACH ROW EXECUTE FUNCTION assign_batch_id_on_insert();

-- ── VERIFICACIÓN tras aplicar 0043 ───────────────────────────────────────────
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name IN ('evaluations_assign_batch_id', 'startup_votes_assign_batch_id');
-- -- Esperado: 2 filas (INSERT, evaluations) y (INSERT, startup_votes)

-- Test manual del trigger (no persiste, solo verifica que get_batch_for_date funciona):
-- SELECT get_batch_for_date(now()) AS current_batch_id;
-- -- Esperado hoy (2026-04-23): id de batch-0-historico
-- -- Esperado desde 2026-07-01: id de q3-2026
