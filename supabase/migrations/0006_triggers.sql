-- Triggers for La Liga Qanvit

-- 5.1 Create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 5.2 Generic updated_at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_startups_updated_at
  before update on startups
  for each row execute function set_updated_at();

create trigger trg_ecosystem_orgs_updated_at
  before update on ecosystem_organizations
  for each row execute function set_updated_at();

-- 5.3 Sync startups.current_* after new evaluation and refresh materialized view
create or replace function sync_startup_current_eval()
returns trigger as $$
begin
  update startups
  set
    current_division = new.assigned_division,
    current_vertical = new.assigned_vertical,
    current_score = new.score_total
  where id = new.startup_id;

  refresh materialized view concurrently league_standings;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_sync_startup_eval
  after insert on evaluations
  for each row execute function sync_startup_current_eval();

-- 5.4 TODO: trigger_evaluator_pipeline
-- Enabled in prompt #2 when the edge function is deployed.
-- When a deck is inserted with status='pending', calls the evaluator-pipeline edge function via pg_net.
--
-- create or replace function trigger_evaluator_pipeline()
-- returns trigger as $$
-- begin
--   perform net.http_post(
--     url := current_setting('app.settings.evaluator_url'),
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.edge_fn_secret')
--     ),
--     body := jsonb_build_object('deck_id', new.id)
--   );
--   return new;
-- end;
-- $$ language plpgsql security definer;
--
-- create trigger trg_deck_pipeline
--   after insert on decks
--   for each row
--   when (new.status = 'pending')
--   execute function trigger_evaluator_pipeline();
