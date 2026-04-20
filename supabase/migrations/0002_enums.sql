-- Enums for La Liga Qanvit

create type user_role as enum ('startup', 'ecosystem', 'admin');

create type deck_status as enum (
  'pending',        -- uploaded, queued
  'processing',     -- pipeline running
  'evaluated',      -- evaluation complete
  'error',          -- failed, admin must review
  'archived'        -- startup uploaded a newer version
);

create type league_division as enum (
  'ideation',   -- pre-product
  'seed',       -- product in market, early traction
  'growth',     -- scaling commercially
  'elite'       -- vertical leader
);

create type startup_vertical as enum (
  'deeptech_ai',
  'robotics_automation',
  'mobility',
  'energy_cleantech',
  'agrifood',
  'healthtech_medtech',
  'industrial_manufacturing',
  'space_aerospace',
  'materials_chemistry',
  'cybersecurity'
);

create type ecosystem_org_type as enum (
  'science_park',
  'cluster',
  'innovation_association',
  'other'
);

create type ecosystem_tier as enum ('rookie', 'pro', 'elite');

create type points_event_type as enum (
  'startup_referred_signup',
  'startup_referred_top10',
  'feedback_validated',
  'vertical_proposed_accepted',
  'admin_grant',
  'admin_revoke'
);
