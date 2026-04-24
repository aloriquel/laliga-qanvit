# Ecosistema — Dashboard, puntos, votos y alertas

> Complementa `GAMIFICATION.md` (que define la mecánica de puntos y tiers) con la implementación concreta del dashboard, el export CSV, las alertas de verticales y el módulo de votos de startups.

## Relación con Qanvit

**Qanvit (`qanvit.com` / `app.qanvit.com`)** es el producto principal: plataforma de corporate venture con IA, BBDD propietaria de más de 16.000 startups y 4 agentes (Structuring, Discovering, Coordinating, Evaluating).

**La Liga Qanvit** es el escaparate público y lead-magnet. Las orgs del ecosystem observan startups, votan y escalan de tier. Cada tier se traduce en un **descuento comunicativo en Qanvit** (10 / 20 / 30%, aplica vía `hola@qanvit.com`). Nunca posicionamos La Liga como producto autosuficiente en comunicación externa: Qanvit primero, Liga como funnel.

## 1. Principios del dashboard ecosistema

1. **Privado pero social**. Cada org ve su posición vs media del ecosistema (percentil, tier, ranking anónimo). Nunca ve nombres de otras orgs competidoras. Evita dinámicas tóxicas entre parques/clusters mientras mantiene el pulso competitivo.
2. **Tiers generosos para empujar activación**. El CSV se desbloquea pronto para que las orgs encuentren valor desde el día 1. La escalera hacia Elite recompensa consistencia, no solo volumen.
3. **Observar, no gestionar**. La Liga Qanvit es el telescopio del ecosistema: observar startups, votar las que van a subir, recibir alertas de nuevas entradas. Para lanzar retos de innovación abierta o contactar startups, el canal es app.qanvit.com.
4. **No PII sin propósito**. Nunca se exponen nombres de personas físicas (ni del lado startup ni del lado org). Las organizaciones son entidades jurídicas y sus miembros no se identifican.

## 2. Rutas

```
/ecosistema/aplicar             ← form de aplicación
/ecosistema/dashboard           ← home con puntos y tier
/ecosistema/dashboard/startups  ← buscador con filtros avanzados
/ecosistema/dashboard/votos     ← historial de votos + Scouting Eye
/ecosistema/dashboard/puntos    ← log de puntos + posición vs media
/ecosistema/dashboard/alertas   ← alertas configuradas (verticales seguidas)
/ecosistema/dashboard/referral  ← código de referral + link + instrucciones
/ecosistema/dashboard/configuracion  ← perfil org, notifs, datos
```

## 3. Dashboard home (`/ecosistema/dashboard`)

Layout: sidebar + content. Paleta "business-analytics".

Tiles (orden):
1. **Hero puntos**: total grande + tier badge + barra de progreso al siguiente tier.
2. **Mi posición vs el ecosistema**: percentil ("top 20% de orgs") sin nombres. Bar chart anónimo con la barra propia destacada en salmon.
3. **Scouting Eye**: tasa de acierto del votante (`hits / total_up_votes`). Link a `/votos`.
4. **Novedades en tus verticales**: últimas 5 startups nuevas en las verticales seguidas.
5. **Tu enlace de referral**: código + link.
6. **CTA app.qanvit.com** (col-span-2): bloque salmon — "Lanza retos reales con startups del ecosistema".

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
| Timeline compacto | ❌ | ✅ | ✅ |
| Botón votar (up/down) | ✅ | ✅ | ✅ |
| Momentum badge | ✅ | ✅ | ✅ |

### Export CSV (ver §6)
Botón arriba derecha, disponible para los 3 tiers con límites.

## 5. Puntos y tier (`/ecosistema/dashboard/puntos`)

### Secciones

1. **Total y tier**: puntos totales grandes + tier + barra al siguiente.
2. **Posición vs media**:
   - Computed: `your_points / avg(all_orgs_points_same_type)`.
   - Muestra: percentil + mensaje ("Estás en el top 15% de parques científicos"). Sin nombres.
   - Bar chart con 20 barras anónimas (quantil 5% del conjunto), la tuya coloreada.
3. **Log de eventos**: tabla paginada con los últimos eventos (`ecosystem_points_log`):
   - Fecha, tipo (human readable), delta puntos, referencia (startup asociada si aplica).
4. **Desglose por tipo** (donut chart recharts):
   - % de puntos que vienen de referrals, validations, etc.
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
- Columnas: `startup_name, slug, division, vertical, score_total, rank_div_vert, region, one_liner, referred_by_my_org, first_evaluated_at, last_evaluated_at, summary`.
- Para Rookie, columnas "summary" y "last_evaluated_at" quedan vacías ("N/A Pro tier").

### Endpoint
`GET /api/ecosystem/export?filters=...` → devuelve `text/csv`.
- Valida tier.
- Verifica contador mensual para Rookie (fail 403 si excede).
- Inserta fila en `ecosystem_csv_exports`.

## 7. Alertas de ecosistema (`/ecosistema/dashboard/alertas`)

Config por org:
- Seguir verticales (multi-select): reciben email cuando nueva startup en esa vertical termina evaluación.
- Seguir regiones (multi-select).
- Frecuencia: inmediata / diaria / semanal (default diaria).

Rookie: 1 vertical. Pro: 3. Elite: 10 (consistente con `GAMIFICATION.md`).

## 8. Export CSV

Ver §6.

## 9. Referral tracking real

### Flujo

