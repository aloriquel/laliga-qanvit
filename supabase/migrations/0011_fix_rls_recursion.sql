-- Fix infinite recursion in profiles RLS policies.
-- profiles_admin_select queried profiles inside a profiles policy → recursion.
-- Solution: SECURITY DEFINER function that bypasses RLS when checking admin role.

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- Drop the recursive policy and replace it
drop policy if exists "profiles_admin_select" on profiles;
create policy "profiles_admin_select" on profiles
  for select using (is_admin());

-- Replace all other admin policies to use is_admin() for consistency
drop policy if exists "startups_admin_all" on startups;
create policy "startups_admin_all" on startups
  for all using (is_admin());

drop policy if exists "decks_admin_all" on decks;
create policy "decks_admin_all" on decks
  for all using (is_admin());

drop policy if exists "deck_chunks_admin" on deck_chunks;
create policy "deck_chunks_admin" on deck_chunks
  for all using (is_admin());

drop policy if exists "evaluations_admin" on evaluations;
create policy "evaluations_admin" on evaluations
  for all using (is_admin());

drop policy if exists "ecosystem_org_admin" on ecosystem_organizations;
create policy "ecosystem_org_admin" on ecosystem_organizations
  for all using (is_admin());

drop policy if exists "points_log_admin_all" on ecosystem_points_log;
create policy "points_log_admin_all" on ecosystem_points_log
  for all using (is_admin());

drop policy if exists "feedback_validations_admin" on feedback_validations;
create policy "feedback_validations_admin" on feedback_validations
  for all using (is_admin());

drop policy if exists "deck_access_log_admin" on deck_access_log;
create policy "deck_access_log_admin" on deck_access_log
  for all using (is_admin());

drop policy if exists "appeals_admin" on evaluation_appeals;
create policy "appeals_admin" on evaluation_appeals
  for all using (is_admin());

-- Also fix feedback_validations_ecosystem_insert which had inline profiles subquery
drop policy if exists "feedback_validations_ecosystem_insert" on feedback_validations;

create or replace function is_ecosystem()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ecosystem')
$$;

create policy "feedback_validations_ecosystem_insert" on feedback_validations
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
    and is_ecosystem()
  );
