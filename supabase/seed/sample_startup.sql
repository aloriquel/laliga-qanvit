-- Optional seed: creates a demo startup for pipeline testing without a real account.
-- Run manually: psql $DATABASE_URL -f supabase/seed/sample_startup.sql
-- IMPORTANT: requires a valid profile (auth user) with id = :owner_uuid.
-- Replace <<auth-uid-arturo>> with the actual auth.users.id from Supabase Dashboard.

do $$
declare
  owner_uuid uuid := '<<auth-uid-arturo>>'::uuid;
begin
  insert into startups (
    id,
    owner_id,
    slug,
    name,
    one_liner,
    website,
    location_city,
    location_region,
    is_public,
    consent_public_profile,
    consent_internal_use
  ) values (
    '00000000-0000-0000-0000-000000000001',
    owner_uuid,
    'demo-robotics-co',
    'Demo Robotics Co',
    'Automatizamos la inspección industrial con robótica autónoma y visión por computador.',
    'https://demo.laliga.qanvit.com',
    'Bilbao',
    'País Vasco',
    true,
    true,
    true
  )
  on conflict (slug) do nothing;
end;
$$;
