-- Migration 0018: pg_cron background automation jobs
-- Pre-requisites: pg_cron and pg_net extensions (enabled in 0001)
--
-- BEFORE applying: set these runtime settings in the DB (replace values):
--   ALTER DATABASE postgres SET "app.settings.supabase_url" = 'https://ongwrbdypbusnwlclqjg.supabase.co';
--   ALTER DATABASE postgres SET "app.settings.evaluator_secret" = 'your-evaluator-fn-secret';
--   ALTER DATABASE postgres SET "app.settings.challenge_progress_updater_url" = 'https://ongwrbdypbusnwlclqjg.functions.supabase.co/challenge-progress-updater';
--   ALTER DATABASE postgres SET "app.settings.ecosystem_digest_url" = 'https://ongwrbdypbusnwlclqjg.functions.supabase.co/ecosystem-digest-sender';
--   ALTER DATABASE postgres SET "app.settings.exports_cleanup_url" = 'https://ongwrbdypbusnwlclqjg.functions.supabase.co/exports-file-cleanup';

-- Remove existing jobs if any (idempotent)
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN (
  'refresh-metrics-summary',
  'refresh-anon-standings',
  'complete-expired-challenges',
  'cleanup-expired-exports',
  'update-challenge-progress',
  'daily-ecosystem-digest',
  'weekly-ecosystem-digest',
  'exports-file-cleanup'
);

-- 1. Refresh metrics_summary cada hora
SELECT cron.schedule(
  'refresh-metrics-summary',
  '0 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_summary$$
);

-- 2. Refresh ecosystem_anonymous_standings cada 4 horas
SELECT cron.schedule(
  'refresh-anon-standings',
  '0 */4 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY ecosystem_anonymous_standings$$
);

-- 3. Auto-completar retos cuando pasa active_ends_at (diario 00:30)
SELECT cron.schedule(
  'complete-expired-challenges',
  '30 0 * * *',
  $$
    UPDATE challenges
    SET status = 'completed'
    WHERE status = 'active'
      AND active_ends_at < NOW()
  $$
);

-- 4. Limpiar dataset_exports expirados de la tabla (diario 03:00)
SELECT cron.schedule(
  'cleanup-expired-exports',
  '0 3 * * *',
  $$DELETE FROM dataset_exports WHERE expires_at < NOW()$$
);

-- 5. Actualizar challenge_progress via edge function (diario 00:15)
SELECT cron.schedule(
  'update-challenge-progress',
  '15 0 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.settings.challenge_progress_updater_url'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.settings.evaluator_secret')
      ),
      body    := '{}'::jsonb
    )
  $$
);

-- 6. Digest diario alertas ecosistema frequency='daily' (08:00)
SELECT cron.schedule(
  'daily-ecosystem-digest',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.settings.ecosystem_digest_url'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.settings.evaluator_secret')
      ),
      body    := '{"frequency":"daily"}'::jsonb
    )
  $$
);

-- 7. Digest semanal (lunes 08:00)
SELECT cron.schedule(
  'weekly-ecosystem-digest',
  '0 8 * * 1',
  $$
    SELECT net.http_post(
      url     := current_setting('app.settings.ecosystem_digest_url'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.settings.evaluator_secret')
      ),
      body    := '{"frequency":"weekly"}'::jsonb
    )
  $$
);

-- 8. Limpiar archivos expirados del bucket 'exports' via edge function (diario 03:30)
SELECT cron.schedule(
  'exports-file-cleanup',
  '30 3 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.settings.exports_cleanup_url'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.settings.evaluator_secret')
      ),
      body    := '{}'::jsonb
    )
  $$
);
