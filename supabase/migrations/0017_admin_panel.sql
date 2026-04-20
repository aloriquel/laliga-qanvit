-- Admin panel: audit log, settings, dataset exports,
-- calibration flag, metrics views, cohort & heatmap functions

-- ── admin_action_type enum ───────────────────────────────────────────────────
create type admin_action_type as enum (
  'org_approved',
  'org_rejected',
  'org_info_requested',
  'org_revoked',
  'org_points_adjusted',
  'evaluation_overridden',
  'evaluation_rerun',
  'evaluation_deleted',
  'evaluation_calibration_flagged',
  'appeal_accepted_override',
  'appeal_accepted_rerun',
  'appeal_rejected',
  'startup_hidden',
  'startup_restored',
  'startup_rerun_forced',
  'challenge_approved_voting',
  'challenge_activated',
  'challenge_cancelled',
  'challenge_prizes_distributed',
  'dataset_exported',
  'setting_updated'
);

-- ── admin_audit_log ──────────────────────────────────────────────────────────
create table admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references profiles(id),
  action_type admin_action_type not null,
  target_type text not null,
  target_id   uuid,
  payload     jsonb not null default '{}',
  reason      text,
  created_at  timestamptz not null default now()
);

create index idx_audit_log_admin   on admin_audit_log(admin_id);
create index idx_audit_log_created on admin_audit_log(created_at desc);
create index idx_audit_log_type    on admin_audit_log(action_type);

alter table admin_audit_log enable row level security;
create policy "audit_admin_all" on admin_audit_log
  for all using (is_admin());

-- ── admin_settings ───────────────────────────────────────────────────────────
create table admin_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now()
);

alter table admin_settings enable row level security;
create policy "settings_admin_all" on admin_settings
  for all using (is_admin());

-- seed initial settings
insert into admin_settings (key, value, description) values
  ('llm_budget_monthly_usd',      '500',  'Presupuesto mensual LLM en USD. Warning si forecast supera.'),
  ('pipeline_error_threshold_pct','10',   'Umbral % errores pipeline para alerta operativa.'),
  ('challenge_min_votes',         '5',    'Votos mínimos para que admin pueda activar un reto.'),
  ('referral_cookie_days',        '180',  'Días de duración de la cookie qvt_ref.'),
  ('deck_cooldown_days',          '7',    'Días mínimos entre re-subidas de deck.'),
  ('rate_limit_upload_per_hour',  '2',    'Máximo uploads por hora por usuario.');

-- ── dataset_exports ──────────────────────────────────────────────────────────
create table dataset_exports (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid not null references profiles(id),
  scope           text not null,           -- 'full' | 'vertical' | 'date_range'
  filters         jsonb default '{}',
  record_count    int,
  file_size_bytes int,
  storage_path    text,                    -- 'exports/{id}.json'
  status          text not null default 'pending',
  error_message   text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  expires_at      timestamptz
);

alter table dataset_exports enable row level security;
create policy "exports_admin_all" on dataset_exports
  for all using (is_admin());

-- ── evaluations: calibration flag ───────────────────────────────────────────
alter table evaluations
  add column if not exists is_calibration_sample boolean not null default false;

