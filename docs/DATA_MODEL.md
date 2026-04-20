# Data Model — La Liga Qanvit

Schema Postgres (Supabase). Todas las tablas con RLS activado.

## 1. Extensiones necesarias

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_trgm";
create extension if not exists "pg_net";     -- para triggers → edge functions
```

## 2. Enums

```sql
create type user_role as enum ('startup', 'ecosystem', 'admin');

create type deck_status as enum (
  'pending',        -- subido, en cola
  'processing',     -- pipeline en curso
  'evaluated',      -- evaluación completada
  'error',          -- falló, admin debe revisar
  'archived'        -- startup subió versión nueva
);

create type league_division as enum (
  'ideation',   -- pre-producto
  'seed',       -- producto en mercado, tracción temprana
  'growth',     -- escalando comercialmente
  'elite'       -- líder de vertical
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
```

## 3. Tablas

### 3.1 `profiles`

Un registro por usuario autenticado (trigger desde `auth.users`).

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'startup',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 3.2 `startups`

Perfil canónico de cada startup en la liga.

```sql
create table startups (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,                    -- usado en URLs públicas
  name text not null,
  legal_name text,
  one_liner text,                               -- pitch de 1 línea (<140 chars)
  website text,
  logo_url text,
  location_city text,
  location_region text,                         -- p.ej. 'Andalucía'
  founded_year int,
  linkedin_url text,
  twitter_url text,
  is_public boolean not null default true,      -- si aparece en leaderboard público
  current_division league_division,             -- última asignación
  current_vertical startup_vertical,            -- última asignación
  current_score numeric(5,2),                   -- 0.00 a 100.00
  consent_public_profile boolean not null default false,
  consent_internal_use boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_startups_division on startups(current_division);
create index idx_startups_vertical on startups(current_vertical);
create index idx_startups_score_desc on startups(current_score desc) where is_public = true;
```

### 3.3 `decks`

Metadatos de cada deck subido. Un deck = un intento de evaluación.

```sql
create table decks (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  version int not null default 1,
  storage_path text not null,                   -- p.ej. "{startup_id}/{deck_id}.pdf"
  file_size_bytes int not null,
  page_count int,
  status deck_status not null default 'pending',
  raw_text text,                                -- extraído por pdf-parse
  language text,                                -- 'es' | 'en' | otro
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,

  unique(startup_id, version)
);

create index idx_decks_status on decks(status);
create index idx_decks_startup on decks(startup_id);
```

### 3.4 `deck_chunks`

Chunks vectorizados del deck para búsqueda semántica y pipeline del evaluador.

```sql
create table deck_chunks (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_count int,
  embedding vector(1536),                       -- ajustar según provider
  metadata jsonb default '{}',                  -- p.ej. page number
  created_at timestamptz not null default now(),

  unique(deck_id, chunk_index)
);

create index idx_deck_chunks_deck on deck_chunks(deck_id);
create index idx_deck_chunks_embedding on deck_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

### 3.5 `evaluations`

Una evaluación por deck. Es el registro del resultado del pipeline.

```sql
create table evaluations (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  startup_id uuid not null references startups(id) on delete cascade,

  -- Clasificación
  assigned_division league_division not null,
  assigned_vertical startup_vertical not null,
  classification_confidence numeric(3,2),       -- 0.00 a 1.00

  -- Scoring (0-100 cada dimensión)
  score_problem numeric(5,2) not null,
  score_market numeric(5,2) not null,
  score_solution numeric(5,2) not null,
  score_team numeric(5,2) not null,
  score_traction numeric(5,2) not null,
  score_business_model numeric(5,2) not null,
  score_gtm numeric(5,2) not null,
  score_total numeric(5,2) not null,            -- ponderado por fase

  -- Feedback estructurado
  feedback jsonb not null,                      -- ver schema abajo
  summary text,
  next_actions jsonb,                           -- array de strings

  -- Metadata del proceso
  prompt_version text not null,                 -- p.ej. 'v1'
  rubric_version text not null,
  classifier_model text not null,               -- p.ej. 'claude-haiku-4-5-20251001'
  evaluator_model text not null,                -- p.ej. 'claude-opus-4-7'
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
```

**Schema esperado para `feedback` jsonb:**
```json
{
  "problem": {
    "score": 78,
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "evidence_quotes": ["...", "..."]
  },
  "market": { "...": "..." },
  "solution": { "...": "..." },
  "team": { "...": "..." },
  "traction": { "...": "..." },
  "business_model": { "...": "..." },
  "gtm": { "...": "..." }
}
```

### 3.6 `league_standings` (vista materializada)

Ranking pre-computado para queries rápidas del leaderboard.

```sql
create materialized view league_standings as
select
  s.id as startup_id,
  s.slug,
  s.name,
  s.one_liner,
  s.logo_url,
  s.current_division,
  s.current_vertical,
  s.current_score,
  row_number() over (order by s.current_score desc) as rank_national,
  row_number() over (
    partition by s.current_division
    order by s.current_score desc
  ) as rank_division,
  row_number() over (
    partition by s.current_division, s.current_vertical
    order by s.current_score desc
  ) as rank_division_vertical
from startups s
where s.is_public = true
  and s.current_score is not null
  and s.consent_public_profile = true;

create unique index idx_league_standings_startup on league_standings(startup_id);
create index idx_league_standings_rank_national on league_standings(rank_national);
create index idx_league_standings_div_vert on league_standings(current_division, current_vertical);
```

Refrescar con `refresh materialized view concurrently league_standings;` tras cada evaluación completada (trigger).

### 3.7 `ecosystem_organizations`

Organizaciones del ecosistema (parques, clusters, asociaciones).

```sql
create table ecosystem_organizations (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  org_type ecosystem_org_type not null,
  website text,
  logo_url text,
  region text,
  about text,
  is_verified boolean not null default false,   -- admin aprueba manualmente
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  referral_code text not null unique,           -- para tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 3.8 `ecosystem_points_log`

Append-only log de eventos de puntos.

```sql
create table ecosystem_points_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  event_type points_event_type not null,
  points int not null,                          -- puede ser negativo (revoke)
  reference_startup_id uuid references startups(id),
  reference_evaluation_id uuid references evaluations(id),
  metadata jsonb default '{}',
  notes text,
  granted_by uuid references profiles(id),      -- null si es automático
  created_at timestamptz not null default now()
);

create index idx_points_log_org on ecosystem_points_log(org_id);
create index idx_points_log_created on ecosystem_points_log(created_at desc);
```

### 3.9 `ecosystem_totals` (vista)

Agregado en vivo de puntos totales y tier.

```sql
create view ecosystem_totals as
select
  o.id as org_id,
  o.name,
  o.org_type,
  coalesce(sum(l.points), 0) as total_points,
  case
    when coalesce(sum(l.points), 0) >= 5001 then 'elite'::ecosystem_tier
    when coalesce(sum(l.points), 0) >= 1001 then 'pro'::ecosystem_tier
    else 'rookie'::ecosystem_tier
  end as tier
from ecosystem_organizations o
left join ecosystem_points_log l on l.org_id = o.id
group by o.id, o.name, o.org_type;
```

### 3.10 `feedback_validations`

Cuando un miembro del ecosistema valida una evaluación (pulgar arriba/abajo). Da puntos y mejora el sistema.

```sql
create table feedback_validations (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  is_positive boolean not null,
  comment text,
  created_at timestamptz not null default now(),

  unique(evaluation_id, org_id)
);
```

### 3.11 `deck_access_log`

Auditoría de accesos al deck (solo admin puede ver decks, pero loguear igualmente).

```sql
create table deck_access_log (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  accessed_by uuid not null references profiles(id),
  access_type text not null,                    -- 'download', 'view', 'api'
  user_agent text,
  ip_address inet,
  accessed_at timestamptz not null default now()
);
```

### 3.12 `evaluation_appeals`

Cuando una startup impugna su clasificación.

```sql
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
```

## 4. Row Level Security (ejemplos críticos)

```sql
-- profiles: cada usuario ve y actualiza solo el suyo; admin ve todo
alter table profiles enable row level security;

create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);

