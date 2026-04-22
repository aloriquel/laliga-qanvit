-- Migration 0028: Recreate pg_cron jobs that call edge functions using get_setting()
-- Supersedes the 4 edge-function cron jobs from 0018_pg_cron_jobs.sql.
-- Requires: 0026 (get_setting function)
--
-- The 4 pure-SQL jobs (refresh-metrics-summary, refresh-anon-standings,
-- complete-expired-challenges, cleanup-expired-exports) are untouched.

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN (
  'update-challenge-progress',
  'daily-ecosystem-digest',
  'weekly-ecosystem-digest',
  'exports-file-cleanup'
);

SELECT cron.schedule(
  'update-challenge-progress',
  '15 0 * * *',
  $$
    SELECT net.http_post(
      url     := get_setting('challenge_progress_updater_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_setting('evaluator_secret')
      ),
      body    := '{}'::jsonb
    )
    WHERE get_setting('challenge_progress_updater_url') IS NOT NULL
  $$
);

SELECT cron.schedule(
  'daily-ecosystem-digest',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url     := get_setting('ecosystem_digest_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_setting('evaluator_secret')
      ),
      body    := '{"frequency":"daily"}'::jsonb
    )
    WHERE get_setting('ecosystem_digest_url') IS NOT NULL
  $$
);

SELECT cron.schedule(
  'weekly-ecosystem-digest',
  '0 8 * * 1',
  $$
    SELECT net.http_post(
      url     := get_setting('ecosystem_digest_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_setting('evaluator_secret')
      ),
      body    := '{"frequency":"weekly"}'::jsonb
    )
    WHERE get_setting('ecosystem_digest_url') IS NOT NULL
  $$
);

SELECT cron.schedule(
  'exports-file-cleanup',
  '30 3 * * *',
  $$
    SELECT net.http_post(
      url     := get_setting('exports_cleanup_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_setting('evaluator_secret')
      ),
      body    := '{}'::jsonb
    )
    WHERE get_setting('exports_cleanup_url') IS NOT NULL
  $$
);
