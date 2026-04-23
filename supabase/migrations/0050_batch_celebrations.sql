-- ── 0050_batch_celebrations.sql ──────────────────────────────────────────────
-- Tracking de modales vistos y emails enviados a ganadores.
-- Una fila por (startup_id, batch_id). Pre-populada por close_batch_and_assign_winners.
-- Permite mostrar modal UNA VEZ y evitar duplicidad de emails.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS batch_celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  seen_modal_at timestamptz,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT batch_celebration_unique UNIQUE (startup_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_celebrations_startup_unseen
  ON batch_celebrations(startup_id)
  WHERE seen_modal_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_batch_celebrations_batch_unsent
  ON batch_celebrations(batch_id)
  WHERE email_sent_at IS NULL;

-- RLS
ALTER TABLE batch_celebrations ENABLE ROW LEVEL SECURITY;

-- Owner de la startup puede leer su propio row
CREATE POLICY "owner_can_read_own_celebration"
  ON batch_celebrations FOR SELECT
  USING (
    startup_id IN (SELECT id FROM startups WHERE owner_id = auth.uid())
  );

-- Owner puede marcar seen_modal_at
CREATE POLICY "owner_can_update_seen"
  ON batch_celebrations FOR UPDATE
  USING (
    startup_id IN (SELECT id FROM startups WHERE owner_id = auth.uid())
  );

COMMENT ON TABLE batch_celebrations IS
  'Tracking de modales vistos y emails enviados a ganadores.
   Una fila por (startup_id, batch_id). Pre-populada por close_batch_and_assign_winners.
   Modal se muestra 1x, email 1x.';

-- ── VERIFICACIÓN ─────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name = 'batch_celebrations';
-- -- Esperado: 1 fila
