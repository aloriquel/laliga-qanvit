-- Materialized view: pre-computed leaderboard rankings
create materialized view league_standings as
select
  s.id as startup_id,
  s.slug,
  s.name,
  s.one_liner,
  s.logo_url,
  s.current_division,
  s.current_vertical,
  s.current_score,
  row_number() over (order by s.current_score desc) as rank_national,
  row_number() over (
    partition by s.current_division
    order by s.current_score desc
  ) as rank_division,
  row_number() over (
    partition by s.current_division, s.current_vertical
    order by s.current_score desc
  ) as rank_division_vertical
from startups s
where s.is_public = true
  and s.current_score is not null
  and s.consent_public_profile = true;

create unique index idx_league_standings_startup on league_standings(startup_id);
create index idx_league_standings_rank_national on league_standings(rank_national);
create index idx_league_standings_div_vert on league_standings(current_division, current_vertical);

-- View: live aggregated points and tier per ecosystem organization
create view ecosystem_totals as
select
  o.id as org_id,
  o.name,
  o.org_type,
  coalesce(sum(l.points), 0) as total_points,
  case
    when coalesce(sum(l.points), 0) >= 5001 then 'elite'::ecosystem_tier
    when coalesce(sum(l.points), 0) >= 1001 then 'pro'::ecosystem_tier
    else 'rookie'::ecosystem_tier
  end as tier
from ecosystem_organizations o
left join ecosystem_points_log l on l.org_id = o.id
group by o.id, o.name, o.org_type;

-- View: public-safe evaluation fields (no deck content exposed)
create or replace view public_evaluations as
select
  e.id,
  e.startup_id,
  e.assigned_division,
  e.assigned_vertical,
  e.score_total,
  e.summary,
  e.created_at
from evaluations e
join startups s on s.id = e.startup_id
where s.is_public = true and s.consent_public_profile = true;
