-- Challenges: enums, tables, RLS, vote rate-limit helper

create type challenge_status as enum (
  'draft', 'voting', 'approved', 'active', 'completed', 'cancelled'
);

create type challenge_objective_type as enum (
  'referred_in_vertical',
  'referred_in_region',
  'referred_top10',
  'validations_in_vertical'
);

-- ── challenges ─────────────────────────────────────────────────────────────
create table challenges (
  id                  uuid primary key default gen_random_uuid(),
  proposed_by_org_id  uuid not null references ecosystem_organizations(id) on delete cascade,
  title               text not null,
  description         text not null,
  objective_type      challenge_objective_type not null,
  objective_params    jsonb not null,  -- { n: 10, vertical: 'mobility' }
  duration_days       int not null,
  prize_structure     jsonb not null,  -- { "1": 500, "2": 250, "3": 100 }
  status              challenge_status not null default 'draft',
  voting_starts_at    timestamptz,
  voting_ends_at      timestamptz,
  active_starts_at    timestamptz,
  active_ends_at      timestamptz,
  admin_notes         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_challenges_status on challenges(status);

alter table challenges enable row level security;

create policy "challenges_select_ecosystem" on challenges
  for select using (is_ecosystem() or is_admin());

create policy "challenges_insert_owner" on challenges
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = proposed_by_org_id)
  );

create policy "challenges_admin_all" on challenges
  for all using (is_admin());

-- ── challenge_votes ────────────────────────────────────────────────────────
create table challenge_votes (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  org_id       uuid not null references ecosystem_organizations(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(challenge_id, org_id)
);

alter table challenge_votes enable row level security;

create policy "votes_select_own" on challenge_votes
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );
create policy "votes_insert_own" on challenge_votes
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );
create policy "votes_admin_all" on challenge_votes
  for all using (is_admin());

-- ── challenge_progress ─────────────────────────────────────────────────────
create table challenge_progress (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references challenges(id) on delete cascade,
  org_id          uuid not null references ecosystem_organizations(id) on delete cascade,
  count           int not null default 0,
  last_updated_at timestamptz not null default now(),
  unique(challenge_id, org_id)
);

alter table challenge_progress enable row level security;

create policy "progress_select_own" on challenge_progress
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );
create policy "progress_admin_all" on challenge_progress
  for all using (is_admin());

-- ── Vote rate-limit helper ─────────────────────────────────────────────────
create or replace function check_challenge_vote_rate_limit(p_org_id uuid)
returns boolean language sql stable as $$
  select count(*) < 3
  from challenge_votes
  where org_id = p_org_id
    and created_at > now() - interval '7 days';
$$;

-- ── is_ecosystem helper (mirrors is_admin pattern) ────────────────────────
-- Already defined in 0011 but recreate idempotently
create or replace function is_ecosystem()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ecosystem')
$$;

-- ── updated_at trigger for challenges ─────────────────────────────────────
create trigger set_challenges_updated_at
  before update on challenges
  for each row execute function set_updated_at();