-- ── metrics_summary materialized view ───────────────────────────────────────
create materialized view metrics_summary as
select
  (select count(*) from startups where current_score is not null)::int                                            as startups_with_score,
  (select count(*) from ecosystem_organizations where is_verified = true)::int                                    as orgs_verified,
  (select count(*) from decks where status = 'evaluated')::int                                                    as decks_evaluated_total,
  (select count(*) from decks where status = 'error')::int                                                        as decks_error_total,
  (select count(*) from decks where status = 'evaluated'
     and processed_at > now() - interval '7 days')::int                                                           as decks_evaluated_7d,
  (select count(*) from decks where status = 'error'
     and uploaded_at > now() - interval '7 days')::int                                                            as decks_error_7d,
  round(
    100.0 *
    (select count(*) from decks where status = 'evaluated' and processed_at > now() - interval '7 days')::numeric /
    nullif((select count(*) from decks where status in ('evaluated','error') and uploaded_at > now() - interval '7 days'), 0),
    2
  )                                                                                                                as pipeline_success_rate_7d,
  coalesce((select sum(cost_estimate_usd) from evaluations), 0)::numeric                                          as total_cost_usd,
  coalesce((select sum(cost_estimate_usd) from evaluations where created_at > now() - interval '7 days'), 0)::numeric   as cost_usd_7d,
  coalesce((select sum(cost_estimate_usd) from evaluations where created_at > now() - interval '30 days'), 0)::numeric  as cost_usd_30d,
  coalesce((select avg(cost_estimate_usd) from evaluations where created_at > now() - interval '30 days'), 0)::numeric  as avg_cost_per_eval_30d,
  (select count(*) from evaluations
     where (feedback->>'degraded_mode')::boolean = true
       and created_at > now() - interval '30 days')::int                                                          as degraded_evals_30d,
  coalesce((select avg(latency_ms) from evaluations
     where latency_ms is not null and created_at > now() - interval '7 days'), 0)::numeric                        as avg_latency_ms_7d,
  now()                                                                                                            as refreshed_at;

create unique index idx_metrics_summary_singleton on metrics_summary((1));

-- ── get_cohort_retention ─────────────────────────────────────────────────────
create or replace function get_cohort_retention(
  weeks_back int default 12
)
returns table(
  cohort        date,
  cohort_size   int,
  retention_w1  numeric,
  retention_w4  numeric,
  retention_w8  numeric,
  retention_w12 numeric
) as $$
with first_uploads as (
  select
    startup_id,
    date_trunc('week', min(uploaded_at))::date as cohort_week,
    min(uploaded_at)                            as first_upload_at
  from decks
  group by startup_id
),
subsequent as (
  select
    d.startup_id,
    fu.cohort_week,
    (d.uploaded_at - fu.first_upload_at) as since_first
  from decks d
  join first_uploads fu on fu.startup_id = d.startup_id
  where d.uploaded_at > fu.first_upload_at
)
select
  fu.cohort_week                                                                                                  as cohort,
  count(distinct fu.startup_id)::int                                                                              as cohort_size,
  round(100.0 * count(distinct case when s.since_first <= interval '7 days'  then s.startup_id end)::numeric
        / nullif(count(distinct fu.startup_id), 0), 2)                                                           as retention_w1,
  round(100.0 * count(distinct case when s.since_first <= interval '28 days' then s.startup_id end)::numeric
        / nullif(count(distinct fu.startup_id), 0), 2)                                                           as retention_w4,
  round(100.0 * count(distinct case when s.since_first <= interval '56 days' then s.startup_id end)::numeric
        / nullif(count(distinct fu.startup_id), 0), 2)                                                           as retention_w8,
  round(100.0 * count(distinct case when s.since_first <= interval '84 days' then s.startup_id end)::numeric
        / nullif(count(distinct fu.startup_id), 0), 2)                                                           as retention_w12
from first_uploads fu
left join subsequent s on s.startup_id = fu.startup_id
where fu.cohort_week >= (now() - (weeks_back * interval '1 week'))::date
group by fu.cohort_week
order by fu.cohort_week desc;
$$ language sql stable;

-- ── get_division_vertical_heatmap ────────────────────────────────────────────
create or replace function get_division_vertical_heatmap()
returns table(
  division      league_division,
  vertical      startup_vertical,
  startup_count int,
  avg_score     numeric
) as $$
select
  e.assigned_division,
  e.assigned_vertical,
  count(distinct e.startup_id)::int,
  round(avg(e.score_total), 2)
from evaluations e
where e.id in (
  select distinct on (startup_id) id
  from evaluations
  order by startup_id, created_at desc
)
group by 1, 2;
$$ language sql stable;
