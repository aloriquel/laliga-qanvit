-- Migration 0007: Evaluator pipeline trigger via pg_net
-- Replaces the TODO stub in 0006_triggers.sql.
-- Reads runtime settings set via ALTER DATABASE ... SET app.settings.*
-- so the URL/secret can differ per environment without re-migrating.

-- ─────────────────────────────────────────────────────────────────────────────
-- Function that fires the edge function via pg_net
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function trigger_evaluator_pipeline()
returns trigger as $$
declare
  fn_url    text := current_setting('app.settings.evaluator_url', true);
  fn_secret text := current_setting('app.settings.evaluator_secret', true);
begin
  -- Silently skip when the pipeline is not configured (local dev without envs).
  if fn_url is null or fn_url = '' or fn_secret is null or fn_secret = '' then
    raise warning 'trigger_evaluator_pipeline: not configured, skipping deck %', new.id;
    return new;
  end if;

  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || fn_secret
    ),
    body              := jsonb_build_object('deck_id', new.id::text),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: fires after INSERT on decks when status = 'pending'
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists trg_deck_pipeline on decks;

create trigger trg_deck_pipeline
  after insert on decks
  for each row
  when (new.status = 'pending')
  execute function trigger_evaluator_pipeline();

-- ─────────────────────────────────────────────────────────────────────────────
-- HOW TO SET RUNTIME VALUES (run once per environment, never re-migrate):
--
-- LOCAL (psql / Supabase Studio → SQL editor):
--   alter database postgres
--     set app.settings.evaluator_url = 'http://host.docker.internal:54321/functions/v1/evaluator-pipeline';
--   alter database postgres
--     set app.settings.evaluator_secret = '<your-32-char-secret>';
--
-- PRODUCTION (Supabase Dashboard → SQL editor):
--   alter database postgres
--     set app.settings.evaluator_url = 'https://<project-ref>.supabase.co/functions/v1/evaluator-pipeline';
--   alter database postgres
--     set app.settings.evaluator_secret = '<your-32-char-secret>';
--
-- Reload settings without restart: SELECT pg_reload_conf();
-- ─────────────────────────────────────────────────────────────────────────────
