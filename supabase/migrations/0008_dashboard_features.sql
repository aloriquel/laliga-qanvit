-- Dashboard features: alert_type enum, new startups columns,
-- startup_ecosystem_views and startup_alerts tables, RLS, track_ecosystem_view function

-- 8.1 New enum
create type alert_type as enum (
  'moved_up_division',
  'moved_down_division',
  'new_top3_vertical',
  'new_top10_vertical',
  'new_top10_division',
  'position_milestone'
);

-- 8.2 New columns on startups
alter table startups add column show_public_timeline boolean not null default false;
alter table startups add column notification_email_enabled boolean not null default true;
alter table startups add column notification_frequency text not null default 'immediate'
  constraint startups_notification_frequency_check
    check (notification_frequency in ('immediate', 'daily', 'weekly'));

-- 8.3 startup_ecosystem_views: aggregate view tracking per org
create table startup_ecosystem_views (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references startups(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  views_count int not null default 1,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  unique(startup_id, org_id)
);

create index idx_ecosystem_views_startup on startup_ecosystem_views(startup_id);
create index idx_ecosystem_views_last on startup_ecosystem_views(last_viewed_at desc);

-- 8.4 startup_alerts
create table startup_alerts (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references startups(id) on delete cascade,
  alert_type alert_type not null,
  payload jsonb not null default '{}',
  is_read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_startup_alerts_startup on startup_alerts(startup_id, created_at desc);
create index idx_startup_alerts_unread on startup_alerts(startup_id, is_read) where is_read = false;

-- 8.5 RLS
alter table startup_ecosystem_views enable row level security;

create policy "ecosystem_views_owner_select" on startup_ecosystem_views
  for select using (
    auth.uid() = (select owner_id from startups where id = startup_id)
  );

create policy "ecosystem_views_org_select" on startup_ecosystem_views
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "ecosystem_views_admin_all" on startup_ecosystem_views
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

alter table startup_alerts enable row level security;

create policy "alerts_owner_select" on startup_alerts
  for select using (
    auth.uid() = (select owner_id from startups where id = startup_id)
  );

create policy "alerts_owner_update" on startup_alerts
  for update using (
    auth.uid() = (select owner_id from startups where id = startup_id)
  );

-- inserts via trigger with security definer only

-- 8.6 track_ecosystem_view: upsert with counter (security definer so any authenticated user can call it)
create or replace function track_ecosystem_view(p_startup_id uuid, p_org_id uuid)
returns void as $$
begin
  insert into startup_ecosystem_views (startup_id, org_id, views_count, first_viewed_at, last_viewed_at)
  values (p_startup_id, p_org_id, 1, now(), now())
  on conflict (startup_id, org_id) do update set
    views_count = startup_ecosystem_views.views_count + 1,
    last_viewed_at = now();
end;
$$ language plpgsql security definer set search_path = public;
