-- Referral tracking: new enum values + grant_referral_signup_points trigger
-- + extend generate_startup_alerts with ecosystem point grants

-- ── Extend points_event_type enum ─────────────────────────────────────────
alter type points_event_type add value if not exists 'startup_referred_phase_up';
alter type points_event_type add value if not exists 'challenge_winner';

-- ── grant_referral_signup_points ──────────────────────────────────────────
-- Fires after evaluation INSERT; grants +100 pts to referring org on first eval
create or replace function grant_referral_signup_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref_org_id  uuid;
  is_first    boolean;
begin
  -- Only on first successful evaluation for this startup
  select count(*) = 1 into is_first
  from evaluations where startup_id = new.startup_id;

  if not is_first then return new; end if;

  select referred_by_org_id into ref_org_id
  from startups where id = new.startup_id;

  if ref_org_id is null then return new; end if;

  -- Anti-fraud: no self-referral (org owner = startup owner)
  if exists (
    select 1 from startups s
    join ecosystem_organizations o on o.id = ref_org_id
    where s.id = new.startup_id and s.owner_id = o.owner_id
  ) then return new; end if;

  insert into ecosystem_points_log
    (org_id, event_type, points, reference_startup_id, reference_evaluation_id)
  values
    (ref_org_id, 'startup_referred_signup', 100, new.startup_id, new.id);

  return new;
end;
$$;

create trigger trg_grant_referral_signup
  after insert on evaluations
  for each row execute function grant_referral_signup_points();

-- ── Extend generate_startup_alerts with ecosystem point grants ────────────
-- Replaces the function from 0009 to add referral points logic
create or replace function generate_startup_alerts()
returns trigger as $$
declare
  prev_eval     evaluations%rowtype;
  new_rank      record;
  prev_rank_nat bigint;
  prev_rank_div bigint;
  ref_org_id    uuid;
begin
  select * into prev_eval
  from evaluations
  where startup_id = new.startup_id and id != new.id
  order by created_at desc limit 1;

  select * into new_rank
  from league_standings where startup_id = new.startup_id;

  if new_rank is null then return new; end if;

  -- Referring org for ecosystem point grants
  select referred_by_org_id into ref_org_id
  from startups where id = new.startup_id;

  -- ── First evaluation ────────────────────────────────────────────────────
  if prev_eval is null then
    if new_rank.rank_division_vertical <= 3 then
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'new_top3_vertical', jsonb_build_object(
        'vertical', new.assigned_vertical,
        'division', new.assigned_division,
        'new_rank', new_rank.rank_division_vertical
      ));
      if ref_org_id is not null then
        insert into ecosystem_points_log (org_id, event_type, points, reference_startup_id, reference_evaluation_id)
        values (ref_org_id, 'startup_referred_top10', 500, new.startup_id, new.id)
        on conflict do nothing;
      end if;
    elsif new_rank.rank_division_vertical <= 10 then
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'new_top10_vertical', jsonb_build_object(
        'vertical', new.assigned_vertical,
        'division', new.assigned_division,
        'new_rank', new_rank.rank_division_vertical
      ));
      if ref_org_id is not null then
        insert into ecosystem_points_log (org_id, event_type, points, reference_startup_id, reference_evaluation_id)
        values (ref_org_id, 'startup_referred_top10', 500, new.startup_id, new.id)
        on conflict do nothing;
      end if;
    end if;
    return new;
  end if;

  -- ── Division change ─────────────────────────────────────────────────────
  if new.assigned_division != prev_eval.assigned_division then
    if league_division_order(new.assigned_division) > league_division_order(prev_eval.assigned_division) then
      insert into startup_alerts (startup_id, alert_type, payload)
      values (new.startup_id, 'moved_up_division', jsonb_build_object(
        'from', prev_eval.assigned_division,
        'to', new.assigned_division,
        'new_score', new.score_total,
        'old_score', prev_eval.score_total
      ));
      if ref_org_id is not null then
        insert into ecosystem_points_log (org_id, event_type, points, reference_startup_id, reference_evaluation_id)
        values (ref_org_id, 'startup_referred_phase_up', 250, new.startup_id, new.id)
        on conflict do nothing;
      end if;
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

  -- ── Top 3 / top 10 vertical ─────────────────────────────────────────────
  if new_rank.rank_division_vertical <= 3 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'new_top3_vertical', jsonb_build_object(
      'vertical', new.assigned_vertical,
      'division', new.assigned_division,
      'new_rank', new_rank.rank_division_vertical
    ));
    if ref_org_id is not null then
      insert into ecosystem_points_log (org_id, event_type, points, reference_startup_id, reference_evaluation_id)
      values (ref_org_id, 'startup_referred_top10', 500, new.startup_id, new.id)
      on conflict do nothing;
    end if;
  elsif new_rank.rank_division_vertical <= 10 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'new_top10_vertical', jsonb_build_object(
      'vertical', new.assigned_vertical,
      'division', new.assigned_division,
      'new_rank', new_rank.rank_division_vertical
    ));
    if ref_org_id is not null then
      insert into ecosystem_points_log (org_id, event_type, points, reference_startup_id, reference_evaluation_id)
      values (ref_org_id, 'startup_referred_top10', 500, new.startup_id, new.id)
      on conflict do nothing;
    end if;
  end if;

  -- ── Top 10 division ─────────────────────────────────────────────────────
  if new_rank.rank_division <= 10 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'new_top10_division', jsonb_build_object(
      'division', new.assigned_division,
      'new_rank', new_rank.rank_division
    ));
  end if;

  -- ── Position milestone ───────────────────────────────────────────────────
  select count(*) + 1 into prev_rank_nat
  from league_standings where current_score > prev_eval.score_total;

  select count(*) + 1 into prev_rank_div
  from league_standings
  where current_score > prev_eval.score_total
    and current_division = new.assigned_division;

  if (prev_rank_nat - new_rank.rank_national) >= 50 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'position_milestone', jsonb_build_object(
      'scope', 'national', 'from', prev_rank_nat, 'to', new_rank.rank_national
    ));
  end if;

  if (prev_rank_div - new_rank.rank_division) >= 20 then
    insert into startup_alerts (startup_id, alert_type, payload)
    values (new.startup_id, 'position_milestone', jsonb_build_object(
      'scope', 'division', 'from', prev_rank_div, 'to', new_rank.rank_division
    ));
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
