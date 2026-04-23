-- ── 0038_batches_schema.sql ───────────────────────────────────────────────────
-- Infraestructura de batches trimestrales para La Liga Qanvit.
-- Tablas: batches, batch_participations, batch_winners.
-- RLS: lectura pública, escritura solo service_role.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE batch_status AS ENUM ('upcoming', 'active', 'closed', 'archived');

CREATE TYPE batch_quarter AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'Q0_HISTORICO');

-- ── Tabla batches ─────────────────────────────────────────────────────────────

CREATE TABLE batches (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text          UNIQUE NOT NULL,          -- 'q3-2026', 'batch-0-historico'
  quarter              batch_quarter NOT NULL,
  year                 int           NOT NULL,
  display_name         text          NOT NULL,                 -- 'Q3 2026', 'Batch 0 (Histórico)'
  starts_at            timestamptz   NOT NULL,
  ends_at              timestamptz   NOT NULL,
  status               batch_status  NOT NULL DEFAULT 'upcoming',
  closed_at            timestamptz,
  winners_computed_at  timestamptz,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT batch_date_order    CHECK (ends_at > starts_at),
  CONSTRAINT batch_unique_period UNIQUE (quarter, year)
);

CREATE INDEX ON batches(status) WHERE status IN ('active', 'upcoming');
CREATE INDEX ON batches(starts_at, ends_at);

COMMENT ON TABLE batches IS
  'Trimestres cerrados de la Liga Qanvit. Cada batch tiene start/end
   en Europe/Madrid y status upcoming/active/closed/archived.';

-- ── Tabla batch_participations ────────────────────────────────────────────────

CREATE TABLE batch_participations (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id                uuid          NOT NULL REFERENCES batches(id)     ON DELETE CASCADE,
  startup_id              uuid          NOT NULL REFERENCES startups(id)    ON DELETE CASCADE,
  baseline_score          numeric(5,2),
  baseline_evaluation_id  uuid          REFERENCES evaluations(id)          ON DELETE SET NULL,
  -- Rellenado al cierre: 0.7 * score + 0.3 * votos_norm (con cap +10)
  final_score             numeric(5,2),
  vote_bonus              numeric(4,2),
  votes_up                int           DEFAULT 0,
  votes_down              int           DEFAULT 0,
  -- Rankings calculados al cierre
  rank_national           int,
  rank_division           int,
  rank_region_ca          int,
  rank_vertical           int,
  -- Trazabilidad
  deck_uploads_count      int           NOT NULL DEFAULT 0,
  participated_via        text          NOT NULL DEFAULT 'pending'
    CHECK (participated_via IN ('pending', 'baseline_heredado', 'deck_nuevo', 'deck_actualizado')),
  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT batch_participation_unique UNIQUE (batch_id, startup_id)
);

CREATE INDEX ON batch_participations(batch_id);
CREATE INDEX ON batch_participations(startup_id);
CREATE INDEX ON batch_participations(batch_id, final_score DESC) WHERE final_score IS NOT NULL;

COMMENT ON TABLE batch_participations IS
  'Relación startup ↔ batch con score baseline, votos y rankings finales.';

-- ── Tabla batch_winners ───────────────────────────────────────────────────────

CREATE TABLE batch_winners (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         uuid         NOT NULL REFERENCES batches(id)              ON DELETE CASCADE,
  startup_id       uuid         NOT NULL REFERENCES startups(id)             ON DELETE CASCADE,
  participation_id uuid         NOT NULL REFERENCES batch_participations(id) ON DELETE CASCADE,
  category         text         NOT NULL CHECK (category IN (
                     'national_top1', 'national_top2', 'national_top3',
                     'division_top1', 'region_ca_top1', 'vertical_top1'
                   )),
  -- Para categorías segmentadas: qué segmento ganó. NULL para national_*.
  segment_key      text,        -- 'seed', 'madrid', 'deeptech_ai', etc.
  final_score      numeric(5,2) NOT NULL,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX ON batch_winners(batch_id);
CREATE INDEX ON batch_winners(startup_id);
CREATE INDEX ON batch_winners(category, segment_key);

COMMENT ON TABLE batch_winners IS
  'Ganadores por categoría. top3 nacional + top1 división siempre.
   top1 CA/vertical solo si segmento tuvo >=5 startups (decidido en 12B).';

-- ── RLS: lectura pública, escritura solo service_role ─────────────────────────

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_batches" ON batches FOR SELECT USING (true);
CREATE POLICY "service_write_batches" ON batches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE batch_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_participations" ON batch_participations FOR SELECT USING (true);
CREATE POLICY "service_write_participations" ON batch_participations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE batch_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_winners" ON batch_winners FOR SELECT USING (true);
CREATE POLICY "service_write_winners" ON batch_winners
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── VERIFICACIÓN tras aplicar 0038 ───────────────────────────────────────────
-- SELECT typname FROM pg_type WHERE typname IN ('batch_status', 'batch_quarter');
-- -- Esperado: 2 filas

-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('batches', 'batch_participations', 'batch_winners');
-- -- Esperado: 3 filas

-- SELECT tablename, policyname FROM pg_policies
-- WHERE tablename IN ('batches', 'batch_participations', 'batch_winners')
-- ORDER BY tablename, policyname;
-- -- Esperado: 6 filas (2 policies × 3 tablas)
