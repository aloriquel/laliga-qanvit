-- ── 0051_populate_celebrations_on_close.sql ──────────────────────────────────
-- Añade al final de close_batch_and_assign_winners() la pre-población de
-- batch_celebrations: UNA fila por (startup_id único ganador, batch_id).
-- Idempotente vía ON CONFLICT DO NOTHING.
-- Reemplaza 0047 (CREATE OR REPLACE).
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
  SELECT id, slug, status, quarter, winners_computed_at INTO batch_rec
  FROM batches WHERE id = target_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch % not found', target_batch_id;
  END IF;

  IF batch_rec.status NOT IN ('active', 'closed') THEN
    RAISE EXCEPTION 'Batch % has status %; expected active or closed', target_batch_id, batch_rec.status;
  END IF;

  IF batch_rec.quarter = 'Q0_HISTORICO'
     AND batch_rec.winners_computed_at = '1970-01-01 00:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Batch % es pre-lanzamiento; usar rotate_batches() para migrarlo al siguiente batch oficial.', batch_rec.slug;
  END IF;

  -- 1. vote_bonus + final_score (fórmula 70/30)
  WITH batch_votes AS (
    SELECT startup_id,
      count(*) FILTER (WHERE vote_type = 'up')   AS up_count,
      count(*) FILTER (WHERE vote_type = 'down')  AS down_count
    FROM startup_votes WHERE batch_id = target_batch_id
    GROUP BY startup_id
  ),
  avg_batch AS (
    SELECT GREATEST(AVG(up_count + down_count)::numeric, 3.0) AS avg_votes
    FROM batch_votes
  ),
  latest_evals AS (
    SELECT DISTINCT ON (startup_id) startup_id, score_total
    FROM evaluations WHERE batch_id = target_batch_id
    ORDER BY startup_id, created_at DESC
  ),
  computed AS (
    SELECT le.startup_id,
      COALESCE(bv.up_count,   0)::int AS up_count,
      COALESCE(bv.down_count, 0)::int AS down_count,
      le.score_total AS eval_score,
      100.0 * (COALESCE(bv.up_count, 0) - COALESCE(bv.down_count, 0))::numeric
        / (SELECT avg_votes FROM avg_batch) AS vote_score_raw
    FROM latest_evals le
    LEFT JOIN batch_votes bv ON bv.startup_id = le.startup_id
  )
  UPDATE batch_participations bp
  SET
    votes_up    = c.up_count,
    votes_down  = c.down_count,
    final_score = LEAST(
                    0.7 * COALESCE(c.eval_score, bp.baseline_score, 0.0)
                      + 0.3 * c.vote_score_raw,
                    COALESCE(c.eval_score, bp.baseline_score, 0.0) + 10.0
                  ),
    vote_bonus  = LEAST(
                    0.7 * COALESCE(c.eval_score, bp.baseline_score, 0.0)
                      + 0.3 * c.vote_score_raw,
                    COALESCE(c.eval_score, bp.baseline_score, 0.0) + 10.0
                  ) - COALESCE(c.eval_score, bp.baseline_score, 0.0),
    updated_at  = now()
  FROM computed c
  WHERE bp.batch_id = target_batch_id AND bp.startup_id = c.startup_id;

  -- 2. Rankings
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY final_score DESC NULLS LAST) AS rn
    FROM batch_participations
    WHERE batch_id = target_batch_id AND final_score IS NOT NULL
  )
  UPDATE batch_participations bp SET rank_national = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  WITH ranked AS (
    SELECT bp.id, ROW_NUMBER() OVER (PARTITION BY s.current_division ORDER BY bp.final_score DESC NULLS LAST) AS rn
    FROM batch_participations bp JOIN startups s ON s.id = bp.startup_id
    WHERE bp.batch_id = target_batch_id AND bp.final_score IS NOT NULL
  )
  UPDATE batch_participations bp SET rank_division = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  WITH ranked AS (
    SELECT bp.id, ROW_NUMBER() OVER (PARTITION BY s.region_ca ORDER BY bp.final_score DESC NULLS LAST) AS rn
    FROM batch_participations bp JOIN startups s ON s.id = bp.startup_id
    WHERE bp.batch_id = target_batch_id AND bp.final_score IS NOT NULL AND s.region_ca IS NOT NULL
  )
  UPDATE batch_participations bp SET rank_region_ca = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  WITH ranked AS (
    SELECT bp.id, ROW_NUMBER() OVER (PARTITION BY s.current_vertical ORDER BY bp.final_score DESC NULLS LAST) AS rn
    FROM batch_participations bp JOIN startups s ON s.id = bp.startup_id
    WHERE bp.batch_id = target_batch_id AND bp.final_score IS NOT NULL AND s.current_vertical IS NOT NULL
  )
  UPDATE batch_participations bp SET rank_vertical = ranked.rn
  FROM ranked WHERE bp.id = ranked.id;

  -- 3. Borrar winners previos
  DELETE FROM batch_winners WHERE batch_id = target_batch_id;

  -- 4. Nacional top 3
  INSERT INTO batch_winners (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT target_batch_id, bp.startup_id, bp.id,
    CASE bp.rank_national WHEN 1 THEN 'national_top1' WHEN 2 THEN 'national_top2' ELSE 'national_top3' END,
    NULL, bp.final_score
  FROM batch_participations bp
  WHERE bp.batch_id = target_batch_id AND bp.rank_national <= 3 AND bp.final_score IS NOT NULL;

  -- 5. División top 1
  INSERT INTO batch_winners (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT target_batch_id, bp.startup_id, bp.id,
    'division_top1', s.current_division, bp.final_score
  FROM batch_participations bp JOIN startups s ON s.id = bp.startup_id
  WHERE bp.batch_id = target_batch_id AND bp.rank_division = 1
    AND bp.final_score IS NOT NULL AND s.current_division IS NOT NULL;

  -- 6. CA top 1 (≥5)
  INSERT INTO batch_winners (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT target_batch_id, bp.startup_id, bp.id,
    'region_ca_top1', s.region_ca, bp.final_score
  FROM batch_participations bp JOIN startups s ON s.id = bp.startup_id
  WHERE bp.batch_id = target_batch_id AND bp.rank_region_ca = 1
    AND bp.final_score IS NOT NULL AND s.region_ca IS NOT NULL
    AND (SELECT count(*) FROM batch_participations bp2 JOIN startups s2 ON s2.id = bp2.startup_id
         WHERE bp2.batch_id = target_batch_id AND s2.region_ca = s.region_ca
           AND bp2.final_score IS NOT NULL) >= min_segment_count;

  -- 7. Vertical top 1 (≥5)
  INSERT INTO batch_winners (batch_id, startup_id, participation_id, category, segment_key, final_score)
  SELECT target_batch_id, bp.startup_id, bp.id,
    'vertical_top1', s.current_vertical, bp.final_score
  FROM batch_participations bp JOIN startups s ON s.id = bp.startup_id
  WHERE bp.batch_id = target_batch_id AND bp.rank_vertical = 1
    AND bp.final_score IS NOT NULL AND s.current_vertical IS NOT NULL
    AND (SELECT count(*) FROM batch_participations bp2 JOIN startups s2 ON s2.id = bp2.startup_id
         WHERE bp2.batch_id = target_batch_id AND s2.current_vertical = s.current_vertical
           AND bp2.final_score IS NOT NULL) >= min_segment_count;

  -- 8. Pre-populate batch_celebrations (UNA fila por startup ganadora)
  INSERT INTO batch_celebrations (startup_id, batch_id)
  SELECT DISTINCT startup_id, target_batch_id
  FROM batch_winners
  WHERE batch_id = target_batch_id
  ON CONFLICT (startup_id, batch_id) DO NOTHING;

  -- 9. Cerrar batch
  UPDATE batches
  SET status = 'closed',
      closed_at = COALESCE(closed_at, now()),
      winners_computed_at = now()
  WHERE id = target_batch_id;

  RAISE NOTICE 'close_batch_and_assign_winners: batch % (%) completed', batch_rec.slug, target_batch_id;
END;
$$;

COMMENT ON FUNCTION close_batch_and_assign_winners(uuid) IS
  'Cierra batch 70/30 + rankings + winners + pre-populate batch_celebrations.
   Idempotente. Rechaza pre-lanzamiento (Q0_HISTORICO + sentinel 1970).';

-- ── VERIFICACIÓN ─────────────────────────────────────────────────────────────
-- Tras cerrar un batch manualmente:
-- SELECT count(*) FROM batch_celebrations WHERE batch_id = :batch_id;
-- -- Esperado: nº startups únicas en batch_winners del mismo batch.
