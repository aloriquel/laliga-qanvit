-- Migration 0026: Private settings table + accessor function
-- Replaces Vault approach (extension not available on this Supabase plan).
-- Stores edge function URLs and secrets in a schema inaccessible to
-- anon/authenticated roles; exposed only via a SECURITY DEFINER function.

-- ── Private schema (inaccessible to anon/authenticated) ──────────────────────
CREATE SCHEMA IF NOT EXISTS _private;
REVOKE ALL ON SCHEMA _private FROM anon, authenticated, public;
GRANT USAGE ON SCHEMA _private TO postgres, service_role;

-- ── Settings table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _private.settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);

REVOKE ALL ON _private.settings FROM anon, authenticated, public;
GRANT ALL ON _private.settings TO postgres, service_role;

-- ── SECURITY DEFINER accessor ─────────────────────────────────────────────────
-- Triggers and pg_cron jobs call this. They don't need direct _private access.
CREATE OR REPLACE FUNCTION public.get_setting(p_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = _private, public
AS $$
  SELECT value FROM _private.settings WHERE key = p_key LIMIT 1;
$$;

-- Only postgres and service_role; never anon/authenticated
GRANT EXECUTE ON FUNCTION public.get_setting(text) TO postgres, service_role;
REVOKE EXECUTE ON FUNCTION public.get_setting(text) FROM anon, authenticated, public;

-- ── Verify (run after applying) ───────────────────────────────────────────────
-- SELECT get_setting('evaluator_url');  -- returns NULL until you INSERT values
