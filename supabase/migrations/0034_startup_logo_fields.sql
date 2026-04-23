-- ── 0034_startup_logo_fields.sql ─────────────────────────────────────────────
-- Añade logo_storage_path y logo_updated_at a startups.
-- logo_url ya existe desde 0003 — no se toca.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE startups
  ADD COLUMN IF NOT EXISTS logo_storage_path text,
  ADD COLUMN IF NOT EXISTS logo_updated_at   timestamptz;

COMMENT ON COLUMN startups.logo_storage_path IS
  'Path interno en bucket startup-logos para cleanup en re-subidas. Ejemplo: {startup_id}/{uuid}.png';
COMMENT ON COLUMN startups.logo_updated_at IS
  'Timestamp de la última actualización del logo, para cache busting.';
