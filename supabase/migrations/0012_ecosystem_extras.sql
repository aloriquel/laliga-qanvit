-- Ecosystem extras: consent_direct_contact, referred_by_org_id,
-- csv_exports, alerts_config, new_startup_alerts, contact_requests

-- ── New columns on startups ────────────────────────────────────────────────
alter table startups
  add column if not exists consent_direct_contact boolean not null default false,
  add column if not exists referred_by_org_id uuid references ecosystem_organizations(id);

create index if not exists idx_startups_referred_by on startups(referred_by_org_id);

-- ── ecosystem_csv_exports ──────────────────────────────────────────────────
create table ecosystem_csv_exports (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ecosystem_organizations(id) on delete cascade,
  rows_count  int not null,
  tier_at_export ecosystem_tier not null,
  filters_json   jsonb,
  created_at  timestamptz not null default now()
);
create index idx_csv_exports_org_month on ecosystem_csv_exports(org_id, created_at);

alter table ecosystem_csv_exports enable row level security;

create policy "csv_exports_owner_select" on ecosystem_csv_exports
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );
create policy "csv_exports_admin_all" on ecosystem_csv_exports
  for all using (is_admin());

-- ── ecosystem_alerts_config ────────────────────────────────────────────────
create table ecosystem_alerts_config (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references ecosystem_organizations(id) on delete cascade,
  verticals    startup_vertical[] not null default '{}',
  regions      text[]             not null default '{}',
  frequency    text               not null default 'daily',  -- immediate | daily | weekly
  email_enabled boolean           not null default true,
  updated_at   timestamptz        not null default now(),
  unique(org_id)
);

alter table ecosystem_alerts_config enable row level security;

create policy "alerts_config_owner_all" on ecosystem_alerts_config
  for all using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );
create policy "alerts_config_admin_all" on ecosystem_alerts_config
  for all using (is_admin());

-- ── ecosystem_new_startup_alerts ───────────────────────────────────────────
create table ecosystem_new_startup_alerts (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references ecosystem_organizations(id) on delete cascade,
  startup_id     uuid not null references startups(id) on delete cascade,
  matched_reason text not null,  -- 'vertical:robotics_automation' | 'region:andalucia'
  email_sent     boolean not null default false,
  created_at     timestamptz not null default now(),
  unique(org_id, startup_id)
);

create index idx_new_startup_alerts_org on ecosystem_new_startup_alerts(org_id, created_at desc);

alter table ecosystem_new_startup_alerts enable row level security;

create policy "new_startup_alerts_owner" on ecosystem_new_startup_alerts
  for all using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );
create policy "new_startup_alerts_admin" on ecosystem_new_startup_alerts
  for all using (is_admin());

-- ── contact_requests ──────────────────────────────────────────────────────
create table contact_requests (
  id            uuid primary key default gen_random_uuid(),
  from_org_id   uuid not null references ecosystem_organizations(id) on delete cascade,
  to_startup_id uuid not null references startups(id) on delete cascade,
  message       text not null,
  status        text not null default 'pending',  -- pending | accepted | declined | expired
  respond_token text,  -- HMAC token for email respond links
  created_at    timestamptz not null default now(),
  responded_at  timestamptz
);

create index idx_contact_req_org     on contact_requests(from_org_id, created_at desc);
create index idx_contact_req_startup on contact_requests(to_startup_id, created_at desc);

alter table contact_requests enable row level security;

create policy "contact_req_org_select" on contact_requests
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = from_org_id)
  );
create policy "contact_req_org_insert" on contact_requests
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = from_org_id)
  );
create policy "contact_req_startup_all" on contact_requests
  for all using (
    auth.uid() = (select owner_id from startups where id = to_startup_id)
  );
create policy "contact_req_admin_all" on contact_requests
  for all using (is_admin());
