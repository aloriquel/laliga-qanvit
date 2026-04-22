# docs/REFACTOR_V1_FINAL.md

> Source of truth del refactor estratégico pre-soft-launch de La Liga Qanvit.
> Este documento describe el **estado final V1 correcto**. Sustituye secciones
> obsoletas de `ECOSYSTEM.md` y `GAMIFICATION.md` (que se actualizarán en el Prompt #6).

---

## 1. Contexto y decisión estratégica

La Liga Qanvit se reformula antes del soft launch por una razón estratégica:

**El módulo de "retos comunitarios" canibalizaba app.qanvit.com**, el producto de pago. Las orgs (parques, clusters, consultoras, corporates) no deben gestionar retos en La Liga — deben **observar** startups. La gestión real de retos de innovación abierta vive **exclusivamente** en app.qanvit.com.

### Principios del modelo V1 final

1. **La Liga = juego de recolección de decks (para startups) + ventana de observación activa (para orgs).**
2. **Gestionar retos = solo app.qanvit.com.** Nunca en La Liga.
3. **Rol de la org en La Liga:** *observadora activa*. Mira, vota, consulta, refiere.
4. **Nunca emular gestión en La Liga.** Cuando una org quiera hacer algo accionable (lanzar reto, contactar en serio, montar piloto), el CTA es hacia app.qanvit.com.
5. **Funnel unidireccional:** La Liga (free, top-of-funnel) → app.qanvit.com (paid, conversión).

### Modelo mental comparativo

| Dimensión | La Liga Qanvit | app.qanvit.com |
|---|---|---|
| Para qué sirve | Recolectar decks + observar mercado | Gestionar retos reales |
| Usuario primario | Startups | Orgs (parques, clusters, corporates, consultoras) |
| Usuario secundario | Orgs (observan, votan, refieren) | Startups (reciben RFX, responden) |
| Verbo principal | *Observar* | *Gestionar* |
| Precio | Free | €6-12k/año o €3-8k/programa |
| Rol en el funnel | Top-of-funnel, captación | Conversión, producto de pago |

---

## 2. Cambios — visión general

### 2.1 Eliminaciones (destrucción total)

Se eliminan **código + DB + rutas + copy**:

| Asset | Tipo | Acción |
|---|---|---|
| `challenges` | Tabla DB | DROP TABLE CASCADE |
| `challenge_votes` | Tabla DB | DROP TABLE CASCADE |
| `contact_requests` | Tabla DB | DROP TABLE CASCADE |
| `/ecosistema/dashboard/retos` y subrutas | Ruta frontend | Eliminar |
| `/admin/challenges` y subrutas | Ruta frontend | Eliminar |
| `/api/ecosystem/challenges/**` | API route | Eliminar |
| `/api/contact-request/**` | API route | Eliminar |
| Edge function `contact-request-dispatcher` | Supabase function | Eliminar (si existe) |
| Tab "Retos" en sidebar ecosystem | UI | Eliminar |
| Capability Elite "contactar founder directamente" | Lógica | Eliminar (redefinir tier) |
| Campo `consent_direct_contact` en `startups.configuracion` | Config startup | Conservar en DB (por si futuro), pero fuera de UI |
| Copy: "retos comunitarios", "proponer reto", "votar reto", "contactar founder" | Texto | Reemplazar (ver §6) |

### 2.2 Adiciones (nuevo módulo)

- Tabla `startup_votes` — voto up/down del ecosistema sobre startups.
- Materialized view `startup_momentum` — agregados 90d por startup.
- Función SQL `check_startup_vote_eligibility(org_id, startup_id)` — gate de rate limits y 90d uniqueness.
- Componente UI **`StartupVoteControl`** — botones up/down en perfil de startup desde dashboard ecosystem.
- Componente UI **`EcosystemMomentumBadge`** — visible en dashboard startup ("+14 momentum") y en perfil público.
- Nueva ruta `/ecosistema/dashboard/votos` — historial + métrica "scouting eye".
- Nuevo tile "Scouting eye" en home ecosystem.

### 2.3 Redefiniciones

- **Tier Elite**: ya no desbloquea "contactar founder". Ahora desbloquea: voto ×3, early access startups nuevas, badge "Elite scouter", dataset export.
- **Dashboard ecosystem home**: sin referencias a retos. Reorientado a observación y voto.
- **Sidebar ecosystem**: sin tab "Retos". Nuevo tab "Votos".

### 2.4 CTA a app.qanvit.com

Componente persistente `CTAToAppQanvit` visible en momentos estratégicos:

| Ubicación | Copy | Cuándo aparece |
|---|---|---|
| Header del dashboard ecosystem | "¿Gestionas retos de innovación? → app.qanvit.com" | Siempre |
| Perfil público de startup (vista org) | "¿Quieres lanzar un reto con esta startup? → Gestiónalo en app.qanvit.com" | Al clickar sobre una startup |
| Home dashboard ecosystem | Tile "Lanza retos reales" con enlace | Siempre |
| Footer del dashboard ecosystem | Link "Gestionar retos en app.qanvit.com" | Siempre |

---

## 3. Schema del voto startup

### 3.1 Tabla `startup_votes`

```sql
CREATE TABLE startup_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES ecosystem_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,  -- source user, auditoría
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  weight integer NOT NULL CHECK (weight BETWEEN 1 AND 3),
  tier_at_vote text NOT NULL CHECK (tier_at_vote IN ('rookie', 'pro', 'elite')),
  reason text,  -- obligatorio si vote_type='down' AND tier_at_vote IN ('pro','elite')
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON startup_votes(startup_id, created_at DESC);
CREATE INDEX ON startup_votes(org_id, created_at DESC);
```

**Reglas de validación:**

- `weight` = 1 si `tier_at_vote='rookie'`, 2 si Pro, 3 si Elite. Se calcula server-side al insertar, no se acepta del client.
- `reason` es obligatorio cuando `vote_type='down'` AND `tier_at_vote IN ('pro','elite')`. Validar en API route.
- Max 5 votos por org en últimos 7 días (rolling window).
- Max 1 voto por (org, startup) en últimos 90 días (rolling window).
- Una org solo puede votar a una startup si `startups.is_public=true AND startups.consent_public_profile=true`.
- Una org no puede votar startups referidas por ella misma (anti-pump).

### 3.2 Función `check_startup_vote_eligibility`

```sql
CREATE OR REPLACE FUNCTION check_startup_vote_eligibility(
  p_org_id uuid, 
  p_startup_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_weekly_count int;
  v_recent_vote record;
  v_startup_public boolean;
  v_referred_by uuid;
BEGIN
  -- Check startup is publicly votable
  SELECT is_public AND consent_public_profile, referred_by_org_id
  INTO v_startup_public, v_referred_by
  FROM startups WHERE id = p_startup_id;
  
  IF NOT FOUND OR NOT v_startup_public THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'startup_not_votable');
  END IF;
  
  IF v_referred_by = p_org_id THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'cannot_vote_own_referral');
  END IF;
  
  -- Weekly rate limit
  SELECT count(*) INTO v_weekly_count
  FROM startup_votes
  WHERE org_id = p_org_id AND created_at > now() - interval '7 days';
  
  IF v_weekly_count >= 5 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'weekly_limit_reached');
  END IF;
  
  -- 90d uniqueness
  SELECT * INTO v_recent_vote 
  FROM startup_votes
  WHERE org_id = p_org_id AND startup_id = p_startup_id
    AND created_at > now() - interval '90 days'
  ORDER BY created_at DESC LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'already_voted_90d',
      'previous_vote', v_recent_vote.vote_type,
      'next_eligible_at', v_recent_vote.created_at + interval '90 days'
    );
  END IF;
  
  RETURN jsonb_build_object('eligible', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 Materialized view `startup_momentum`

```sql
CREATE MATERIALIZED VIEW startup_momentum AS
SELECT 
  startup_id,
  sum(weight) FILTER (WHERE vote_type='up') AS up_weighted,
  sum(weight) FILTER (WHERE vote_type='down') AS down_weighted,
  sum(CASE WHEN vote_type='up' THEN weight ELSE -weight END) AS momentum_score,
  count(*) FILTER (WHERE vote_type='up') AS up_count,
  count(*) FILTER (WHERE vote_type='down') AS down_count,
  count(DISTINCT org_id) AS distinct_voters,
  max(created_at) AS last_vote_at
FROM startup_votes
WHERE created_at > now() - interval '90 days'
GROUP BY startup_id;

CREATE UNIQUE INDEX ON startup_momentum(startup_id);
```

Refresh vía pg_cron cada 30 min:
```sql
SELECT cron.schedule(
  'refresh-startup-momentum',
  '*/30 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY startup_momentum$$
);
```

### 3.4 Vista pública `public_startup_momentum`

Para lectura desde frontend (RLS-safe):

```sql
CREATE VIEW public_startup_momentum AS
SELECT sm.*
FROM startup_momentum sm
JOIN startups s ON s.id = sm.startup_id
WHERE s.is_public = true AND s.consent_public_profile = true;
```

### 3.5 RLS `startup_votes`

```sql
ALTER TABLE startup_votes ENABLE ROW LEVEL SECURITY;

-- SELECT: la org ve sus propios votos, admin ve todos
CREATE POLICY "org_sees_own_votes" ON startup_votes
FOR SELECT USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  OR is_admin(auth.uid())
);

