# Ecosistema — Dashboard, puntos, retos, contacto

> Complementa `GAMIFICATION.md` (que define la mecánica de puntos y tiers) con la implementación concreta del dashboard, los retos comunitarios, el export CSV y el canal de contacto con las startups.

## 1. Principios del dashboard ecosistema

1. **Privado pero social**. Cada org ve su posición vs media del ecosistema (percentil, tier, ranking anónimo). Nunca ve nombres de otras orgs competidoras. Evita dinámicas tóxicas entre parques/clusters mientras mantiene el pulso competitivo.
2. **Tiers generosos para empujar activación**. El CSV se desbloquea pronto (50 rows en Rookie) para que las orgs encuentren valor desde el día 1. La escalera hacia Elite recompensa consistencia, no solo volumen.
3. **Retos comunitarios**. La lista de retos del mes la propone el ecosistema mismo: las orgs envían ideas, la comunidad vota, admin aprueba, premio compartido entre los top contribuidores.
4. **Contacto a través del canal correcto**. Pro y Rookie ven metadatos; solo Elite ve el email del founder — **y solo si la startup ha dado consent explícito**. Si no, se ofrece el canal de referral (Qanvit introduce).
5. **No PII sin propósito**. Nunca se exponen nombres de personas físicas (ni del lado startup ni del lado org). Las organizaciones son entidades jurídicas y sus miembros no se identifican.

## 2. Rutas

```
/ecosistema/aplicar             ← ya existe desde Prompt #1; form de aplicación
/ecosistema/dashboard           ← home con puntos y tier
/ecosistema/dashboard/startups  ← buscador con filtros avanzados
/ecosistema/dashboard/puntos    ← log de puntos + posición vs media
/ecosistema/dashboard/retos     ← retos activos, propuestos, mis propuestas
/ecosistema/dashboard/alertas   ← alertas configuradas (verticales seguidas)
/ecosistema/dashboard/referral  ← código de referral + link + instrucciones
/ecosistema/dashboard/configuracion  ← perfil org, notifs, datos
```

## 3. Dashboard home (`/ecosistema/dashboard`)

Layout similar al de la startup (sidebar + content), pero con paleta más "business-analytics":
- **Hero**: puntos totales grandes + tier badge + barra de progreso al siguiente tier.
- **Tile "Mi posición vs el ecosistema"**: percentil (ej. "Estás en el top 20% de orgs") sin nombres. Un indicador textual más un pequeño bar chart anónimo (cada barra es una org genérica, la tuya destacada en salmon).
- **Tile "Retos activos"**: 3 retos en curso con progreso.
- **Tile "Novedades"**: nuevas startups en tus verticales seguidas, las últimas 5.
- **Tile "Mi referral"**: código + link + botón "copiar".

## 4. Buscador de startups (`/ecosistema/dashboard/startups`)

### Filtros (todos los tiers)
- División (multi-select)
- Vertical (multi-select)
- Región (multi-select, según `startups.location_region`)
- Score mínimo / máximo (slider 0-100)
- Referred by my org (toggle)

### Filtros avanzados (Pro y Elite)
- Fecha de entrada (rango)
- Fecha última evaluación (rango)
- Ha subido de División recientemente (últimos 30 días)
- Ha bajado de División recientemente

### Columnas visibles por tier

| Columna | Rookie | Pro | Elite |
|---|:-:|:-:|:-:|
| Logo + nombre | ✅ | ✅ | ✅ |
| División + Vertical (pill) | ✅ | ✅ | ✅ |
| Score total | ✅ | ✅ | ✅ |
| Ranking División×Vertical | ✅ | ✅ | ✅ |
| Región | ✅ | ✅ | ✅ |
| One-liner | ✅ | ✅ | ✅ |
| Referred by my org (badge) | ✅ | ✅ | ✅ |
| Fecha última evaluación | ❌ | ✅ | ✅ |
| Summary LLM | ❌ | ✅ | ✅ |
| Next actions (3-5 puntos) | ❌ | ✅ | ✅ |
| Timeline compacto (si startup tiene `show_public_timeline`) | ❌ | ✅ | ✅ |
| **Email del founder** | ❌ | ❌ | ✅ con consent |
| **Alternativa sin consent**: "Contactar vía Qanvit (gratis)" | ❌ | ❌ | ✅ |

### Export CSV (ver §6)
Botón arriba derecha, disponible para los 3 tiers con límites.

