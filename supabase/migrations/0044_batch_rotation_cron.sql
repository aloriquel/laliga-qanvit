-- ── 0044_batch_rotation_cron.sql ─────────────────────────────────────────────
-- Función rotate_batches() + cron pg_cron diario (00:05 UTC).
-- La función:
--   1. Cierra batches 'active' cuyo ends_at ya pasó.
--   2. Activa batches 'upcoming' cuyo starts_at ya llegó.
--   3. Si no hay ningún 'upcoming', crea el siguiente trimestre.
-- Cron corre 00:05 UTC (≈ 01:05 Madrid invierno, 02:05 Madrid verano).
-- Holgura suficiente: los batches cierran a 23:59:59 Madrid → el cron
-- los recoge unas horas después.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rotate_batches()
RETURNS TABLE (
  action     text,
  batch_slug text,
  batch_id   uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  r            RECORD;
  most_recent  RECORD;
  next_quarter batch_quarter;
  next_year    int;
  next_slug    text;
  next_display text;
  next_starts  timestamptz;
  next_ends    timestamptz;
  new_id       uuid;
BEGIN
  -- 1. Cerrar batches activos cuyo ends_at ya pasó
  FOR r IN
    SELECT id, slug FROM batches
    WHERE status = 'active' AND ends_at < now()
  LOOP
    UPDATE batches SET status = 'closed', closed_at = now() WHERE id = r.id;
    action := 'closed'; batch_slug := r.slug; batch_id := r.id; RETURN NEXT;
  END LOOP;

  -- 2. Activar batches upcoming cuyo starts_at ya llegó
  FOR r IN
    SELECT id, slug FROM batches
    WHERE status = 'upcoming' AND starts_at <= now()
  LOOP
    UPDATE batches SET status = 'active' WHERE id = r.id;
    action := 'activated'; batch_slug := r.slug; batch_id := r.id; RETURN NEXT;
  END LOOP;

  -- 3. Si no hay upcoming, crear el siguiente trimestre
  IF NOT EXISTS (SELECT 1 FROM batches WHERE status = 'upcoming') THEN
    SELECT quarter, year, ends_at INTO most_recent
    FROM batches
    WHERE quarter != 'Q0_HISTORICO'
    ORDER BY
      year DESC,
      CASE quarter
        WHEN 'Q4' THEN 4
        WHEN 'Q3' THEN 3
        WHEN 'Q2' THEN 2
        WHEN 'Q1' THEN 1
        ELSE 0
      END DESC
    LIMIT 1;

    IF FOUND THEN
      -- Calcular siguiente trimestre
      IF most_recent.quarter = 'Q4' THEN
        next_quarter := 'Q1'; next_year := most_recent.year + 1;
      ELSIF most_recent.quarter = 'Q3' THEN
        next_quarter := 'Q4'; next_year := most_recent.year;
      ELSIF most_recent.quarter = 'Q2' THEN
        next_quarter := 'Q3'; next_year := most_recent.year;
      ELSE
        next_quarter := 'Q2'; next_year := most_recent.year;
      END IF;

      next_slug    := lower(next_quarter::text) || '-' || next_year::text;
      next_display := next_quarter::text || ' ' || next_year::text;

      -- Offsets explícitos por trimestre en Europe/Madrid
      -- Q1 (ene-mar): +01:00 invierno / Q2-Q3 (abr-sep): +02:00 verano / Q4 (oct-dic): +01 o +02 mixto
      -- Usamos las medianoche/23:59 locales exactas para cada trimestre
      next_starts := CASE next_quarter
        WHEN 'Q1' THEN (next_year::text || '-01-01 00:00:00+01:00')::timestamptz
        WHEN 'Q2' THEN (next_year::text || '-04-01 00:00:00+02:00')::timestamptz
        WHEN 'Q3' THEN (next_year::text || '-07-01 00:00:00+02:00')::timestamptz
        WHEN 'Q4' THEN (next_year::text || '-10-01 00:00:00+02:00')::timestamptz
      END;
      next_ends := CASE next_quarter
        WHEN 'Q1' THEN (next_year::text || '-03-31 23:59:59+02:00')::timestamptz
        WHEN 'Q2' THEN (next_year::text || '-06-30 23:59:59+02:00')::timestamptz
        WHEN 'Q3' THEN (next_year::text || '-09-30 23:59:59+02:00')::timestamptz
        WHEN 'Q4' THEN (next_year::text || '-12-31 23:59:59+01:00')::timestamptz
      END;

      INSERT INTO batches (slug, quarter, year, display_name, starts_at, ends_at, status)
      VALUES (next_slug, next_quarter, next_year, next_display, next_starts, next_ends, 'upcoming')
      ON CONFLICT (slug) DO NOTHING
      RETURNING id INTO new_id;

      IF new_id IS NOT NULL THEN
        action := 'created_upcoming'; batch_slug := next_slug; batch_id := new_id; RETURN NEXT;
      END IF;
    END IF;
  END IF;

  RETURN;
END;
$$;

COMMENT ON FUNCTION rotate_batches() IS
  'Cierra batches activos expirados, activa upcoming listos y crea el siguiente
   trimestre si no hay upcoming. Llamado por cron diario a las 00:05 UTC.';

-- Eliminar job previo si existe (idempotencia)
SELECT cron.unschedule('rotate-batches-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'rotate-batches-daily'
);

SELECT cron.schedule(
  'rotate-batches-daily',
  '5 0 * * *',
  $$SELECT * FROM rotate_batches();$$
);

-- ── VERIFICACIÓN tras aplicar 0044 ───────────────────────────────────────────
-- SELECT jobname, schedule, active
-- FROM cron.job
-- WHERE jobname = 'rotate-batches-daily';
-- -- Esperado: 1 fila, schedule='5 0 * * *', active=true

-- Test manual (no hace cambios si los batches están bien):
-- SELECT action, batch_slug FROM rotate_batches();
-- -- Si Q3 2026 aún no arrancó y Batch 0 ya está closed → devuelve 0 filas
-- -- Si ya es 2026-07-01 → devuelve fila action='activated', batch_slug='q3-2026'