-- INSERT: org members pueden votar
CREATE POLICY "org_members_vote" ON startup_votes
FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  AND user_id = auth.uid()
);

-- UPDATE / DELETE: prohibido (append-only)
-- (no se crean policies, RLS bloquea por defecto)
```

### 3.6 Puntos por votar

**Decisión: votar NO da puntos directos.**

El incentivo para la org es mejorar su métrica "scouting eye" — startups que votó up que han subido ≥20 puntos en 90d. Esa métrica se muestra públicamente en su perfil (si la org da consent) y se convierte en una señal reputacional.

Los puntos se siguen ganando solo por:
- Referrals (startup referida completa evaluación).
- Validar feedback de startup referida (primera vez).
- Aplicación aprobada (onboarding bonus).
- Milestones comunitarios (futuro).

---

## 4. Rol de la org en La Liga V1 — capabilities por tier

### 4.1 Tier Rookie (0-99 pts)

- Ver leaderboard anónimo.
- Consultar perfil público de startups (datos reducidos: nombre, vertical, score, división).
- Votar startups con peso **×1**.
- Max 5 votos/semana.
- Seguir hasta 3 verticales.
- Alertas por email modo "weekly".
- Export CSV 50 rows/mes (por org, no por user).

### 4.2 Tier Pro (100-499 pts)

- Todo lo de Rookie.
- Columnas avanzadas en buscador (tracción declarada, rondas, empleados estimados).
- Filtros avanzados (TRL, país, año fundación).
- Votar startups con peso **×2**.
- Razón obligatoria al votar down.
- Seguir hasta 10 verticales.
- Alertas modo "daily".
- Export CSV ilimitado (columnas Pro).

### 4.3 Tier Elite (500+ pts)

- Todo lo de Pro.
- Votar startups con peso **×3**.
- Early access a startups recién evaluadas (2 días antes que Pro).
- Badge visible "Elite scouter" en leaderboard de orgs.
- Dataset export completo (embeddings + deep analysis) — limitado a 1/mes.
- Columnas export premium (fuentes raw, chunks, evidence quotes).
- CTA exclusivo: "Agendar sesión de scouting con Qanvit" (mailto a ventas, humano).

**Lo que YA NO desbloquea Elite:**
- ❌ Contactar founder directamente (esto iba a canibalizar app.qanvit.com).
- ❌ Proponer retos comunitarios (eliminado del producto).
- ❌ Votar en retos (eliminado).

---

## 5. Dashboard ecosystem — estructura V1 final

### 5.1 Sidebar

```
ORGANIZACIÓN
  Home
  Startups (buscador)
  Votos  ← NUEVO (sustituye "Retos")
  Referrals
  Puntos
  Alertas
