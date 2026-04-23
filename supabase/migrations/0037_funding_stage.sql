-- Migration 0037: funding_stage autodeclarada como fuente primaria de división
-- PROMPT_11 — fuente de verdad de division pasa de evaluator a startup.
--
-- Pasos manuales tras aplicar:
--   1. Aplicar este script en Supabase Studio → SQL Editor.
--   2. Regenerar tipos: npx supabase gen types typescript \
--        --project-id ongwrbdypbusnwlclqjg --schema public \
--        > lib/supabase/types.ts
--   3. Cleanup de `as any` (commit separado).

-- ── 1. Enum para funding_stage ────────────────────────────────────────────────
CREATE TYPE funding_stage AS ENUM (
  'pre_seed',
  'seed',
  'series_a',
  'series_b',
  'series_c',
  'series_d_plus',
  'bootstrapped'
);

-- ── 2. Añadir columnas a startups ─────────────────────────────────────────────
ALTER TABLE startups
  ADD COLUMN IF NOT EXISTS funding_stage         funding_stage,
  ADD COLUMN IF NOT EXISTS funding_stage_inferred boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_raising            boolean NOT NULL DEFAULT false;

-- ── 3. Backfill desde current_division ────────────────────────────────────────
-- Mapeo: ideation→pre_seed, seed→seed, growth→series_a, elite→series_b.
-- Todos los registros backfilleados quedan con funding_stage_inferred=true.
UPDATE startups
  SET
    funding_stage = CASE
      WHEN current_division = 'ideation' THEN 'pre_seed'::funding_stage
      WHEN current_division = 'seed'     THEN 'seed'::funding_stage
      WHEN current_division = 'growth'   THEN 'series_a'::funding_stage
      WHEN current_division = 'elite'    THEN 'series_b'::funding_stage
      ELSE NULL
    END,
    funding_stage_inferred = (current_division IS NOT NULL)
  WHERE funding_stage IS NULL;

-- ── 4. Índices en startups ────────────────────────────────────────────────────
CREATE INDEX ON startups(funding_stage);
CREATE INDEX ON startups(is_raising) WHERE is_raising = true;

-- ── 5. Comentarios ───────────────────────────────────────────────────────────
COMMENT ON COLUMN startups.funding_stage IS
  'Fase de financiación declarada por la startup. Fuente primaria para asignar division. NULL solo si startup pre-PROMPT_11 sin backfill exitoso.';
COMMENT ON COLUMN startups.funding_stage_inferred IS
  'TRUE si el valor fue inferido por backfill automático tras PROMPT_11. FALSE si la startup lo declaró/editó explícitamente.';
COMMENT ON COLUMN startups.is_raising IS
  'TRUE si la startup declara estar levantando ronda actualmente. Visible públicamente como badge si consent_public_profile=true.';

-- ── 6. Tabla de discrepancias del evaluador ───────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_evaluator_discrepancies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id            uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  evaluation_id         uuid REFERENCES evaluations(id) ON DELETE SET NULL,
  declared_funding_stage funding_stage NOT NULL,
  suspected_funding_stage funding_stage NOT NULL,
  severity              text NOT NULL CHECK (severity IN ('low','medium','high')),
  evaluator_reasoning   text NOT NULL,
  status                text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','confirmed_as_declared','overridden_by_admin','dismissed')
  ),
  admin_notes           text,
  reviewed_by           uuid REFERENCES profiles(id),
  reviewed_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON admin_evaluator_discrepancies(status) WHERE status = 'pending';
CREATE INDEX ON admin_evaluator_discrepancies(startup_id);
CREATE INDEX ON admin_evaluator_discrepancies(created_at DESC);

-- RLS: solo admin puede ver y modificar.
ALTER TABLE admin_evaluator_discrepancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_access" ON admin_evaluator_discrepancies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Verificaciones (ejecutar después de aplicar) ──────────────────────────────
-- 1. Enum creado:
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'funding_stage'::regtype ORDER BY enumsortorder;
-- Esperado: 7 filas (pre_seed, seed, series_a, series_b, series_c, series_d_plus, bootstrapped)

-- 2. Columnas añadidas:
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name='startups'
--   AND column_name IN ('funding_stage','funding_stage_inferred','is_raising');
-- Esperado: 3 filas

-- 3. Backfill exitoso:
-- SELECT current_division, funding_stage, funding_stage_inferred, count(*)
-- FROM startups WHERE current_division IS NOT NULL
-- GROUP BY current_division, funding_stage, funding_stage_inferred
-- ORDER BY current_division;
-- Esperado: cada division mapeada correctamente con inferred=true

-- 4. Tabla discrepancias:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name='admin_evaluator_discrepancies';
-- Esperado: 1 fila