### Feedback validation
Para cada startup abierta en detalle: botones "thumb up/down" con comentario opcional → gana 25 puntos (1 por evaluación por org, ver `GAMIFICATION.md`).

## 5. Puntos y tier (`/ecosistema/dashboard/puntos`)

### Secciones

1. **Total y tier**: puntos totales grandes + tier + barra al siguiente.
2. **Posición vs media**:
   - Computed: `your_points / avg(all_orgs_points_same_type)`.
   - Muestra: percentil + mensaje ("Estás en el top 15% de parques científicos"). Sin nombres.
   - Bar chart con 20 barras anónimas (ej. quantil 5% del conjunto), la tuya coloreada.
3. **Log de eventos**: tabla paginada con los últimos eventos (`ecosystem_points_log`):
   - Fecha, tipo (human readable), delta puntos, referencia (startup asociada si aplica).
4. **Desglose por tipo** (donut chart recharts):
   - % de puntos que vienen de referrals, de validations, de challenges, etc.
5. **Ideas para ganar más**: lista de formas de ganar puntos, contextualizada ("Te faltan X pts para Pro, que desbloquea Y").

## 6. Export CSV

### Reglas
- Rookie: 50 rows por mes (rolling 30 días). Contador en DB.
- Pro: ilimitado.
- Elite: ilimitado.
- Columnas siempre según tier (no se puede saltar gating via export).
- Cada export queda logueado en `ecosystem_csv_exports` (auditoría).

### Formato
- CSV UTF-8 con header.
- Columnas: `startup_name, slug, division, vertical, score_total, rank_div_vert, region, one_liner, referred_by_my_org, first_evaluated_at, last_evaluated_at, summary, founder_email_or_canal`.
- Para Rookie, columnas "summary" y "last_evaluated_at" quedan vacías (sigues viéndolo en el CSV para consistencia, pero con celda "N/A Pro tier").

### Endpoint
`GET /api/ecosystem/export?filters=...` → devuelve `text/csv`.
- Valida tier.
- Verifica contador mensual para Rookie (fail 403 con mensaje si excede).
- Inserta fila en `ecosystem_csv_exports`.

## 7. Retos del mes comunitarios

### Ciclo de vida de un reto

```
draft (proponente) → voting (comunidad vota 5 días) → approved (admin confirma) 
→ active (reto corriendo) → completed (tras plazo) | cancelled
```

### Ruta `/ecosistema/dashboard/retos`

Tabs:
1. **Activos**: retos corriendo ahora + mi progreso si participo.
2. **En votación**: retos propuestos, puedo votar (like/dislike, hasta 3 votos positivos/semana).
3. **Mis propuestas**: retos que he propuesto, con su estado.
4. **Archivo**: retos pasados con ganadores.

### Proponer un reto

Form:
- Título (max 80 chars)
- Descripción (max 500 chars)
- Objetivo cuantificable: elige de un enum:
  - `N startups referidas en vertical X`
  - `N startups referidas en región Y`
  - `N startups referidas entran top 10 de su div×vert`
  - `N validations en vertical X`
- Parámetros del objetivo (N, X, Y).
- Duración: 15 / 30 / 60 días.
- Premio propuesto: puntos extra a distribuir entre top contribuidores (ej. "500 pts al ganador, 250 al 2º, 100 al 3º").

Al submit: status='draft' → admin revisa (previene spam o retos absurdos) → admin aprueba → pasa a 'voting'.

### Votación

- Durante 5 días, todas las orgs del ecosistema pueden votar like (no dislike en V1, para evitar dinámicas tóxicas).
- Necesita ≥ N_MIN_VOTES = 5 likes para activarse (configurable por admin).
- Admin recibe notificación cuando un reto supera el umbral: puede aprobar inmediatamente o esperar fin de plazo.

### Ejecución

- Cuando status pasa a 'active': el reto entra en `/ecosistema/dashboard/retos#activos`.
- Tracking automático: job diario cuenta referrals/validations de cada org que participa.
- Al finalizar (`status='completed'`): admin puede ejecutar acción "distribuir premios" que inserta filas en `ecosystem_points_log` para los ganadores.

## 8. Alertas de ecosistema (`/ecosistema/dashboard/alertas`)

Config por org:
- Seguir verticales (multi-select): reciben email cuando nueva startup en esa vertical termina evaluación.
- Seguir regiones (multi-select).
- Frecuencia: inmediata / diaria / semanal (default diaria).

