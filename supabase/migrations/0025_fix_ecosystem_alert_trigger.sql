-- Migration 0025: Fix ecosystem alert trigger — replace hardcoded dev secret
-- with runtime settings, matching the pattern from 0007_evaluator_trigger.sql.
--
-- BEFORE applying, ensure these runtime settings are set in the DB:
--   SELECT current_setting('app.settings.ecosystem_alert_dispatcher_url', true);
--   SELECT current_setting('app.settings.evaluator_secret', true);
--
-- If they are null, set them:
--   ALTER DATABASE postgres SET "app.settings.ecosystem_alert_dispatcher_url" =
--     'https://<project-ref>.supabase.co/functions/v1/ecosystem-alert-dispatcher';
--   ALTER DATABASE postgres SET "app.settings.evaluator_secret" = '<your-32-char-secret>';
--   SELECT pg_reload_conf();

create or replace function notify_ecosystem_alert_dispatcher()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fn_url    text := current_setting('app.settings.ecosystem_alert_dispatcher_url', true);
  fn_secret text := current_setting('app.settings.evaluator_secret', true);
  is_first  boolean;
begin
  -- Only fire for the first evaluation of each startup (same guard as before)
  select count(*) = 1 into is_first
  from evaluations where startup_id = new.startup_id;

  if not is_first then return new; end if;

  -- Skip gracefully when not configured (local dev without env settings)
  if fn_url is null or fn_url = '' or fn_secret is null or fn_secret = '' then
    raise warning 'notify_ecosystem_alert_dispatcher: not configured, skipping evaluation %', new.id;
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

-- The trigger itself does not need to be recreated — it still calls
-- notify_ecosystem_alert_dispatcher() which we just replaced above.
-- Verify the trigger exists:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trz_eco_alert_dispatcher';
