-- Trigger to call ecosystem-alert-dispatcher when a new evaluation is inserted
-- (first eval of a startup triggers new-startup alerts to ecosystem orgs)

create or replace function notify_ecosystem_alert_dispatcher()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
  dispatcher_url text;
  secret_val text;
begin
  -- Only for the first evaluation of each startup
  select count(*) = 1 into is_first
  from evaluations where startup_id = new.startup_id;

  if not is_first then return new; end if;

  dispatcher_url := 'https://ongwrbdypbusnwlclqjg.supabase.co/functions/v1/ecosystem-alert-dispatcher';
  secret_val     := 'laliga-dev-secret-32chars-local1';

  perform net.http_post(
    url     := dispatcher_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || secret_val
    ),
    body    := jsonb_build_object(
      'evaluation_id', new.id::text,
      'startup_id',    new.startup_id::text
    )
  );

  return new;
end;
$$;

-- Name starts with 'trz_eco' to fire after trz_generate_alerts
create trigger trz_eco_alert_dispatcher
  after insert on evaluations
  for each row execute function notify_ecosystem_alert_dispatcher();
