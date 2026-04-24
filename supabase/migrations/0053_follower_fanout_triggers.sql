-- ────────────────────────────────────────────────────────────────────────────
-- 0053_follower_fanout_triggers.sql  —  PROMPT_13B
-- Fan-out events into follower_alerts + dispatch trigger for edge function.
-- ────────────────────────────────────────────────────────────────────────────

-- ── Fan-out helper: one follower_alerts row per verified follower ──────────
CREATE OR REPLACE FUNCTION public.fanout_follower_alerts(
  p_startup_id uuid,
  p_event      public.follower_alert_event,
  p_payload    jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted integer;
BEGIN
  WITH ins AS (
    INSERT INTO public.follower_alerts (follower_id, startup_id, event_type, payload)
    SELECT f.id, p_startup_id, p_event, COALESCE(p_payload, '{}'::jsonb)
    FROM public.startup_followers f
    WHERE f.startup_id         = p_startup_id
      AND f.email_verified_at IS NOT NULL
      AND f.unsubscribed_at   IS NULL
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted FROM ins;
  RETURN COALESCE(inserted, 0);
END;
$$;

-- ── Trigger fn: detect events on evaluation completion ─────────────────────
-- `evaluations` has no status column; completion is signalled by
-- score_total becoming non-null. Guard against duplicate firings on updates
-- where the non-null state did not change.
CREATE OR REPLACE FUNCTION public.on_evaluation_complete_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_division   text;
  v_new_division    text;
  v_vertical        text;
  v_rank_division_vertical integer;
  v_payload         jsonb;
BEGIN
  -- Only fire when score_total transitions to non-null.
  IF NEW.score_total IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.score_total IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_new_division := NEW.assigned_division::text;
  v_vertical     := NEW.assigned_vertical::text;

  -- Previous division (from previous completed evaluation of same startup).
  SELECT e.assigned_division::text
    INTO v_prev_division
  FROM public.evaluations e
  WHERE e.startup_id  = NEW.startup_id
    AND e.id         <> NEW.id
    AND e.score_total IS NOT NULL
  ORDER BY e.created_at DESC
  LIMIT 1;

  -- Event 1: new_deck (every completed eval counts as a deck update).
  v_payload := jsonb_build_object(
    'evaluation_id', NEW.id,
    'score_total',   NEW.score_total,
    'division',      v_new_division,
    'vertical',      v_vertical
  );
  PERFORM public.fanout_follower_alerts(NEW.startup_id, 'new_deck'::public.follower_alert_event, v_payload);

  -- Event 2: division_up (only when we have a previous division and it moved up).
  IF v_prev_division IS NOT NULL AND v_prev_division <> v_new_division THEN
    IF (
         (v_prev_division = 'ideation' AND v_new_division IN ('seed','growth','elite'))
      OR (v_prev_division = 'seed'     AND v_new_division IN ('growth','elite'))
      OR (v_prev_division = 'growth'   AND v_new_division = 'elite')
    ) THEN
      PERFORM public.fanout_follower_alerts(
        NEW.startup_id,
        'division_up'::public.follower_alert_event,
        jsonb_build_object('from', v_prev_division, 'to', v_new_division)
      );
    END IF;
  END IF;

  -- Event 3: top3 in vertical+division (uses league_standings view, best-effort).
  BEGIN
    SELECT ls.rank_division_vertical
      INTO v_rank_division_vertical
    FROM public.league_standings ls
    WHERE ls.startup_id = NEW.startup_id
    LIMIT 1;

    IF v_rank_division_vertical IS NOT NULL AND v_rank_division_vertical <= 3 THEN
      PERFORM public.fanout_follower_alerts(
        NEW.startup_id,
        'top3_vertical'::public.follower_alert_event,
        jsonb_build_object(
          'division', v_new_division,
          'vertical', v_vertical,
          'rank',     v_rank_division_vertical
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Swallow standings errors; follower fan-out must not break the main insert path.
    NULL;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_follower_fanout_on_evaluation
  AFTER INSERT OR UPDATE OF score_total ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_evaluation_complete_followers();

-- ── Dispatch trigger: call follower-notifier edge function ─────────────────
CREATE OR REPLACE FUNCTION public.notify_follower_notifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url    text := current_setting('app.settings.follower_notifier_url', true);
  fn_secret text := current_setting('app.settings.follower_notifier_secret', true);
BEGIN
  -- Skip silently if the setting is not configured (local/preview).
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

CREATE TRIGGER trg_follower_notifier_dispatch
  AFTER INSERT ON public.follower_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_follower_notifier();

COMMENT ON TRIGGER trg_follower_notifier_dispatch ON public.follower_alerts IS
  'Calls follower-notifier edge function. Requires one-time DB setting:
   alter database postgres set app.settings.follower_notifier_url = ''https://<project>.functions.supabase.co/follower-notifier'';
   alter database postgres set app.settings.follower_notifier_secret = ''<FOLLOWER_NOTIFIER_FN_SECRET>'';';