Rookie: 1 vertical. Pro: 3. Elite: 10 (consistente con `GAMIFICATION.md`).

## 9. Contacto Elite con la startup

### Consent explícito de la startup

Nuevo campo: `startups.consent_direct_contact boolean default false`.

En `/dashboard/configuracion` (dashboard de la startup) añadir:
- Toggle "Permitir contacto directo del ecosistema Elite".
- Texto explicativo: "Orgs en tier Elite podrán ver el email del founder. Sin este consent, solo podrán contactarte vía Qanvit (gratis, anónimo hasta que respondas)."

### Qué ve el Elite

- Si `consent_direct_contact = true`: email del owner (de `profiles.email`) + botón "Enviar email (mailto:)".
- Si `consent_direct_contact = false`: botón "Contactar vía Qanvit" → `/api/ecosystem/contact-request` crea `contact_requests` row → email automático a la startup con mensaje de la org + opción de aceptar/declinar.

### Tabla `contact_requests`

```sql
create table contact_requests (
  id uuid primary key default uuid_generate_v4(),
  from_org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  to_startup_id uuid not null references startups(id) on delete cascade,
  message text not null,
  status text not null default 'pending',  -- pending | accepted | declined | expired
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
```

Si la startup acepta, se envía email al org con el email del founder. Si declina o expira (14 días), el org ve "no disponible".

## 10. Data model (nuevo o extendido en este prompt)

### 10.1 Ya existe (Prompt #1): `ecosystem_organizations`, `ecosystem_points_log`, `ecosystem_totals` (vista), `feedback_validations`

### 10.2 Nuevo: `ecosystem_csv_exports`

```sql
create table ecosystem_csv_exports (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  rows_count int not null,
  tier_at_export ecosystem_tier not null,
  filters_json jsonb,
  created_at timestamptz not null default now()
);

create index idx_csv_exports_org_month on ecosystem_csv_exports(org_id, created_at);
```

### 10.3 Nuevo: `ecosystem_alerts_config`

```sql
create table ecosystem_alerts_config (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  verticals startup_vertical[] not null default '{}',
  regions text[] not null default '{}',
  frequency text not null default 'daily',  -- immediate | daily | weekly
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(org_id)
);
```

### 10.4 Nuevo: `ecosystem_new_startup_alerts`

Log de alertas enviadas (anti-duplicados + para digest diario/semanal).

```sql
create table ecosystem_new_startup_alerts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  startup_id uuid not null references startups(id) on delete cascade,
  matched_reason text not null,  -- 'vertical:robotics_automation' | 'region:andalucia'
  email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique(org_id, startup_id)
);
```

### 10.5 Nuevo: `challenges`

```sql
create type challenge_status as enum ('draft', 'voting', 'approved', 'active', 'completed', 'cancelled');

create type challenge_objective_type as enum (
  'referred_in_vertical',
  'referred_in_region',
  'referred_top10',
  'validations_in_vertical'
);

create table challenges (
  id uuid primary key default uuid_generate_v4(),
  proposed_by_org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  title text not null,
  description text not null,
  objective_type challenge_objective_type not null,
  objective_params jsonb not null,  -- { n: 10, vertical: 'mobility', region: 'andalucia' }
  duration_days int not null,
  prize_structure jsonb not null,  -- { "1": 500, "2": 250, "3": 100 }
  status challenge_status not null default 'draft',
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  active_starts_at timestamptz,
  active_ends_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 10.6 Nuevo: `challenge_votes`

```sql
create table challenge_votes (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(challenge_id, org_id)
);

-- Rate limit aplicación: máximo 3 votos por org por semana, validado en API.
```

### 10.7 Nuevo: `challenge_progress`

Tracking del progreso de cada org en cada reto activo.

```sql
create table challenge_progress (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  count int not null default 0,
  last_updated_at timestamptz not null default now(),
  unique(challenge_id, org_id)
);
```

Se actualiza via job diario que cuenta según `objective_type`.

### 10.8 Nuevo: `contact_requests` (ver §9)

### 10.9 Nuevo: `startups.consent_direct_contact`

```sql
alter table startups add column consent_direct_contact boolean not null default false;
```

## 11. RLS de las nuevas tablas

```sql
-- ecosystem_csv_exports: owner lee los suyos; admin ve todo
create policy "csv_exports_owner_select" on ecosystem_csv_exports
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "csv_exports_admin_all" on ecosystem_csv_exports
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ecosystem_alerts_config: owner edita el suyo
create policy "alerts_config_owner_all" on ecosystem_alerts_config
  for all using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

