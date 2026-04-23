-- ── 0047_close_batch_function.sql ────────────────────────────────────────────
-- Función close_batch_and_assign_winners(target_batch_id uuid).
-- Fórmula: final_score = eval_score + vote_bonus (vote_bonus capeado en +10).
--   vote_bonus = LEAST(up_votes_en_batch * 0.5, 10.0)
-- Rankings calculados: nacional, división, región CA, vertical.
-- batch_winners insertados para: nacional top3, división top1,
--   CA top1 y vertical top1 (solo si el segmento tiene >=5 startups).
-- Idempotente: borrar winners previos antes de reinsertar.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION close_batch_and_assign_winners(target_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  batch_rec         RECORD;
  min_segment_count CONSTANT int := 5;
BEGIN
  SELECT id, slug, status INTO batch_rec
  FROM batches WHERE id = target_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch % not found', target_batch_id;
  END IF;

  IF batch_rec.status NOT IN ('active', 'closed') THEN
    RAISE EXCEPTION 'Batch % has status %; expected active or closed', target_batch_id, batch_rec.status;
  END IF;

  -- ── 1. Calcular vote_bonus y final_score ────────────────────────────────
  WITH batch_votes AS (
    SELECT
      startup_id,
      count(*) FILTER (WHERE vote_type = 'up')   AS up_count,
      count(*) FILTER (WHERE vote_type = 'down')  AS down_count
    FROM startup_votes
    WHERE batch_id = target_batch_id
    GROUP BY startup_id
  ),
  latest_evals AS (
    SELECT DISTINCT ON (startup_id)
      startup_id,
      score_total
    FROM evaluations
    WHERE batch_id = target_batch_id
    ORDER BY startup_id, created_at DESC
  )
  UPDATE batch_participations bp
  SET
    votes_up    = COALESCE(bv.up_count,   0),
    votes_down  = COALESCE(bv.down_count, 0),
    vote_bonus  = LEAST(COALESCE(bv.up_count, 0)::numeric * 0.5, 10.0),
    final_score = COALESCE(le.score_total, bp.baseline_score, 0.0)
                  + LEAST(COALESCE(bv.up_count, 0)::numeric * 0.5, 10.0),
    updated_at  = now()
  FROM latest_evals le
  LEFT JOIN batch_votes bv ON bv.startup_id = le.startup_id
  WHERE bp.batch_id    = target_batch_id
    AND bp.startup_id  = le.startup_id;

  -- ── 2. Ranking nacional ─────────────────────────────────────────────────
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (ORDER BY final_score DESC NULLS LAST) AS rn
    FROM batch_participations
    WHERE batch_id = target_batch_id AND final_score IS NOT NULL
  )
  UPDATE batch_participations bp
  SET rank_national = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  -- ── 3. Ranking por división ─────────────────────────────────────────────
  WITH ranked AS (
    SELECT bp.id,
      ROW_NUMBER() OVER (PARTITION BY s.current_division ORDER BY bp.final_score DESC NULLS LAST) AS rn
    FROM batch_participations bp
    JOIN startups s ON s.id = bp.startup_id
    WHERE bp.batch_id = target_batch_id AND bp.final_score IS NOT NULL
  )
  UPDATE batch_participations bp
  SET rank_division = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  -- ── 4. Ranking por Comunidad Autónoma ───────────────────────────────────
  WITH ranked AS (
    SELECT bp.id,
      ROW_NUMBER() OVER (PARTITION BY s.region_ca ORDER BY bp.final_score DESC NULLS LAST) AS rn
    FROM batch_participations bp
    JOIN startups s ON s.id = bp.startup_id
    WHERE bp.batch_id = target_batch_id AND bp.final_score IS NOT NULL
      AND s.region_ca IS NOT NULL
  )
  UPDATE batch_participations bp
  SET rank_region_ca = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  -- ── 5. Ranking por vertical ─────────────────────────────────────────────
  WITH ranked AS (
    SELECT bp.id,
      ROW_NUMBER() OVER (PARTITION BY s.current_vertical ORDER BY bp.final_score DESC NULLS LAST) AS rn
    FROM batch_participations bp
    JOIN startups s ON s.id = bp.startup_id
    WHERE bp.batch_id = target_batch_id AND bp.final_score IS NOT NULL
      AND s.current_vertical IS NOT NULL
  )
  UPDATE batch_participations bp
  SET rank_vertical = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  -- ── 6. Borrar ganadores previos (idempotencia) ──────────────────────────
  DELETE FROM batch_winners WHERE batch_id = target_batch_id;

  -- ── 7. Nacional top 3 ───────────────────────────────────────────────────
  INSERT INTO batch_winners
    (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT
    target_batch_id, bp.startup_id, bp.id,
    CASE bp.rank_national
      WHEN 1 THEN 'national_top1'
      WHEN 2 THEN 'national_top2'
      ELSE        'national_top3'
    END,
    NULL,
    bp.final_score
  FROM batch_participations bp
  WHERE bp.batch_id     = target_batch_id
    AND bp.rank_national <= 3
    AND bp.final_score IS NOT NULL;

  -- ── 8. División top 1 ───────────────────────────────────────────────────
  INSERT INTO batch_winners
    (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT
    target_batch_id, bp.startup_id, bp.id,
    'division_top1', s.current_division, bp.final_score
  FROM batch_participations bp
  JOIN startups s ON s.id = bp.startup_id
  WHERE bp.batch_id    = target_batch_id
    AND bp.rank_division = 1
    AND bp.final_score IS NOT NULL
    AND s.current_division IS NOT NULL;

  -- ── 9. CA top 1 (mín. 5 startups en el segmento) ───────────────────────
  INSERT INTO batch_winners
    (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT
    target_batch_id, bp.startup_id, bp.id,
    'region_ca_top1', s.region_ca, bp.final_score
  FROM batch_participations bp
  JOIN startups s ON s.id = bp.startup_id
  WHERE bp.batch_id      = target_batch_id
    AND bp.rank_region_ca = 1
    AND bp.final_score IS NOT NULL
    AND s.region_ca IS NOT NULL
    AND (
      SELECT count(*)
      FROM batch_participations bp2
      JOIN startups s2 ON s2.id = bp2.startup_id
      WHERE bp2.batch_id = target_batch_id
        AND s2.region_ca = s.region_ca
        AND bp2.final_score IS NOT NULL
    ) >= min_segment_count;

  -- ── 10. Vertical top 1 (mín. 5 startups en el segmento) ────────────────
  INSERT INTO batch_winners
    (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT
    target_batch_id, bp.startup_id, bp.id,
    'vertical_top1', s.current_vertical, bp.final_score
  FROM batch_participations bp
  JOIN startups s ON s.id = bp.startup_id
  WHERE bp.batch_id      = target_batch_id
    AND bp.rank_vertical  = 1
    AND bp.final_score IS NOT NULL
    AND s.current_vertical IS NOT NULL
    AND (
      SELECT count(*)
      FROM batch_participations bp2
      JOIN startups s2 ON s2.id = bp2.startup_id
      WHERE bp2.batch_id = target_batch_id
        AND s2.current_vertical = s.current_vertical
        AND bp2.final_score IS NOT NULL
    ) >= min_segment_count;

  -- ── 11. Cerrar batch y registrar timestamp ──────────────────────────────
  UPDATE batches
  SET
    status              = 'closed',
    closed_at           = COALESCE(closed_at, now()),
    winners_computed_at = now()
  WHERE id = target_batch_id;

  RAISE NOTICE 'close_batch_and_assign_winners: batch % (%) completed', batch_rec.slug, target_batch_id;
END;
$$;

COMMENT ON FUNCTION close_batch_and_assign_winners(uuid) IS
  'Cierra un batch: calcula final_score (eval + vote_bonus, cap +10), asigna
   rankings (nacional/división/CA/vertical) e inserta batch_winners.
   Idempotente — borra winners previos antes de reinsertar.
   Llamado por rotate_batches() y por el endpoint admin /api/admin/batches/:id/close.';

-- ── VERIFICACIÓN tras aplicar 0047 ───────────────────────────────────────────
-- SELECT proname, pronargs FROM pg_proc WHERE proname = 'close_batch_and_assign_winners';
-- -- Esperado: 1 fila con pronargs=1

-- Test en staging (cierra y reabre si es necesario — NO ejecutar en prod):
-- SELECT close_batch_and_assign_winners(
--   (SELECT id FROM batches WHERE slug = 'batch-0-historico')
-- );
-- SELECT category, segment_key, s.name, bw.final_score
-- FROM batch_winners bw
-- JOIN startups s ON s.id = bw.startup_id
-- WHERE bw.batch_id = (SELECT id FROM batches WHERE slug = 'batch-0-historico')
-- ORDER BY category, bw.final_score DESC;
