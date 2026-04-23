-- ── 0039_batch_id_on_evaluations_votes.sql ───────────────────────────────────
-- Añade batch_id (FK nullable) a evaluations y startup_votes.
-- Se rellena retrospectivamente en 0042 y automáticamente vía trigger en 0043.
-- Aplicar DESPUÉS de 0038 (necesita la tabla batches).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE evaluations
  ADD COLUMN batch_id uuid REFERENCES batches(id) ON DELETE SET NULL;

ALTER TABLE startup_votes
  ADD COLUMN batch_id uuid REFERENCES batches(id) ON DELETE SET NULL;

CREATE INDEX ON evaluations(batch_id);
CREATE INDEX ON startup_votes(batch_id);

COMMENT ON COLUMN evaluations.batch_id IS
  'Batch al que pertenece esta evaluación según su created_at.
   Backfilled para evaluaciones pre-PROMPT_12 (todas → Batch 0).';

COMMENT ON COLUMN startup_votes.batch_id IS
  'Batch al que pertenece este voto según su created_at.';

-- ── VERIFICACIÓN tras aplicar 0039 ───────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name IN ('evaluations', 'startup_votes')
--   AND column_name = 'batch_id';
-- -- Esperado: 2 filas (una por tabla)

-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('evaluations', 'startup_votes')
--   AND indexdef LIKE '%batch_id%';
-- -- Esperado: 2 índices
