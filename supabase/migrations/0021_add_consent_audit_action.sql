-- Migration 0021: admin consent audit action + league standings refresh RPC

alter type admin_action_type add value if not exists 'startup_consent_forced';

-- RPC callable from server-side API routes to refresh the materialized view
-- after an admin forces consent_public_profile = true.
create or replace function admin_refresh_league_standings()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently league_standings;
end;
$$;
