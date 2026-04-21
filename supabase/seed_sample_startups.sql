-- Sample / test startups seed
-- Run this AFTER the main migrations when resetting the DB in dev/staging.
-- All test startups are created with full consents so they appear in the
-- leaderboard and OG images from the start.
--
-- These are NOT real user startups — they are created by the Qanvit team
-- to validate the evaluation pipeline. Consent is pre-granted by the team.

-- Activate consents for all already-evaluated startups that are missing them.
-- Safe to run repeatedly (idempotent).
update startups
set
  consent_public_profile = true,
  consent_internal_use   = true,
  is_public              = true
where
  current_score is not null
  and current_division is not null
  and (
    consent_public_profile = false
    or is_public = false
  );

-- Refresh the materialized view so changes appear in the leaderboard.
refresh materialized view concurrently league_standings;
