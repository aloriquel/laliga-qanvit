-- Alert generation trigger on evaluations INSERT
-- Must fire AFTER trg_sync_startup_eval (which refreshes league_standings).
-- Trigger name starts with 'trz' so it sorts alphabetically after 'trg_sync_startup_eval'.

-- Helper: numeric order for divisions
create or replace function league_division_order(d league_division)
returns int as $$
  select case d
    when 'ideation' then 1
    when 'seed'     then 2
    when 'growth'   then 3
    when 'elite'    then 4
  end;
$$ language sql immutable;

create or replace function generate_startup_alerts()
returns trigger as $$
declare
  prev_eval     evaluations%rowtype;
  new_rank      record;
  prev_rank_nat bigint;
  prev_rank_div bigint;
begin
  -- Previous evaluation for this startup (excluding the one just inserted)
  select * into prev_eval
  from evaluations
  where startup_id = new.startup_id
    and id != new.id
  order by created_at desc
  limit 1;

  -- Current ranking (league_standings was already refreshed by trg_sync_startup_eval)
  select * into new_rank
  from league_standings
  where startup_id = new.startup_id;

  -- If startup is not in standings (not public or no consent), nothing to do
  if new_rank is null then
    return new;
  end if;

  -- ── First evaluation ──────────────────────────────────────────────────────
  if prev_eval is null then
    if new_rank.rank_division_vertical <= 3 then
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'new_top3_vertical', jsonb_build_object(
        'vertical', new.assigned_vertical,
        'division', new.assigned_division,
        'new_rank', new_rank.rank_division_vertical
      ));
    elsif new_rank.rank_division_vertical <= 10 then
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'new_top10_vertical', jsonb_build_object(
        'vertical', new.assigned_vertical,
        'division', new.assigned_division,
        'new_rank', new_rank.rank_division_vertical
      ));
    end if;
    return new;
  end if;

  -- ── Division change ───────────────────────────────────────────────────────
  if new.assigned_division != prev_eval.assigned_division then
    if league_division_order(new.assigned_division) > league_division_order(prev_eval.assigned_division) then
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'moved_up_division', jsonb_build_object(
        'from', prev_eval.assigned_division,
        'to', new.assigned_division,
        'new_score', new.score_total,
        'old_score', prev_eval.score_total
      ));
    else
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'moved_down_division', jsonb_build_object(
        'from', prev_eval.assigned_division,
        'to', new.assigned_division,
        'new_score', new.score_total,
        'old_score', prev_eval.score_total
      ));
    end if;
  end if;

  -- ── Top 3 / top 10 vertical ───────────────────────────────────────────────
  if new_rank.rank_division_vertical <= 3 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'new_top3_vertical', jsonb_build_object(
      'vertical', new.assigned_vertical,
      'division', new.assigned_division,
      'new_rank', new_rank.rank_division_vertical
    ));
  elsif new_rank.rank_division_vertical <= 10 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'new_top10_vertical', jsonb_build_object(
      'vertical', new.assigned_vertical,
      'division', new.assigned_division,
      'new_rank', new_rank.rank_division_vertical
    ));
  end if;

  -- ── Top 10 division ───────────────────────────────────────────────────────
  if new_rank.rank_division <= 10 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'new_top10_division', jsonb_build_object(
      'division', new.assigned_division,
      'new_rank', new_rank.rank_division
    ));
  end if;

  -- ── Position milestone ────────────────────────────────────────────────────
  -- Estimate previous national rank: count startups with higher score than prev eval
  select count(*) + 1 into prev_rank_nat
  from league_standings
  where current_score > prev_eval.score_total;

  select count(*) + 1 into prev_rank_div
  from league_standings
  where current_score > prev_eval.score_total
    and current_division = new.assigned_division;

  if (prev_rank_nat - new_rank.rank_national) >= 50 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'position_milestone', jsonb_build_object(
      'scope', 'national',
      'from', prev_rank_nat,
      'to', new_rank.rank_national
    ));
  end if;

  if (prev_rank_div - new_rank.rank_division) >= 20 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'position_milestone', jsonb_build_object(
      'scope', 'division',
      'from', prev_rank_div,
      'to', new_rank.rank_division
    ));
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Name starts with 'trz' so Postgres fires it AFTER 'trg_sync_startup_eval'
create trigger trz_generate_alerts
  after insert on evaluations
  for each row
  execute function generate_startup_alerts();