create policy "profiles_admin_select" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);

-- startups: owner ve todo; admin ve todo; público ve solo is_public=true via vista
alter table startups enable row level security;

create policy "startups_owner_all" on startups
  for all using (auth.uid() = owner_id);

create policy "startups_admin_all" on startups
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- el leaderboard público usa la vista materializada sin RLS
-- o una vista específica que filtra por is_public = true

-- decks: SOLO owner y admin. NUNCA ecosystem.
alter table decks enable row level security;

create policy "decks_owner_all" on decks
  for all using (
    auth.uid() = (select owner_id from startups where id = decks.startup_id)
  );

create policy "decks_admin_all" on decks
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- deck_chunks: misma regla que decks
alter table deck_chunks enable row level security;

create policy "deck_chunks_owner" on deck_chunks
  for select using (
    auth.uid() = (
      select s.owner_id from startups s
      join decks d on d.startup_id = s.id
      where d.id = deck_chunks.deck_id
    )
  );

create policy "deck_chunks_admin" on deck_chunks
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- evaluations: owner ve todo; ecosystem ve solo los campos públicos via vista; admin ve todo
alter table evaluations enable row level security;

create policy "evaluations_owner" on evaluations
  for select using (
    auth.uid() = (select owner_id from startups where id = evaluations.startup_id)
  );

