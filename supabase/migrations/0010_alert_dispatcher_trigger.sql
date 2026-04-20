-- Alert dispatcher trigger: calls alert-dispatcher edge function on new alert insert

create or replace function notify_alert_dispatcher()
returns trigger as $$
declare
  fn_url    text := current_setting('app.settings.alert_dispatcher_url', true);
  fn_secret text := current_setting('app.settings.evaluator_secret', true);
begin
  if fn_url is null or fn_url = '' then
    return new;
  end if;
  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || fn_secret
    ),
    body    := jsonb_build_object('alert_id', new.id::text),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_alert_dispatcher
  after insert on startup_alerts
  for each row
  execute function notify_alert_dispatcher();
