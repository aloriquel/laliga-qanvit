-- ── 0030_teardown_challenges_contacts.sql ────────────────────────────────────
-- Teardown: eliminación total de challenges, challenge_votes, challenge_progress,
-- contact_requests + funciones asociadas.
--
-- consent_direct_contact column kept in DB per REFACTOR_V1_FINAL.md §2.1.
-- UI references removed in code changes.
-- ─────────────────────────────────────────────────────────────────────────────

-- Auditoría pre-teardown: loguea counts antes del DROP
DO $$
DECLARE
  v_ch int; v_cv int; v_cr int;
BEGIN
  SELECT count(*) INTO v_ch FROM challenges;
  SELECT count(*) INTO v_cv FROM challenge_votes;
  SELECT count(*) INTO v_cr FROM contact_requests;
  RAISE NOTICE 'Pre-teardown counts: challenges=%, challenge_votes=%, contact_requests=%',
    v_ch, v_cv, v_cr;
END $$;

-- ── Backup en schema archive ──────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS archive;

CREATE TABLE IF NOT EXISTS archive.challenges_20260422 AS
  SELECT * FROM challenges;

CREATE TABLE IF NOT EXISTS archive.challenge_votes_20260422 AS
  SELECT * FROM challenge_votes;

CREATE TABLE IF NOT EXISTS archive.challenge_progress_20260422 AS
  SELECT * FROM challenge_progress;

CREATE TABLE IF NOT EXISTS archive.contact_requests_20260422 AS
  SELECT * FROM contact_requests;

-- ── Drop tablas (cascade elimina policies, triggers, índices) ─────────────────
DROP TABLE IF EXISTS challenge_votes CASCADE;
DROP TABLE IF EXISTS challenge_progress CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;

-- ── Drop funciones y triggers relacionados ────────────────────────────────────
DROP FUNCTION IF EXISTS check_challenge_vote_rate_limit(uuid) CASCADE;
DROP FUNCTION IF EXISTS distribute_challenge_prizes(uuid) CASCADE;

-- ── Drop tipos (solo si no quedan referencias) ────────────────────────────────
DROP TYPE IF EXISTS challenge_status CASCADE;
DROP TYPE IF EXISTS challenge_objective_type CASCADE;

-- ── Marcar eventos de puntos huérfanos como deprecated ───────────────────────
ALTER TABLE ecosystem_points_log
  ADD COLUMN IF NOT EXISTS event_type_deprecated boolean NOT NULL DEFAULT false;

UPDATE ecosystem_points_log
  SET event_type_deprecated = true
  WHERE event_type IN (
    'challenge_vote_reward',
    'challenge_proposer_reward',
    'challenge_winner_reward',
    'challenge_winner'
  );

-- ── Admin audit log: limpiar tipos de challenge del enum si es posible ────────
-- Los valores del enum admin_action_type se conservan para no perder histórico.
-- No se hace ALTER TYPE porque podría romper rows existentes con esos valores.

-- ── Auditoría post-teardown ────────────────────────────────────────────────────
DO $$
DECLARE
  v_arch_ch int; v_arch_cv int; v_arch_cr int;
BEGIN
  SELECT count(*) INTO v_arch_ch FROM archive.challenges_20260422;
  SELECT count(*) INTO v_arch_cv FROM archive.challenge_votes_20260422;
  SELECT count(*) INTO v_arch_cr FROM archive.contact_requests_20260422;
  RAISE NOTICE 'Archive counts: challenges=%, challenge_votes=%, contact_requests=%',
    v_arch_ch, v_arch_cv, v_arch_cr;
END $$;
