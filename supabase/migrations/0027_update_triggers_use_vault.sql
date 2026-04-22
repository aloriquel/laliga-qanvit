-- Migration 0027: Rewrite trigger functions to use get_vault_setting()
-- Supersedes: 0007 (trigger_evaluator_pipeline), 0010 (notify_alert_dispatcher),
--             0016 + 0025 (notify_ecosystem_alert_dispatcher)
-- Requires:   0026 (get_vault_setting function)

-- ── 1. trigger_evaluator_pipeline ────────────────────────────────────────────
-- Fires: AFTER INSERT on decks WHERE status = 'pending'
-- Vault secrets: evaluator_url, evaluator_secret

CREATE OR REPLACE FUNCTION trigger_evaluator_pipeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url    text := get_vault_setting('evaluator_url');
  fn_secret text := get_vault_setting('evaluator_secret');
BEGIN
  IF fn_url IS NULL OR fn_url = '' OR fn_secret IS NULL OR fn_secret = '' THEN
    RAISE WARNING 'trigger_evaluator_pipeline: not configured, skipping deck %', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || fn_secret
    ),
    body              := jsonb_build_object('deck_id', NEW.id::text),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- ── 2. notify_alert_dispatcher ───────────────────────────────────────────────
-- Fires: AFTER INSERT on startup_alerts
-- Vault secrets: alert_dispatcher_url, evaluator_secret

CREATE OR REPLACE FUNCTION notify_alert_dispatcher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url    text := get_vault_setting('alert_dispatcher_url');
  fn_secret text := get_vault_setting('evaluator_secret');
BEGIN
  IF fn_url IS NULL OR fn_url = '' THEN
    RAISE WARNING 'notify_alert_dispatcher: not configured, skipping alert %', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(fn_secret, '')
    ),
    body    := jsonb_build_object('alert_id', NEW.id::text),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- ── 3. notify_ecosystem_alert_dispatcher ─────────────────────────────────────
-- Fires: AFTER INSERT on evaluations (first eval per startup only)
-- Vault secrets: ecosystem_alert_dispatcher_url, evaluator_secret
-- Replaces 0016 (hardcoded secret) and 0025 (current_setting, never applied)

CREATE OR REPLACE FUNCTION notify_ecosystem_alert_dispatcher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url    text;
  fn_secret text;
  is_first  boolean;
BEGIN
  SELECT count(*) = 1 INTO is_first
  FROM evaluations WHERE startup_id = NEW.startup_id;

  IF NOT is_first THEN RETURN NEW; END IF;

  fn_url    := get_vault_setting('ecosystem_alert_dispatcher_url');
  fn_secret := get_vault_setting('evaluator_secret');

  IF fn_url IS NULL OR fn_url = '' OR fn_secret IS NULL OR fn_secret = '' THEN
    RAISE WARNING 'notify_ecosystem_alert_dispatcher: not configured, skipping evaluation %', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || fn_secret
    ),
    body    := jsonb_build_object(
      'evaluation_id', NEW.id::text,
      'startup_id',    NEW.startup_id::text
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;
