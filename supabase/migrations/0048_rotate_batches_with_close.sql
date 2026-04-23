-- ── 0048_rotate_batches_with_close.sql ───────────────────────────────────────
-- Añade migrate_pre_lanzamiento_to_q3(uuid): cierra el batch pre-lanzamiento
-- (sin ganadores) y copia las participaciones al siguiente batch oficial como
-- baseline heredado con contadores a cero.
--
-- Reescribe rotate_batches() para:
--   · Batches Q0_HISTORICO con sentinel 1970 → migrate_pre_lanzamiento_to_q3
--   · Batches normales                       → close_batch_and_assign_winners
--
-- Reemplaza la versión de 0044/previo (CREATE OR REPLACE es idempotente).
-- Aplicar DESPUÉS de 0047 (necesita close_batch_and_assign_winners).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Función auxiliar: migrar pre-lanzamiento al siguiente batch oficial ───────
CREATE OR REPLACE FUNCTION migrate_pre_lanzamiento_to_q3(pre_launch_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  next_batch RECORD;
BEGIN
  -- Find next upcoming non-Q0_HISTORICO batch (ordered by starts_at)
  SELECT id, slug INTO next_batch
  FROM batches
  WHERE status = 'upcoming' AND quarter != 'Q0_HISTORICO'
  ORDER BY starts_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'migrate_pre_lanzamiento_to_q3: no hay batch upcoming oficial para migrar las participaciones.';
  END IF;

  -- Close the pre-launch batch (no winners computed)
  UPDATE batches
  SET status    = 'closed',
      closed_at = COALESCE(closed_at, now())
  WHERE id = pre_launch_id;

  -- Copy participations to next official batch as inherited baseline
  -- Votes and deck upload counter are reset; score carries forward
  INSERT INTO batch_participations (
    batch_id,
    startup_id,
    baseline_score,
    baseline_evaluation_id,
    deck_uploads_count,
    votes_up,
    votes_down,
    participated_via
  )
  SELECT
    next_batch.id,
    bp.startup_id,
    COALESCE(bp.final_score, bp.baseline_score),
    bp.baseline_evaluation_id,
    0,
    0,
    0,
    'baseline_heredado'
  FROM batch_participations bp
  WHERE bp.batch_id = pre_launch_id
  ON CONFLICT (batch_id, startup_id) DO UPDATE
    SET baseline_score     = EXCLUDED.baseline_score,
        deck_uploads_count = 0,
        votes_up           = 0,
        votes_down         = 0,
        participated_via   = EXCLUDED.participated_via,
        updated_at         = now();

  RAISE NOTICE 'migrate_pre_lanzamiento_to_q3: % migrated to %', pre_launch_id, next_batch.slug;
END;
$$;

COMMENT ON FUNCTION migrate_pre_lanzamiento_to_q3(uuid) IS
  'Cierra el batch pre-lanzamiento sin calcular ganadores y copia las participaciones
   al siguiente batch oficial upcoming, heredando baseline_score y reseteando contadores.';

-- ── rotate_batches ────────────────────────────────────────────────────────────
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
  -- 1. Cerrar batches activos expirados
  FOR r IN
    SELECT id, slug, quarter, winners_computed_at
    FROM batches
    WHERE status = 'active' AND ends_at < now()
  LOOP
    IF r.quarter = 'Q0_HISTORICO'
       AND r.winners_computed_at = '1970-01-01 00:00:00+00'::timestamptz THEN
      -- Pre-lanzamiento: migrate participations, no winners
      PERFORM migrate_pre_lanzamiento_to_q3(r.id);
    ELSE
      -- Normal batch: compute scores and assign winners
      PERFORM close_batch_and_assign_winners(r.id);
    END IF;
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
  'Cierra batches activos expirados:
   · Q0_HISTORICO con sentinel 1970 → migrate_pre_lanzamiento_to_q3 (sin ganadores)
   · Batches normales → close_batch_and_assign_winners
   Activa upcoming listos y crea el siguiente trimestre si no hay upcoming.
   Llamado por cron diario a las 00:05 UTC.';

-- ── VERIFICACIÓN tras aplicar 0048 ───────────────────────────────────────────
-- SELECT proname, pronargs FROM pg_proc
-- WHERE proname IN ('rotate_batches', 'migrate_pre_lanzamiento_to_q3');
-- -- Esperado: 2 filas
