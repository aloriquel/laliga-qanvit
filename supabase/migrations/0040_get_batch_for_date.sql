-- ── 0040_get_batch_for_date.sql ──────────────────────────────────────────────
-- Función auxiliar: dado un timestamp, devuelve el batch_id al que pertenece.
-- Comparación timezone-aware: uses starts_at/ends_at de batches (timestamptz).
-- Aplicar DESPUÉS de 0039 (usa la tabla batches).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_batch_for_date(ts timestamptz)
RETURNS uuid
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  result_batch_id uuid;
BEGIN
  SELECT id INTO result_batch_id
  FROM batches
  WHERE ts >= starts_at AND ts < ends_at
  LIMIT 1;

  RETURN result_batch_id;
END;
$$;

COMMENT ON FUNCTION get_batch_for_date(timestamptz) IS
  'Devuelve el batch_id al que pertenece un timestamp.
   Rango: starts_at <= ts < ends_at. Devuelve NULL si no hay batch coincidente.
   Usado para backfill de evaluations y votes, y para asignar batch_id en nuevos inserts.';

-- ── VERIFICACIÓN tras aplicar 0040 ───────────────────────────────────────────
-- SELECT proname, provolatile FROM pg_proc WHERE proname = 'get_batch_for_date';
-- -- Esperado: 1 fila, provolatile = 's' (STABLE)

-- Test funcional (ejecutar DESPUÉS de 0041 que siembra los batches):
-- SELECT get_batch_for_date('2025-06-01 00:00:00+00'::timestamptz);
-- -- Esperado: id del batch-0-historico

-- SELECT get_batch_for_date('2026-07-15 12:00:00+00'::timestamptz);
-- -- Esperado: id del q3-2026

-- SELECT get_batch_for_date('2027-01-01 00:00:00+00'::timestamptz);
-- -- Esperado: NULL (batch futuro no sembrado aún)
