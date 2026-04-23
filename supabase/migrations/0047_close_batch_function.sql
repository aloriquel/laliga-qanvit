-- ── 0047_close_batch_function.sql ────────────────────────────────────────────
-- Función close_batch_and_assign_winners(target_batch_id uuid).
--
-- Fórmula 70/30 con normalización:
--   avg_votes       = GREATEST(AVG(votes_up + votes_down) en el batch, 3.0)
--   vote_score      = 100.0 × (votes_up − votes_down) / avg_votes
--   final_prelim    = 0.7 × base_score + 0.3 × vote_score
--   final_capped    = LEAST(final_prelim, base_score + 10)   -- cap +10
--   vote_bonus      = final_capped − base_score              -- puede ser negativo
--
-- Verificación con baseline=60, votes_up=20, votes_down=0, avg_votes=4:
--   vote_score   = 100 × 20/4 = 500
--   final_prelim = 0.7×60 + 0.3×500 = 192
--   final_capped = LEAST(192, 70) = 70   → vote_bonus = +10
--
-- Verificación con baseline=70, votes_up=0, votes_down=2, avg_votes=4:
--   vote_score   = 100 × (−2)/4 = −50
--   final_prelim = 0.7×70 + 0.3×(−50) = 34
--   final_capped = LEAST(34, 80) = 34    → vote_bonus = −36
--
-- Rankings calculados: nacional, división, región CA, vertical.
-- batch_winners: nacional top3, división top1, CA top1, vertical top1
--   (CA y vertical solo si el segmento tiene >=5 startups).
-- Idempotente: borra winners previos antes de reinsertar.
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

  -- Guard: pre-lanzamiento batches never compute winners — use rotate_batches() instead
  IF batch_rec.quarter = 'Q0_HISTORICO'
     AND batch_rec.winners_computed_at = '1970-01-01 00:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Batch % es pre-lanzamiento; usar rotate_batches() para migrarlo al siguiente batch oficial.', batch_rec.slug;
  END IF;

  -- ── 1. Calcular vote_bonus y final_score (fórmula 70/30) ────────────────
  --
  -- batch_votes: votos por startup dentro de este batch
  -- avg_batch:   promedio de (up+down) entre startups con votos, piso=3
  -- computed:    vote_score_raw para cada startup evaluada en el batch
  -- El UPDATE usa bp.baseline_score cuando no hay eval nueva en el batch.
  WITH batch_votes AS (
    SELECT
      startup_id,
      count(*) FILTER (WHERE vote_type = 'up')   AS up_count,
      count(*) FILTER (WHERE vote_type = 'down')  AS down_count
    FROM startup_votes
    WHERE batch_id = target_batch_id
    GROUP BY startup_id
  ),
  avg_batch AS (
    SELECT GREATEST(AVG(up_count + down_count)::numeric, 3.0) AS avg_votes
    FROM batch_votes
  ),
  latest_evals AS (
    SELECT DISTINCT ON (startup_id)
      startup_id,
      score_total
    FROM evaluations
    WHERE batch_id = target_batch_id
    ORDER BY startup_id, created_at DESC
  ),
  computed AS (
    SELECT
      le.startup_id,
      COALESCE(bv.up_count,   0)::int                                   AS up_count,
      COALESCE(bv.down_count, 0)::int                                   AS down_count,
      le.score_total                                                     AS eval_score,
      100.0 * (COALESCE(bv.up_count, 0) - COALESCE(bv.down_count, 0))::numeric
        / (SELECT avg_votes FROM avg_batch)                              AS vote_score_raw
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
  WHERE bp.batch_id   = target_batch_id
    AND bp.startup_id = c.startup_id;

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
  'Cierra un batch con fórmula 70/30 normalizada.
   final_score = LEAST(0.7*base + 0.3*vote_score, base+10)
   donde vote_score = 100*(up-down)/avg_batch_votes (avg con piso=3).
   Downvotes penalizan sin cap inferior. Cap de +10 solo al alza.
   Idempotente — borra winners previos antes de reinsertar.';

-- ── VERIFICACIÓN tras aplicar 0047 ───────────────────────────────────────────
-- SELECT proname, pronargs FROM pg_proc WHERE proname = 'close_batch_and_assign_winners';
-- -- Esperado: 1 fila con pronargs=1

-- Verificación manual de la fórmula (sin persistir):
-- WITH inputs(baseline, up, down, avg_v) AS (
--   VALUES
--     (60.0, 20, 0, 4.0),   -- espera final=70, vote_bonus=+10
--     (70.0,  0, 2, 4.0)    -- espera final=34, vote_bonus=-36
-- )
-- SELECT
--   baseline, up, down, avg_v,
--   100.0*(up-down)/avg_v                                        AS vote_score,
--   0.7*baseline + 0.3*(100.0*(up-down)/avg_v)                  AS final_prelim,
--   LEAST(0.7*baseline + 0.3*(100.0*(up-down)/avg_v),
--         baseline + 10)                                         AS final_capped,
--   LEAST(0.7*baseline + 0.3*(100.0*(up-down)/avg_v),
--         baseline + 10) - baseline                              AS vote_bonus
-- FROM inputs;
-- -- Esperado fila 1: vote_score=500, final_prelim=192, final_capped=70, vote_bonus=+10
-- -- Esperado fila 2: vote_score=-50, final_prelim=34,  final_capped=34, vote_bonus=-36
