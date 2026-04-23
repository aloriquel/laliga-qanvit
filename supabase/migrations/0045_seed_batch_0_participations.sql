-- ── 0045_seed_batch_0_participations.sql ─────────────────────────────────────
-- Toda startup con al menos una evaluación entra como participante retrospectivo
-- en Batch 0 con su score más reciente como baseline_score y final_score.
-- Los votos acumulados (sin ventana temporal) se copian como snapshot histórico.
-- rank_national se asigna por orden de final_score DESC.
-- Rankings por división/CA/vertical quedan para PROMPT_12B (close_batch logic).
--
-- NOTA: la columna de score en evaluations es 'score_total', no 'overall_score'.
-- Aplicar DESPUÉS de 0041 (necesita batch-0-historico sembrado).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO batch_participations (
  batch_id,
  startup_id,
  baseline_score,
  baseline_evaluation_id,
  final_score,
  participated_via,
  votes_up,
  votes_down
)
SELECT
  (SELECT id FROM batches WHERE slug = 'batch-0-historico'),
  s.id,
  latest_eval.score_total,
  latest_eval.id,
  latest_eval.score_total,   -- final_score = baseline en Batch 0 (sin lógica 70/30 retroactiva)
  'baseline_heredado',
  COALESCE(votes_up.cnt, 0),
  COALESCE(votes_down.cnt, 0)
FROM startups s
JOIN LATERAL (
  SELECT id, score_total
  FROM evaluations
  WHERE startup_id = s.id
  ORDER BY created_at DESC
  LIMIT 1
) latest_eval ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS cnt
  FROM startup_votes
  WHERE startup_id = s.id AND vote_type = 'up'
) votes_up ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS cnt
  FROM startup_votes
  WHERE startup_id = s.id AND vote_type = 'down'
) votes_down ON true
ON CONFLICT (batch_id, startup_id) DO NOTHING;

-- Asignar rank_national retroactivo (por final_score DESC)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY final_score DESC NULLS LAST) AS rn
  FROM batch_participations
  WHERE batch_id = (SELECT id FROM batches WHERE slug = 'batch-0-historico')
)
UPDATE batch_participations bp
SET rank_national = ranked.rn
FROM ranked
WHERE bp.id = ranked.id;

-- ── VERIFICACIÓN tras aplicar 0045 ───────────────────────────────────────────
-- Participaciones sembradas:
-- SELECT
--   b.slug                                              AS batch_slug,
--   count(*)                                            AS startups_participando,
--   count(*) FILTER (WHERE bp.rank_national IS NOT NULL) AS con_rank_national,
--   round(avg(bp.final_score), 2)                       AS avg_score
-- FROM batch_participations bp
-- JOIN batches b ON b.id = bp.batch_id
-- GROUP BY b.slug;
-- -- Esperado: batch-0-historico con N startups (N = nº de startups con evaluación),
-- --   todas con rank_national NOT NULL

-- Top 5 Batch 0:
-- SELECT
--   s.name,
--   bp.final_score,
--   bp.rank_national
-- FROM batch_participations bp
-- JOIN startups s ON s.id = bp.startup_id
-- WHERE bp.batch_id = (SELECT id FROM batches WHERE slug = 'batch-0-historico')
-- ORDER BY bp.rank_national
-- LIMIT 5;

-- Startups con evaluación pero SIN participación (debe ser 0):
-- SELECT count(*)
-- FROM startups s
-- WHERE EXISTS (SELECT 1 FROM evaluations WHERE startup_id = s.id)
--   AND NOT EXISTS (
--     SELECT 1 FROM batch_participations bp
--     WHERE bp.startup_id = s.id
--       AND bp.batch_id = (SELECT id FROM batches WHERE slug = 'batch-0-historico')
--   );
-- -- Esperado: 0
