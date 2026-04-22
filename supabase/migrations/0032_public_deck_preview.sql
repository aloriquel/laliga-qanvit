-- ── 0032_public_deck_preview.sql ─────────────────────────────────────────────
-- Deck preview público con watermark bake-in.
-- Añade consent_public_deck (startup) y seen_deck_consent_wizard (profile)
-- para controlar qué startups exponen sus primeras 5 slides en su perfil público.
-- Las thumbnails se generan en Vercel (Node runtime) tras la evaluación exitosa.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. consent_public_deck en startups ───────────────────────────────────────
ALTER TABLE startups
  ADD COLUMN IF NOT EXISTS consent_public_deck boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN startups.consent_public_deck IS
  'Startup autoriza mostrar las 5 primeras slides del deck con watermark en su perfil público.';

-- ── 2. seen_deck_consent_wizard en profiles ───────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS seen_deck_consent_wizard boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.seen_deck_consent_wizard IS
  'Marca si el wizard de activación del deck preview ya fue mostrado al usuario (no repetir).';

-- ── 3. Tabla deck_public_previews ─────────────────────────────────────────────
-- Cada fila representa una slide (1-5) del deck más reciente de una startup
-- convertida a PNG con watermark bake-in y subida al bucket deck-thumbnails.
CREATE TABLE IF NOT EXISTS deck_public_previews (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id    uuid        NOT NULL REFERENCES startups(id)  ON DELETE CASCADE,
  deck_id       uuid        NOT NULL REFERENCES decks(id)     ON DELETE CASCADE,
  slide_number  int         NOT NULL CHECK (slide_number BETWEEN 1 AND 5),
  thumbnail_url text        NOT NULL,
  width         int,
  height        int,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deck_id, slide_number)
);

COMMENT ON TABLE deck_public_previews IS
  'Thumbnails PNG (watermark bake-in) de las 5 primeras slides del deck más reciente.';

CREATE INDEX IF NOT EXISTS deck_public_previews_startup_id_idx
  ON deck_public_previews(startup_id);

CREATE INDEX IF NOT EXISTS deck_public_previews_deck_id_idx
  ON deck_public_previews(deck_id);

-- ── 4. RLS lectura pública condicional ───────────────────────────────────────
ALTER TABLE deck_public_previews ENABLE ROW LEVEL SECURITY;

-- Lectura pública: solo si la startup tiene los tres consent activos
CREATE POLICY "public_read_deck_preview" ON deck_public_previews
  FOR SELECT USING (
    startup_id IN (
      SELECT id FROM startups
      WHERE is_public              = true
        AND consent_public_profile = true
        AND consent_public_deck    = true
    )
  );

-- Service role puede INSERT/UPDATE para la API route de Vercel
CREATE POLICY "service_write_deck_preview" ON deck_public_previews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Verificación ──────────────────────────────────────────────────────────────
-- Tras aplicar, ejecutar en SQL Editor:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='startups' AND column_name='consent_public_deck';
-- → debe devolver 1 fila.
