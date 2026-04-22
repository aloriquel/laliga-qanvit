-- ── 0031_startup_votes.sql ───────────────────────────────────────────────────
-- Voto up/down del ecosistema sobre startups (mecanismo V1 de observación activa).
-- Sin puntos directos — el incentivo es la métrica "scouting eye".
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tabla startup_votes ───────────────────────────────────────────────────────
CREATE TABLE startup_votes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id    uuid        NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  org_id        uuid        NOT NULL REFERENCES ecosystem_organizations(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  vote_type     text        NOT NULL CHECK (vote_type IN ('up', 'down')),
  weight        integer     NOT NULL CHECK (weight BETWEEN 1 AND 3),
  tier_at_vote  text        NOT NULL CHECK (tier_at_vote IN ('rookie', 'pro', 'elite')),
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON startup_votes(startup_id, created_at DESC);
CREATE INDEX ON startup_votes(org_id, created_at DESC);
CREATE INDEX ON startup_votes(org_id, startup_id, created_at DESC);

-- ── Función eligibilidad ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_startup_vote_eligibility(
  p_org_id    uuid,
  p_startup_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_weekly_count  int;
  v_recent_vote   record;
  v_startup_public boolean;
  v_referred_by   uuid;
BEGIN
  SELECT
    is_public AND consent_public_profile,
    referred_by_org_id
  INTO v_startup_public, v_referred_by
  FROM startups WHERE id = p_startup_id;

  IF NOT FOUND OR NOT v_startup_public THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'startup_not_votable');
  END IF;

  IF v_referred_by = p_org_id THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'cannot_vote_own_referral');
  END IF;

  SELECT count(*) INTO v_weekly_count
  FROM startup_votes
  WHERE org_id = p_org_id AND created_at > now() - interval '7 days';

  IF v_weekly_count >= 5 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'weekly_limit_reached');
  END IF;

  SELECT * INTO v_recent_vote
  FROM startup_votes
  WHERE org_id = p_org_id AND startup_id = p_startup_id
    AND created_at > now() - interval '90 days'
  ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'eligible',          false,
      'reason',            'already_voted_90d',
      'previous_vote',     v_recent_vote.vote_type,
      'next_eligible_at',  v_recent_vote.created_at + interval '90 days'
    );
  END IF;

  RETURN jsonb_build_object('eligible', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Función peso del tier ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_vote_weight_for_tier(p_tier text) RETURNS integer AS $$
BEGIN
  RETURN CASE p_tier
    WHEN 'elite'  THEN 3
    WHEN 'pro'    THEN 2
    ELSE               1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Trigger: calcula weight server-side antes de INSERT ───────────────────────
CREATE OR REPLACE FUNCTION trg_set_vote_weight() RETURNS trigger AS $$
BEGIN
  NEW.weight := get_vote_weight_for_tier(NEW.tier_at_vote);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vote_weight
  BEFORE INSERT ON startup_votes
  FOR EACH ROW EXECUTE FUNCTION trg_set_vote_weight();

-- ── Trigger: valida reason obligatoria para down+pro/elite ───────────────────
CREATE OR REPLACE FUNCTION trg_validate_vote_reason() RETURNS trigger AS $$
BEGIN
  IF NEW.vote_type = 'down'
     AND NEW.tier_at_vote IN ('pro', 'elite')
     AND (NEW.reason IS NULL OR trim(NEW.reason) = '') THEN
    RAISE EXCEPTION 'reason_required_for_down_vote_pro_elite';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_vote_reason
  BEFORE INSERT ON startup_votes
  FOR EACH ROW EXECUTE FUNCTION trg_validate_vote_reason();

-- ── Trigger: valida eligibilidad antes de INSERT ──────────────────────────────
CREATE OR REPLACE FUNCTION trg_check_vote_eligibility() RETURNS trigger AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := check_startup_vote_eligibility(NEW.org_id, NEW.startup_id);
  IF NOT (v_result->>'eligible')::boolean THEN
    RAISE EXCEPTION 'vote_not_eligible: %', v_result->>'reason'
      USING DETAIL = v_result::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_vote_eligibility
  BEFORE INSERT ON startup_votes
  FOR EACH ROW EXECUTE FUNCTION trg_check_vote_eligibility();

-- ── Materialized view startup_momentum ───────────────────────────────────────
CREATE MATERIALIZED VIEW startup_momentum AS
SELECT
  startup_id,
  sum(weight) FILTER (WHERE vote_type = 'up')                         AS up_weighted,
  sum(weight) FILTER (WHERE vote_type = 'down')                       AS down_weighted,
  sum(CASE WHEN vote_type = 'up' THEN weight ELSE -weight END)        AS momentum_score,
  count(*) FILTER (WHERE vote_type = 'up')                            AS up_count,
  count(*) FILTER (WHERE vote_type = 'down')                          AS down_count,
  count(DISTINCT org_id)                                              AS distinct_voters,
  max(created_at)                                                     AS last_vote_at
FROM startup_votes
WHERE created_at > now() - interval '90 days'
GROUP BY startup_id;

CREATE UNIQUE INDEX ON startup_momentum(startup_id);

-- ── Vista pública startup_momentum ───────────────────────────────────────────
CREATE VIEW public_startup_momentum AS
SELECT sm.*
FROM startup_momentum sm
JOIN startups s ON s.id = sm.startup_id
WHERE s.is_public = true AND s.consent_public_profile = true;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE startup_votes ENABLE ROW LEVEL SECURITY;

-- La org ve sus propios votos; admin ve todos
CREATE POLICY "org_sees_own_votes" ON startup_votes
  FOR SELECT USING (
    org_id IN (
      SELECT id FROM ecosystem_organizations WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Owner de la org puede insertar votos
CREATE POLICY "org_members_vote" ON startup_votes
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT id FROM ecosystem_organizations WHERE owner_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- UPDATE / DELETE: prohibido (append-only, sin policies → bloqueado por RLS)

-- ── pg_cron: refresh startup_momentum cada 30 minutos ────────────────────────
SELECT cron.schedule(
  'refresh-startup-momentum',
  '*/30 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY startup_momentum$$
);

-- ── Índice para scouting eye query ───────────────────────────────────────────
CREATE INDEX ON startup_votes(org_id, vote_type, created_at DESC);
