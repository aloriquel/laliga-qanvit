-- Anonymous standings materialized view for ecosystem leaderboard
-- Refresh manually for now (pg_cron added in Prompt #6)

create materialized view if not exists ecosystem_anonymous_standings as
select
  o.id          as org_id,
  o.org_type,
  coalesce(sum(l.points), 0)::bigint as total_points,
  ntile(10) over (
    partition by o.org_type
    order by coalesce(sum(l.points), 0) desc
  ) as decile,
  percent_rank() over (
    partition by o.org_type
    order by coalesce(sum(l.points), 0)
  ) as percentile
from ecosystem_organizations o
left join ecosystem_points_log l on l.org_id = o.id
where o.is_verified = true
group by o.id, o.org_type;

create unique index if not exists idx_eco_standings_org on ecosystem_anonymous_standings(org_id);

-- RLS: each org sees all rows (needed for the chart) but API layer
-- only exposes org_type+decile for rows that aren't the user's own org.
-- Grant SELECT to authenticated.
grant select on ecosystem_anonymous_standings to authenticated;