GENERAL
  Configuración
  [CTA] Gestionar retos en app.qanvit.com  ← link externo marcado
```

### 5.2 Home (`/ecosistema/dashboard`)

Tiles ordenados por relevancia:

1. **Hero**: puntos + tier + barra progreso al siguiente tier.
2. **Tile "Mi posición vs ecosistema"**: percentil anónimo con bar chart de deciles.
3. **Tile "Scouting eye"** (NUEVO): "Has votado up a 8 startups. 5 han subido ≥20 puntos (tasa acierto 62%)."
4. **Tile "Novedades en tus verticales"**: 3-5 startups nuevas en verticales seguidos.
5. **Tile "Mi referral"**: código + link + botón copiar.
6. **Tile "Lanza retos reales"** (CTA app.qanvit.com): permanente, con copy comercial suave.

**Ya NO hay:**
- Tile "Retos activos".
- Tile "Mis propuestas de reto".
- Cualquier mención a challenges comunitarios.

### 5.3 Startups (`/ecosistema/dashboard/startups`)

Buscador. Cada fila de startup muestra:

- Nombre, logo, vertical, país, TRL.
- Score técnico (global, técnico, equipo — gated por tier).
- **Momentum del ecosistema** (NUEVO): `+14 📈` o `-3 📉`, tooltip con desglose.
- **Controles de voto** (NUEVO): botones 👍 / 👎 con feedback inmediato (disabled si ya votó en 90d, tooltip explicativo).
- Botón "Ver perfil" → modal con detalles + CTA "Lanza reto con esta startup en app.qanvit.com →".

### 5.4 Votos (`/ecosistema/dashboard/votos`)

Nueva ruta. 3 secciones:

1. **Mi scouting eye** (hero): tasa acierto + total votos + ranking vs otras orgs (percentil).
2. **Historial de votos**: tabla con startup, voto (up/down), fecha, razón (si down), delta score de la startup desde el voto.
3. **Startups que voté up que han subido**: lista con delta de score — el "portafolio ganador".

### 5.5 Configuración

Igual que antes, pero **eliminar** cualquier toggle relacionado con retos o contact_requests.

Nuevo toggle: **"Publicar mi scouting eye"** (default OFF).
- Si ON: mi métrica de scouting aparece en el leaderboard público de orgs.
- Si OFF: solo yo la veo.

---

## 6. Copy audit — cambios globales

### 6.1 Términos prohibidos en La Liga

Buscar y eliminar/reemplazar en toda la base de código y en copy UI:

| Prohibido | Reemplazar por |
|---|---|
| "gestiona tus retos" | "descubre startups" |
| "gestionar retos" | "observar el ecosistema" (si rol org) |
| "colabora con startups" | "conecta con startups vía app.qanvit.com" |
| "lanza tu reto" | CTA a app.qanvit.com |
| "proponer reto" | (eliminado) |
| "votar reto" | (eliminado) |
| "reto comunitario" | (eliminado) |
| "contactar founder" | (eliminado) |
| "contacto directo" | (eliminado) |
| "pipeline" (en contexto de orgs en La Liga) | (eliminado; pipeline vive en app.qanvit.com) |

### 6.2 Copy nuevo por ubicación

**Home página pública `/` (para orgs):**

> Observa el ecosistema de startups españolas. Descubre oportunidades. Vota a las que merecen subir. Y cuando quieras lanzar un reto real, te esperamos en [app.qanvit.com](https://app.qanvit.com).

**Landing `/ecosistema/aplicar`:**

> Únete como observador del ecosistema. Aplica a La Liga Qanvit para acceder al leaderboard, descubrir startups emergentes y votar las que merecen crecer. Para gestionar retos de innovación abierta, consulta [app.qanvit.com](https://app.qanvit.com).

**Onboarding post-approval (nuevo paso wizard):**

Step 1: "Bienvenido a La Liga Qanvit — aquí observas el ecosistema."
Step 2: "Sigue 3 verticales que te interesen."
Step 3: "Comparte tu código de referral para traer startups."
Step 4: "**Cuando quieras gestionar un reto real → app.qanvit.com**" (con link).

**Footer ecosystem:**

> La Liga es tu ventana al ecosistema. Para lanzar retos reales → [app.qanvit.com](https://app.qanvit.com).

---

## 7. Actualizaciones a docs existentes

El Prompt #6 debe además **actualizar** los siguientes docs del repo:

| Doc | Secciones a actualizar |
|---|---|
| `docs/ECOSYSTEM.md` | Eliminar §7 (Retos comunitarios) entera. Eliminar §8 (Contact Elite) entera. Añadir §11 (Voto startup). Actualizar §5 (Home dashboard) con nueva estructura. |
| `docs/GAMIFICATION.md` | Actualizar tabla de capabilities por tier. Eliminar "contacto directo Elite". Añadir voto ponderado. Aclarar que votar no da puntos. |
| `docs/DATA_MODEL.md` | Eliminar secciones de `challenges`, `challenge_votes`, `contact_requests`. Añadir `startup_votes` + `startup_momentum`. |
| `docs/ADMIN.md` | Eliminar §7 (Challenges admin) y §8 (Distribute prizes) enteras. Añadir §nuevo para moderación de votos (suspender voto si reason abusivo). |
| `docs/BRAND.md` | Eliminar cualquier mención a "retos comunitarios". Añadir sección "Separación La Liga vs app.qanvit.com". |

---

## 8. Métricas de éxito del nuevo modelo

Después del soft launch, monitorizamos:

- **Activación de voto**: % de orgs que votan ≥1 vez en primeros 30d. Objetivo >50%.
- **Frecuencia de voto**: votos/org/mes promedio. Objetivo >3.
- **Scouting eye accuracy**: tasa media de aciertos en voto up → subida ≥20 pts. Objetivo >40% (baseline es ruido).
- **Click-through a app.qanvit.com**: clicks/mes desde dashboard ecosystem. Objetivo >1 click/org/mes.
- **Conversión La Liga → app.qanvit.com**: % de orgs de La Liga que firman contrato en app.qanvit.com en 6 meses. Objetivo >5%.

---

## 9. Lo que NO cambia

Para que quede claro, estas cosas siguen igual:

- `ecosystem_organizations` y su modelo multi-user (`org_members`) — tras el fix del audit.
- Sistema de referrals y puntos (excepto la parte de challenges).
- Sistema de alertas por vertical.
- Export CSV por tiers.
- Leaderboard anónimo.
- Dashboard startup completo (home, timeline, visibilidad, configuración).
- Pipeline de evaluación de decks.
- Admin panel (excepto secciones de challenges y contact_requests).
- Perfil público de startup en `/startup/[slug]`.

---

*Fin del doc. Este es el estado objetivo V1. El Prompt #6 implementa la transición desde el estado actual hasta aquí.*
