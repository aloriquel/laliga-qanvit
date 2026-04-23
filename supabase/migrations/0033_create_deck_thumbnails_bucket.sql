-- ── 0033_create_deck_thumbnails_bucket.sql ───────────────────────────────────
-- Crea el bucket privado deck-thumbnails para almacenar los PDFs recortados
-- (5 primeras páginas) que se sirven en el carousel de perfil público.
-- El bucket es privado — acceso siempre mediante signed URL (TTL 1h).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deck-thumbnails',
  'deck-thumbnails',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Service role puede subir y leer archivos (usado por el Server Component)
DO $$
BEGIN
  CREATE POLICY "service_role_deck_thumbnails_all"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'deck-thumbnails')
    WITH CHECK (bucket_id = 'deck-thumbnails');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
