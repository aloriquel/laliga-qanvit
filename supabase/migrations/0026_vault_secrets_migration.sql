-- Migration 0026: Vault helper function for DB triggers and pg_cron jobs
-- Supabase Cloud blocks ALTER DATABASE SET app.settings.* (permission denied).
-- This migration creates a SECURITY DEFINER helper that reads from Vault instead.
--
-- PREREQUISITES (do these BEFORE applying this migration):
--   1. Supabase Vault is enabled by default on Supabase Cloud — no action needed.
--   2. Insert the 7 secrets via Dashboard → Project Settings → Vault (see docs).
--      SQL alternative: SELECT vault.create_secret('<value>', '<name>', '<description>');
--
-- The migration itself only creates infrastructure. It does NOT insert secret values.

-- ── Vault extension (already enabled on Supabase Cloud — idempotent) ─────────
create extension if not exists "vault" with schema vault;

-- ── Helper function: reads a named secret from vault.decrypted_secrets ────────
-- SECURITY DEFINER runs as the owner (postgres), which has SELECT on vault.decrypted_secrets.
-- Triggers and pg_cron jobs call this function; they don't need direct vault access.
create or replace function public.get_vault_setting(p_name text)
returns text
language plpgsql
security definer
stable                  -- secret values don't change mid-transaction
set search_path = public, vault
as $$
declare
  v_value text;
begin
  select decrypted_secret into v_value
  from vault.decrypted_secrets
  where name = p_name
  limit 1;
  return v_value;   -- returns NULL if name not found (triggers handle this gracefully)
end;
$$;

-- Only postgres and service_role need this — never expose to authenticated/anon
grant execute on function public.get_vault_setting(text) to postgres, service_role;

-- ── Verify (run after applying to confirm vault access works) ─────────────────
-- SELECT get_vault_setting('evaluator_url');    -- should return NULL until you add secrets
-- SELECT get_vault_setting('evaluator_secret'); -- same
