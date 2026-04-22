-- Migration 0028: Re-schedule cron jobs that call edge functions using get_vault_setting()
-- Supersedes the edge-function cron jobs from 0018_pg_cron_jobs.sql.
-- Requires: 0026 (get_vault_setting function)
--
-- Pure-SQL jobs (refresh-metrics-summary, refresh-anon-standings,
-- complete-expired-challenges, cleanup-expired-exports, exports-file-cleanup)
-- are NOT touched.

DO $$
BEGIN
  PERFORM cron.unschedule('update-challenge-progress');
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-ecosystem-digest');
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-ecosystem-digest');
EXCEPTION WHEN others THEN NULL;
END $$;

SELECT cron.schedule(
  'update-challenge-progress',
  '15 0 * * *',
  $cmd$
    SELECT net.http_post(
      url     := get_vault_setting('challenge_progress_updater_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_vault_setting('evaluator_secret')
      ),
      body    := '{}'::jsonb
    )
    WHERE get_vault_setting('challenge_progress_updater_url') IS NOT NULL
  $cmd$
);

SELECT cron.schedule(
  'daily-ecosystem-digest',
  '0 8 * * *',
  $cmd$
    SELECT net.http_post(
      url     := get_vault_setting('ecosystem_digest_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_vault_setting('evaluator_secret')
      ),
      body    := '{"frequency":"daily"}'::jsonb
    )
    WHERE get_vault_setting('ecosystem_digest_url') IS NOT NULL
  $cmd$
);

SELECT cron.schedule(
  'weekly-ecosystem-digest',
  '0 8 * * 1',
  $cmd$
    SELECT net.http_post(
      url     := get_vault_setting('ecosystem_digest_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || get_vault_setting('evaluator_secret')
      ),
      body    := '{"frequency":"weekly"}'::jsonb
    )
    WHERE get_vault_setting('ecosystem_digest_url') IS NOT NULL
  $cmd$
);