-- challenges: SELECT público para todos los roles ecosystem+admin; INSERT owner crea propias; UPDATE solo admin
create policy "challenges_select_all_ecosystem" on challenges
  for select using (
    exists (
      select 1 from profiles p 
      where p.id = auth.uid() and p.role in ('ecosystem', 'admin')
    )
  );

create policy "challenges_insert_owner" on challenges
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = proposed_by_org_id)
  );

create policy "challenges_admin_all" on challenges
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- challenge_votes: org crea propio voto; admin lee todo
create policy "votes_insert_own_org" on challenge_votes
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "votes_select_own" on challenge_votes
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "votes_admin_all" on challenge_votes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- contact_requests: org lee/escribe las que ha creado; startup lee las que le vienen
create policy "contact_req_org_select" on contact_requests
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = from_org_id)
  );

create policy "contact_req_org_insert" on contact_requests
  for insert with check (
    auth.uid() = (select owner_id from ecosystem_organizations where id = from_org_id)
  );

create policy "contact_req_startup_all" on contact_requests
  for all using (
    auth.uid() = (select owner_id from startups where id = to_startup_id)
  );

create policy "contact_req_admin_all" on contact_requests
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

## 12. Referral tracking real

### Flujo

1. Org obtiene su `referral_code` al ser verificada (Prompt #1 ya lo genera).
2. Comparte link `laliga.qanvit.com/play?ref=APTE-2026-MDR` en sus canales.
3. Startup llega a `/play` con `?ref=APTE-2026-MDR` → se guarda en cookie `qvt_ref` (180 días).
4. Al completar onboarding (crear startup), POST `/api/decks/upload` lee la cookie y:
   - Busca la org por referral_code.
   - Si existe y no está ya registrada para esta startup: `startups.referred_by_org_id = org.id`.
5. Cuando el deck se evalúa (pipeline termina): trigger inserta en `ecosystem_points_log`:
   - `event_type='startup_referred_signup'`, `points=100`, `reference_startup_id=startup.id`.
6. Si luego esa startup entra top 10 (trigger de alerts existente): inserta `startup_referred_top10`, `points=500`.
7. Si sube de División: inserta `startup_referred_phase_up`, `points=250`.

### Anti-fraude
- No puedes referirte a ti mismo (owner de la org ≠ owner de la startup — check SQL).
- Una startup solo puede tener 1 referred_by (no duplicable).
- Si detectamos 3+ referrals desde la misma IP en 24h: admin review.

## 13. Leaderboard anónimo de orgs

Vista materializada que devuelve percentiles sin nombres:

```sql
create materialized view ecosystem_anonymous_standings as
select 
  o.id as org_id,
  o.org_type,
  coalesce(sum(l.points), 0) as total_points,
  ntile(10) over (partition by o.org_type order by coalesce(sum(l.points), 0) desc) as decile,
  percent_rank() over (partition by o.org_type order by coalesce(sum(l.points), 0)) as percentile
from ecosystem_organizations o
left join ecosystem_points_log l on l.org_id = o.id
where o.is_verified = true
group by o.id, o.org_type;
```

Cada org ve su fila (`org_id = auth.uid's org`) pero las demás filas solo exponen `org_type, decile, percentile` (anonimizado). Se usa una función/view con security barrier o se filtra en API layer.

Refrescar diariamente via cron (pg_cron) — no necesita tiempo real.

## 14. Copies y tono

Dashboard ecosistema mantiene el tono "business-deportivo":
- "Has escalado al 22% superior de parques científicos" (no "Enhorabuena, estás progresando").
- "Te faltan 660 puntos para Pro" (no "Sigue así").
- "3 startups nuevas en Mobility esta semana" (no "Descubre nuevas oportunidades").

Sin emojis corazón. Sí ok: 🥉🥈🥇 para tiers, 🎯 para challenges, 📊 para análisis.

## 15. Métricas de éxito del ecosistema

- **% de orgs en tier Pro+** sobre total: objetivo >30% en 6 meses.
- **Ratio startups referidas / total**: objetivo >40%.
- **Activación mensual**: org que gana ≥1 punto en últimos 30 días. Objetivo >60%.
- **Challenges activos**: al menos 2 retos/mes activos en cualquier momento.
- **Conversiones contact_request → email exchange**: >50% de requests aceptadas.