1. Org obtiene su `referral_code` al ser verificada.
2. Comparte link `laliga.qanvit.com/play?ref=APTE-2026-MDR` en sus canales.
3. Startup llega a `/play` con `?ref=APTE-2026-MDR` → se guarda en cookie `qvt_ref` (180 días).
4. Al completar onboarding (crear startup), POST `/api/decks/upload` lee la cookie y:
   - Busca la org por referral_code.
   - Si existe y no está ya registrada para esta startup: `startups.referred_by_org_id = org.id`.
5. Cuando el deck se evalúa: trigger inserta en `ecosystem_points_log`:
   - `event_type='startup_referred_signup'`, `points=100`, `reference_startup_id=startup.id`.
6. Si esa startup entra top 10: inserta `startup_referred_top10`, `points=500`.
7. Si sube de División: inserta `startup_referred_phase_up`, `points=250`.

### Anti-fraude
- No puedes referirte a ti mismo (owner de la org ≠ owner de la startup — check SQL).
- Una startup solo puede tener 1 referred_by (no duplicable).
- Si detectamos 3+ referrals desde la misma IP en 24h: admin review.

## 10. Leaderboard anónimo de orgs

Vista materializada `ecosystem_anonymous_standings`:

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

Cada org ve su fila (`org_id` = su org) pero las demás filas solo exponen `org_type, decile, percentile`. Refrescar diariamente via cron.

## 11. Voto de startups

El módulo central de engagement: las orgs votan startups up/down para señalar cuáles creen que van a subir. Los votos son **append-only** (no se pueden cambiar), pesan según tier, y alimentan el `Scouting Eye`.

### Reglas
- **1 voto por startup por org cada 90 días** (up o down).
- **Límite semanal**: 5 votos up distintos por org por semana (anti-spam).
- **No puedes votar tu propia referida** si tu org la refirió directamente.
- **Razón obligatoria** en votos down para Pro y Elite (mínimo 30 caracteres).

### Peso por tier
| Tier | Peso del voto |
|---|:-:|
| Rookie | ×1 |
| Pro | ×2 |
| Elite | ×3 |

### Scouting Eye
Métrica de acierto del votante, calculada en rolling 90 días:
- `hits`: startups votadas up que han subido ≥20 puntos de score desde el voto.
- `accuracy_rate = hits / total_up_votes * 100`.
- Visible en el dashboard home (tile #3) y en detalle en `/votos`.

### Tabla `startup_votes`

```sql
create table startup_votes (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references startups(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  vote_type text not null check (vote_type in ('up', 'down')),
  weight smallint not null check (weight between 1 and 3),
  tier_at_vote ecosystem_tier not null,
  reason text,
  created_at timestamptz not null default now()
);
```

### Vista materializada `startup_momentum`

Resumen rolling 90 días por startup:
- `up_weighted`, `down_weighted`, `momentum_score` (up - down ponderado)
- `up_count`, `down_count`, `distinct_voters`, `last_vote_at`

Refrescada cada 30 minutos via pg_cron.

### Función de elegibilidad
`check_startup_vote_eligibility(p_org_id uuid, p_startup_id uuid) RETURNS jsonb`

Devuelve `{ eligible: true }` o `{ eligible: false, reason: "..." }` según reglas de negocio.

## 12. Data model (tablas activas)

### 12.1 Existentes: `ecosystem_organizations`, `ecosystem_points_log`, `ecosystem_totals`, `feedback_validations`, `ecosystem_csv_exports`, `ecosystem_alerts_config`, `ecosystem_new_startup_alerts`

### 12.2 `startup_votes` (Prompt #6, migración 0031)

Ver §11 para esquema completo.

### 12.3 `startup_momentum` (materialized view, migración 0031)

```sql
create materialized view startup_momentum as
select
  startup_id,
  sum(case when vote_type = 'up' then weight else 0 end)  as up_weighted,
  sum(case when vote_type = 'down' then weight else 0 end) as down_weighted,
  sum(case when vote_type = 'up' then weight else -weight end) as momentum_score,
  count(*) filter (where vote_type = 'up')  as up_count,
  count(*) filter (where vote_type = 'down') as down_count,
  count(distinct org_id) as distinct_voters,
  max(created_at) as last_vote_at
from startup_votes
where created_at >= now() - interval '90 days'
group by startup_id;
```

## 13. RLS de las tablas del ecosistema

```sql
-- startup_votes: org crea los suyos; lee los suyos; admin lee todo
create policy "startup_votes_insert" on startup_votes
  for insert with check (
    org_id = (select id from ecosystem_organizations where owner_id = auth.uid())
  );

create policy "startup_votes_select" on startup_votes
  for select using (
    org_id = (select id from ecosystem_organizations where owner_id = auth.uid())
  );
-- No UPDATE/DELETE policies → votos append-only para usuarios regulares
-- Admins usan service role para invalidar
```

## 14. Copies y tono

Dashboard ecosistema mantiene el tono "business-deportivo":
- "Has escalado al 22% superior de parques científicos" (no "Enhorabuena").
- "Te faltan 660 puntos para Pro" (no "Sigue así").
- "3 startups nuevas en Mobility esta semana" (no "Descubre nuevas oportunidades").
- "Para lanzar retos reales con estas startups, entra en app.qanvit.com."

Sin emojis corazón. Sí ok: 🥉🥈🥇 para tiers, 🎯 para Scouting Eye, 📊 para análisis.

## 15. Métricas de éxito del ecosistema

- **% de orgs en tier Pro+** sobre total: objetivo >30% en 6 meses.
- **Ratio startups referidas / total**: objetivo >40%.
- **Activación mensual**: org que gana ≥1 punto en últimos 30 días. Objetivo >60%.
- **Votos emitidos por semana**: indicador de engagement del módulo de scouting.
- **Scouting Eye promedio**: accuracy_rate media de todas las orgs que han votado >5 startups.
