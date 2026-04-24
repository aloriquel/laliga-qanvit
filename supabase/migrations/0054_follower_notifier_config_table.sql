-- ────────────────────────────────────────────────────────────────────────────
-- 0054_follower_notifier_config_table.sql  —  PROMPT_13B addendum
--
-- Background: 0053 used `current_setting('app.settings.follower_notifier_*')`
-- to read the edge-function URL and bearer secret. That requires
-- `ALTER DATABASE postgres SET app.settings.* = '...'`, which is
-- superuser-only and not available through the Supabase SQL API / MCP.
--
-- Workaround: store the URL + secret in a private config table with RLS
-- enabled and no public policies; the trigger fn is SECURITY DEFINER so it
-- bypasses RLS. Values are inserted at deploy time (NOT committed to git).
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public._internal_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public._internal_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._internal_config FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_follower_notifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url    text;
  fn_secret text;
BEGIN
  SELECT value INTO fn_url    FROM public._internal_config WHERE key = 'follower_notifier_url';
  SELECT value INTO fn_secret FROM public._internal_config WHERE key = 'follower_notifier_secret';

  IF fn_url IS NULL OR fn_url = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(fn_secret, '')
    ),
    body    := jsonb_build_object('follower_alert_id', NEW.id::text),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$$;

COMMENT ON TABLE public._internal_config IS
  'Private configuration (URLs, tokens) read by SECURITY DEFINER triggers. Populate after migration:
   INSERT INTO public._internal_config (key, value) VALUES
     (''follower_notifier_url'',    ''https://<project-ref>.functions.supabase.co/follower-notifier''),
     (''follower_notifier_secret'', ''<FOLLOWER_NOTIFIER_FN_SECRET>'')
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;';
