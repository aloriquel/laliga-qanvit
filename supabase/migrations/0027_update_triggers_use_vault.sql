-- Migration 0027: Rewrite all 3 trigger functions to read secrets from Vault
-- via get_vault_setting() instead of current_setting('app.settings.*').
--
-- Supersedes: 0007 (trigger_evaluator_pipeline), 0010 (notify_alert_dispatcher),
--             0016 + 0025 (notify_ecosystem_alert_dispatcher)
-- Requires:   0026 (get_vault_setting function)
--
-- NOTE: notify_dataset_exporter does NOT exist as a DB trigger.
-- The dataset exporter is invoked from the Next.js API route (/api/admin/data-export)
-- via fetch() — no DB trigger involved. Nothing to update there.

-- ── 1. trigger_evaluator_pipeline ────────────────────────────────────────────
-- Fires: AFTER INSERT on decks WHERE status = 'pending'
-- Vault secrets read: evaluator_url, evaluator_secret
-- Before: current_setting('app.settings.evaluator_url', true)
-- After:  get_vault_setting('evaluator_url')

create or replace function trigger_evaluator_pipeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn_url    text := get_vault_setting('evaluator_url');
  fn_secret text := get_vault_setting('evaluator_secret');
begin
  if fn_url is null or fn_url = '' or fn_secret is null or fn_secret = '' then
    raise warning 'trigger_evaluator_pipeline: vault secrets not set, skipping deck %', new.id;
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
$$;

-- Trigger definition unchanged — only the function body changed above
-- (CREATE OR REPLACE FUNCTION is enough; trigger still calls the same function name)

-- ── 2. notify_alert_dispatcher ───────────────────────────────────────────────
-- Fires: AFTER INSERT on startup_alerts
-- Vault secrets read: alert_dispatcher_url, evaluator_secret
-- Before: current_setting('app.settings.alert_dispatcher_url', true)
-- After:  get_vault_setting('alert_dispatcher_url')

create or replace function notify_alert_dispatcher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn_url    text := get_vault_setting('alert_dispatcher_url');
  fn_secret text := get_vault_setting('evaluator_secret');
begin
  if fn_url is null or fn_url = '' then
    raise warning 'notify_alert_dispatcher: vault secrets not set, skipping alert %', new.id;
    return new;
  end if;

  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || coalesce(fn_secret, '')
    ),
    body    := jsonb_build_object('alert_id', new.id::text),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

-- ── 3. notify_ecosystem_alert_dispatcher ─────────────────────────────────────
-- Fires: AFTER INSERT on evaluations (first eval per startup only)
-- Vault secrets read: ecosystem_alert_dispatcher_url, evaluator_secret
-- Before (0016): hardcoded URL + hardcoded 'laliga-dev-secret-32chars-local1'
-- Before (0025): current_setting() — never applied in prod
-- After:  get_vault_setting('ecosystem_alert_dispatcher_url')
--
-- NOTE: ecosystem-alert-dispatcher reads ECOSYSTEM_ALERT_SECRET from its Deno env.
-- The vault secret 'evaluator_secret' must match that Vercel env var value.
-- If you use a different value for ECOSYSTEM_ALERT_SECRET, create a separate
-- vault secret named 'ecosystem_alert_secret' and update the line below.

create or replace function notify_ecosystem_alert_dispatcher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn_url    text := get_vault_setting('ecosystem_alert_dispatcher_url');
  fn_secret text := get_vault_setting('evaluator_secret');
  is_first  boolean;
begin
  -- Only fire for the first evaluation of each startup
  select count(*) = 1 into is_first
  from evaluations where startup_id = new.startup_id;

  if not is_first then return new; end if;

  if fn_url is null or fn_url = '' or fn_secret is null or fn_secret = '' then
    raise warning 'notify_ecosystem_alert_dispatcher: vault secrets not set, skipping evaluation %', new.id;
    return new;
  end if;

  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || fn_secret
    ),
    body    := jsonb_build_object(
      'evaluation_id', new.id::text,
      'startup_id',    new.startup_id::text
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

-- Verify triggers still exist after function replacement:
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
-- WHERE tgname IN ('trg_deck_pipeline', 'trg_alert_dispatcher', 'trz_eco_alert_dispatcher');
