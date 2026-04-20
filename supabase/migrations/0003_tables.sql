-- Core tables for La Liga Qanvit

-- 3.1 profiles: one record per authenticated user (trigger from auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'startup',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 startups: canonical profile for each startup in the league
create table startups (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  legal_name text,
  one_liner text,                               -- pitch < 140 chars
  website text,
  logo_url text,
  location_city text,
  location_region text,
  founded_year int,
  linkedin_url text,
  twitter_url text,
  is_public boolean not null default true,
  current_division league_division,
  current_vertical startup_vertical,
  current_score numeric(5,2),
  consent_public_profile boolean not null default false,
  consent_internal_use boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_startups_division on startups(current_division);
create index idx_startups_vertical on startups(current_vertical);
create index idx_startups_score_desc on startups(current_score desc) where is_public = true;

-- 3.3 decks: metadata for each uploaded deck
create table decks (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  version int not null default 1,
  storage_path text not null,                   -- "{startup_id}/{deck_id}.pdf"
  file_size_bytes int not null,
  page_count int,
  status deck_status not null default 'pending',
  raw_text text,                                -- extracted by pdf-parse
  language text,                                -- 'es' | 'en' | other
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,

  unique(startup_id, version)
);

create index idx_decks_status on decks(status);
create index idx_decks_startup on decks(startup_id);

-- 3.4 deck_chunks: vectorized chunks for semantic search and evaluator pipeline
create table deck_chunks (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_count int,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),

  unique(deck_id, chunk_index)
);

create index idx_deck_chunks_deck on deck_chunks(deck_id);
create index idx_deck_chunks_embedding on deck_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 3.5 evaluations: one evaluation per deck (result of the pipeline)
create table evaluations (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  startup_id uuid not null references startups(id) on delete cascade,

  -- Classification
  assigned_division league_division not null,
  assigned_vertical startup_vertical not null,
  classification_confidence numeric(3,2),

  -- Scores (0-100 each dimension)
  score_problem numeric(5,2) not null,
  score_market numeric(5,2) not null,
  score_solution numeric(5,2) not null,
  score_team numeric(5,2) not null,
  score_traction numeric(5,2) not null,
  score_business_model numeric(5,2) not null,
  score_gtm numeric(5,2) not null,
  score_total numeric(5,2) not null,

  -- Structured feedback
  feedback jsonb not null,
  summary text,
  next_actions jsonb,

  -- Pipeline metadata
  prompt_version text not null,
  rubric_version text not null,
  classifier_model text not null,
  evaluator_model text not null,
  tokens_input int,
  tokens_output int,
  cost_estimate_usd numeric(8,4),
  latency_ms int,

  created_at timestamptz not null default now(),

  unique(deck_id, prompt_version, rubric_version)
);

create index idx_evaluations_startup on evaluations(startup_id);
create index idx_evaluations_division on evaluations(assigned_division);
create index idx_evaluations_vertical on evaluations(assigned_vertical);
create index idx_evaluations_score on evaluations(score_total desc);

-- 3.7 ecosystem_organizations: parks, clusters, associations
create table ecosystem_organizations (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  org_type ecosystem_org_type not null,
  website text,
  logo_url text,
  region text,
  about text,
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  referral_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.8 ecosystem_points_log: append-only points events
create table ecosystem_points_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  event_type points_event_type not null,
  points int not null,
  reference_startup_id uuid references startups(id),
  reference_evaluation_id uuid references evaluations(id),
  metadata jsonb default '{}',
  notes text,
  granted_by uuid references profiles(id),      -- null if automatic
  created_at timestamptz not null default now()
);

create index idx_points_log_org on ecosystem_points_log(org_id);
create index idx_points_log_created on ecosystem_points_log(created_at desc);

-- 3.10 feedback_validations: ecosystem thumbs up/down on evaluations
create table feedback_validations (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  is_positive boolean not null,
  comment text,
  created_at timestamptz not null default now(),

  unique(evaluation_id, org_id)
);

-- 3.11 deck_access_log: audit trail for deck access
create table deck_access_log (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  accessed_by uuid not null references profiles(id),
  access_type text not null,                    -- 'download' | 'view' | 'api'
  user_agent text,
  ip_address inet,
  accessed_at timestamptz not null default now()
);

-- 3.12 evaluation_appeals: startup impugna su clasificación
create table evaluation_appeals (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  startup_id uuid not null references startups(id) on delete cascade,
  reason text not null,
  requested_division league_division,
  requested_vertical startup_vertical,
  status text not null default 'pending',       -- 'pending' | 'accepted' | 'rejected'
  resolved_by uuid references profiles(id),
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