create policy "evaluations_admin" on evaluations
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- vista pública (sin RLS directo, se controla via grants)
create or replace view public_evaluations as
select
  e.id,
  e.startup_id,
  e.assigned_division,
  e.assigned_vertical,
  e.score_total,
  e.summary,
  e.created_at
from evaluations e
join startups s on s.id = e.startup_id
where s.is_public = true and s.consent_public_profile = true;

-- ecosystem_organizations: owner ve el suyo; admin ve todo
alter table ecosystem_organizations enable row level security;

create policy "ecosystem_org_owner" on ecosystem_organizations
  for all using (auth.uid() = owner_id);

create policy "ecosystem_org_admin" on ecosystem_organizations
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ecosystem_points_log: solo lectura por owner del org; admin escribe vía funciones
alter table ecosystem_points_log enable row level security;

create policy "points_log_owner_select" on ecosystem_points_log
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "points_log_admin_all" on ecosystem_points_log
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
```

## 5. Triggers

### 5.1 Crear `profile` al registrarse

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### 5.2 Actualizar `updated_at` genérico

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_startups_updated_at
  before update on startups
  for each row execute function set_updated_at();

-- repetir para profiles, ecosystem_organizations
```

### 5.3 Sincronizar `startups.current_*` tras nueva evaluación

```sql
create or replace function sync_startup_current_eval()
returns trigger as $$
begin
  update startups
  set
    current_division = new.assigned_division,
    current_vertical = new.assigned_vertical,
    current_score = new.score_total
  where id = new.startup_id;

  -- refresh materialized view
  refresh materialized view concurrently league_standings;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_sync_startup_eval
  after insert on evaluations
  for each row execute function sync_startup_current_eval();
```

### 5.4 Disparar pipeline al subir deck

```sql
-- cuando se crea un deck con status='pending', llamar edge function
create or replace function trigger_evaluator_pipeline()
returns trigger as $$
begin
  perform net.http_post(
    url := current_setting('app.settings.evaluator_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.edge_fn_secret')
    ),
    body := jsonb_build_object('deck_id', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_deck_pipeline
  after insert on decks
  for each row
  when (new.status = 'pending')
  execute function trigger_evaluator_pipeline();
```

## 6. Seed data (mínimo)

```sql
-- Super admin bootstrap (ejecutar manual una vez)
insert into profiles (id, email, role, full_name)
values ('<<auth-uid-arturo>>', 'arturo@fqsource.com', 'admin', 'Arturo López Riquelme')
on conflict (id) do update set role = 'admin';
```

(Las verticales y divisiones son enums, no necesitan seed data.)
