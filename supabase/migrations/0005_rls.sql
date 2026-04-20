-- Row Level Security policies for La Liga Qanvit
-- All tables have RLS enabled. Deck content is NEVER exposed to ecosystem role.

-- profiles: each user sees and updates only their own; admin sees all
alter table profiles enable row level security;

create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);

create policy "profiles_admin_select" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);

-- startups: owner sees/edits all; admin sees/edits all; public sees only via league_standings view
alter table startups enable row level security;

create policy "startups_owner_all" on startups
  for all using (auth.uid() = owner_id);

create policy "startups_admin_all" on startups
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- decks: ONLY owner and admin. NEVER ecosystem.
alter table decks enable row level security;

create policy "decks_owner_all" on decks
  for all using (
    auth.uid() = (select owner_id from startups where id = decks.startup_id)
  );

create policy "decks_admin_all" on decks
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- deck_chunks: same rule as decks
alter table deck_chunks enable row level security;

create policy "deck_chunks_owner" on deck_chunks
  for select using (
    auth.uid() = (
      select s.owner_id from startups s
      join decks d on d.startup_id = s.id
      where d.id = deck_chunks.deck_id
    )
  );

create policy "deck_chunks_admin" on deck_chunks
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- evaluations: owner sees all; ecosystem sees only public fields via public_evaluations view; admin sees all
alter table evaluations enable row level security;

create policy "evaluations_owner" on evaluations
  for select using (
    auth.uid() = (select owner_id from startups where id = evaluations.startup_id)
  );

create policy "evaluations_admin" on evaluations
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ecosystem_organizations: owner sees/edits their own; admin sees all
alter table ecosystem_organizations enable row level security;

create policy "ecosystem_org_owner" on ecosystem_organizations
  for all using (auth.uid() = owner_id);

create policy "ecosystem_org_admin" on ecosystem_organizations
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ecosystem_points_log: owner of org can read; admin writes via functions
alter table ecosystem_points_log enable row level security;

create policy "points_log_owner_select" on ecosystem_points_log
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "points_log_admin_all" on ecosystem_points_log
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- feedback_validations
alter table feedback_validations enable row level security;

create policy "feedback_validations_ecosystem_insert" on feedback_validations
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'ecosystem')
  );

create policy "feedback_validations_admin" on feedback_validations
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- deck_access_log: only admin can read/insert
alter table deck_access_log enable row level security;

create policy "deck_access_log_admin" on deck_access_log
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- evaluation_appeals: startup owner inserts/reads; admin manages
alter table evaluation_appeals enable row level security;

create policy "appeals_owner" on evaluation_appeals
  for all using (
    auth.uid() = (select owner_id from startups where id = evaluation_appeals.startup_id)
  );

create policy "appeals_admin" on evaluation_appeals
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
