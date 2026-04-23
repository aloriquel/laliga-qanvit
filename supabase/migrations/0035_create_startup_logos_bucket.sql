-- ── 0035_create_startup_logos_bucket.sql ─────────────────────────────────────
-- Bucket público para logos de startups.
-- Lectura pública sin auth. Upload/delete solo via service_role (el endpoint
-- valida auth + ownership antes de usar el service client).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'startup-logos',
  'startup-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública sin auth (bucket ya es public=true, pero la policy es explícita)
DO $$
BEGIN
  CREATE POLICY "public_read_startup_logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'startup-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role gestiona subidas y borrados
DO $$
BEGIN
  CREATE POLICY "service_role_startup_logos_write"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'startup-logos')
    WITH CHECK (bucket_id = 'startup-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
