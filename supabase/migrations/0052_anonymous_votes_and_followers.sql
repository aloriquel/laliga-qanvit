-- ────────────────────────────────────────────────────────────────────────────
-- 0052_anonymous_votes_and_followers.sql  —  PROMPT_13B
-- Public anonymous voting + opt-in email follow on /startup/[slug].
-- Intentionally separate from startup_votes (ecosystem tier-weighted).
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS citext;

-- ── Table: startup_followers ───────────────────────────────────────────────
CREATE TABLE public.startup_followers (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id               uuid        NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  email                    citext      NOT NULL,
  email_verified_at        timestamptz,
  confirmation_token       text        UNIQUE,
  confirmation_expires_at  timestamptz,
  unsubscribe_token        text        UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  unsubscribed_at          timestamptz,
  source                   text        NOT NULL CHECK (source IN ('vote_modal','follow_button','api')),
  ip_hash                  text,
  user_agent               text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (startup_id, email)
);

CREATE INDEX idx_startup_followers_startup_verified
  ON public.startup_followers (startup_id)
  WHERE email_verified_at IS NOT NULL AND unsubscribed_at IS NULL;

CREATE INDEX idx_startup_followers_confirmation_token
  ON public.startup_followers (confirmation_token)
  WHERE confirmation_token IS NOT NULL;

CREATE INDEX idx_startup_followers_unsubscribe_token
  ON public.startup_followers (unsubscribe_token);

-- ── Table: anonymous_startup_votes ─────────────────────────────────────────
CREATE TABLE public.anonymous_startup_votes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id   uuid        NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  ip_hash      text        NOT NULL,
  user_agent   text,
  follower_id  uuid                REFERENCES public.startup_followers(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Generated day (UTC) used in the UNIQUE index. `date_trunc(...)` is STABLE,
  -- so Postgres refuses it in a UNIQUE index; the ::date cast on an IMMUTABLE
  -- "AT TIME ZONE 'UTC'" expression is IMMUTABLE and works here.
  vote_day     date        GENERATED ALWAYS AS (((created_at AT TIME ZONE 'UTC')::date)) STORED
);

-- 1 vote per (ip, startup, UTC day). Prevents trivial refresh-spam.
CREATE UNIQUE INDEX uniq_anon_vote_ip_startup_day
  ON public.anonymous_startup_votes (ip_hash, startup_id, vote_day);

CREATE INDEX idx_anon_votes_startup
  ON public.anonymous_startup_votes (startup_id);

-- ── Enum + Table: follower_alerts ──────────────────────────────────────────
CREATE TYPE public.follower_alert_event AS ENUM (
  'new_deck',
  'division_up',
  'top3_vertical'
);

CREATE TABLE public.follower_alerts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id    uuid        NOT NULL REFERENCES public.startup_followers(id) ON DELETE CASCADE,
  startup_id     uuid        NOT NULL REFERENCES public.startups(id)           ON DELETE CASCADE,
  event_type     public.follower_alert_event NOT NULL,
  payload        jsonb       NOT NULL DEFAULT '{}',
  email_sent     boolean     NOT NULL DEFAULT false,
  email_sent_at  timestamptz,
  email_error    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_follower_alerts_unsent
  ON public.follower_alerts (id)
  WHERE email_sent = false;

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.startup_followers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_startup_votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follower_alerts           ENABLE ROW LEVEL SECURITY;
-- No policies => only service_role (which bypasses RLS) can read/write.
-- Public-facing counts are exposed via SECURITY DEFINER RPCs below.

-- ── RPCs for public count exposure (no email leakage) ──────────────────────
CREATE OR REPLACE FUNCTION public.get_follower_count(p_startup_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.startup_followers
  WHERE startup_id = p_startup_id
    AND email_verified_at IS NOT NULL
    AND unsubscribed_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_anon_vote_count(p_startup_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.anonymous_startup_votes
  WHERE startup_id = p_startup_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_follower_count(uuid)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_anon_vote_count(uuid) TO anon, authenticated;
