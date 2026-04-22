-- Migration 0026: Helper function to read secrets from Supabase Vault.
-- Vault extension (supabase_vault) is already installed in the project — do NOT create it.
-- The 7 secrets must be inserted into vault.secrets before triggers/cron jobs fire.

CREATE OR REPLACE FUNCTION public.get_vault_setting(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
STABLE
AS $$
DECLARE
  v_value text;
BEGIN
  SELECT decrypted_secret INTO v_value
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
  RETURN v_value;
END;
$$;

REVOKE ALL ON FUNCTION public.get_vault_setting(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_vault_setting(text) TO postgres, service_role;

COMMENT ON FUNCTION public.get_vault_setting(text) IS
  'Returns decrypted secret from Supabase Vault by name. Used by trigger
   functions and pg_cron jobs to read edge function URLs and shared secrets.';
