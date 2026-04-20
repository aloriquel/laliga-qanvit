# Dashboard startup & features de visibilidad

> Complementa `PRD.md`, `ARCHITECTURE.md` y `PIPELINE.md`. Cubre: dashboard autenticado, carta OG compartible, tracking de visitas del ecosistema, alertas de cambios de posición, re-subir deck.

## 1. Filosofía del dashboard

El dashboard es el **pit lane** de la startup en la liga:
- Es donde ve su posición en tiempo real.
- Es donde entiende qué del ecosistema está prestándole atención.
- Es donde decide cuándo volver a la pista (re-subir deck).
- Es donde controla su privacidad.

Principios:
1. **Una métrica por pantalla**. No saturar con 12 KPIs. El número grande manda.
2. **Privacy first**. Todos los toggles están a un click de vista.
3. **Tono deportivo**. "Has subido 3 posiciones" > "Position changed from 7 to 4".
4. **Respeto absoluto a la data de la startup**. Solo ella ve su feedback completo.

## 2. Rutas y layout

```
/dashboard                    ← home: score actual + últimas novedades
/dashboard/evaluaciones       ← timeline histórico con todas las evals
/dashboard/visibilidad        ← quién te ha visto + alertas de posición
/dashboard/configuracion      ← consents, privacy toggles, zona de peligro
```

Layout común: sidebar izquierda (rail), contenido central. En mobile, tab bar inferior.

## 3. Home (`/dashboard`)

**Hero card** (ocupando ~60% viewport):
- Score total grande (Sora 800, 96-128px según viewport).
- Pill "División · Vertical" con color league-*.
- 3 rankings en línea: `#4 en Seed Robotics · #27 en Seed · #142 nacional`.
- Delta vs evaluación anterior: `↑ 12 puntos` o `↓ 3 puntos` (o "primera evaluación").
- Botón primario "Compartir carta" → abre modal con OG preview + botones LinkedIn/X + descargar PNG.

**Sección "Últimas novedades"**:
- Las 5 alertas más recientes (ver §7).
- Link a /dashboard/visibilidad para ver todas.

**Sección "Re-subir deck"**:
- Si han pasado ≥7 días desde última evaluación: CTA habilitado.
- Si no: contador `"Podrás re-subir tu deck en 4 días y 17 horas"`.

**Sección "Tu próximo salto"**:
- Muestra las 3 dimensiones con score más bajo.
- Link "Ver feedback completo" → /dashboard/evaluaciones.

## 4. Timeline de evaluaciones (`/dashboard/evaluaciones`)

Vista cronológica inversa. Cada evaluación:

- Fecha + versión (`v3 · 12 mar 2026`).
- Score total con delta vs anterior.
- División y Vertical asignadas.
- Cards expandibles de las 7 dimensiones con strengths, weaknesses, evidence quotes.
- Summary y next actions.
- Si la eval fue `degraded_mode=true`: pequeño tag gris `"Evaluación con modelo de respaldo"` (sin dramatismo).

**Comparativa vs media División+Vertical**:
- Gráfica de barras horizontales: score de la startup vs media de su combinación.
- Por cada dimensión. Usa recharts.
- Solo visible si hay ≥5 startups en la combinación (para no exponer datos con muestras pequeñas).

## 5. Visibilidad (`/dashboard/visibilidad`)

Dos sub-secciones:

### 5.1 Quién ha visto tu perfil
- Lista de organizaciones del ecosistema que han abierto `/startup/[slug]` estando autenticadas.
- Cada fila: logo + nombre + tipo (parque/cluster/asociación) + última visita + total visitas.
- Ordenado por `last_viewed_at desc`.
- Filtro por tipo de org.
- **No se muestra la persona individual, solo la organización**. (Privacy del usuario del ecosistema + evita contactos directos que saltan el canal Qanvit.)

### 5.2 Alertas de posición
- Lista de eventos: subida/bajada de División, entrada/salida de top 10, milestones.
- Cada alerta: icono + texto + timestamp + mark-as-read toggle.
- Toggle "enviarme alertas por email" (default ON).

## 6. Configuración (`/dashboard/configuracion`)

Secciones:

### 6.1 Perfil público
- `is_public` toggle: si está OFF, el perfil no aparece en leaderboard.
- `consent_public_profile` toggle: si está OFF, el ranking no cuenta y la carta no es compartible.
- `show_public_timeline` toggle: si está ON, el perfil público muestra la evolución (timeline de evals). Si está OFF, solo la última.

### 6.2 Notificaciones
- Email de alertas: ON/OFF.
- Frecuencia: inmediato / diario / semanal.

### 6.3 Datos y privacidad
- Link a política de privacidad.
- Botón "Descargar mis datos" (JSON con startup + evaluations + chunks) — TODO V1.5.
- Botón "Eliminar mi cuenta" → modal de confirmación → cascada borra startup, decks, chunks, evaluations. Irreversible.

## 7. Alertas de cambios de posición

### Tipos

| `alert_type` | Payload | Trigger |
|---|---|---|
| `moved_up_division` | `{ from: "seed", to: "growth", new_score, old_score }` | Change en `current_division` al alza |
| `moved_down_division` | `{ from: "growth", to: "seed", ... }` | Change a la baja |
| `new_top3_vertical` | `{ vertical, new_rank: 3 \| 2 \| 1 }` | Entra en top 3 de su combinación |
| `new_top10_vertical` | `{ vertical, new_rank: 4..10 }` | Entra en top 10 de su combinación |
| `new_top10_division` | `{ division, new_rank }` | Entra en top 10 de su División |
| `position_milestone` | `{ scope: "national" \| "division", from: 142, to: 87 }` | Gana ≥50 posiciones nacional o ≥20 división |

### Delivery
- Insert en tabla `startup_alerts`.
- Trigger calls a edge function `alert-dispatcher` que envía email via Resend (respeta settings de notificación).
- Visible en bell icon del header del dashboard con contador de `is_read=false`.

### Lógica
Se disparan dentro de `sync_startup_current_eval` (trigger after insert on `evaluations`). Se calcula:
1. Estado viejo (SELECT previous eval).
2. Estado nuevo (current eval).
3. Diffs → inserta filas en `startup_alerts`.

## 8. Re-subir deck

### Flujo
1. Usuario en `/dashboard` clica "Re-subir deck".
2. Modal: "Esto archivará tu deck actual y generará una nueva evaluación. Tu posición puede cambiar."
3. Confirmación → redirige a `/play/re-subir`.
4. Form de upload simplificado (la startup ya existe, solo pide deck + nuevo one-liner si quiere cambiarlo).
5. POST `/api/decks/resubir`:
   a. Valida 7 días desde última eval.
   b. UPDATE deck anterior: `status='archived'`.
   c. Crea nuevo deck `status='pending'`.
   d. Pipeline se dispara (mismo flujo del Prompt #2).
6. Redirige a `/play/evaluando/[deck_id]`.

### Reglas
- No se borra el deck anterior ni sus chunks ni evaluations (histórico intacto).
- `startups.current_*` se actualiza cuando la nueva eval termina (via trigger existente).
- Si la startup cambia el one-liner, se guarda en su profile (`startups.one_liner`), no en el deck.

## 9. Carta OG compartible

### Endpoint
`GET /api/og/startup/[slug]` → devuelve PNG 1200×630.

### Design spec ("trading card Pokémon NBA")
- **Fondo**: gradiente diagonal `brand-navy` → `#2d1f4a` → `brand-navy`. Overlay de "shimmer" estático (gradient radial suave salmon con 8% opacity).
- **Border**: 3px salmon con glow sutil (box-shadow emulada con layer interior).
- **Top-left**: `{ La Liga Qanvit }` en Sora 600, 20px, salmon.
- **Top-right**: si top 3 de su División+Vertical → badge medalla gigante (🥇🥈🥉) en 120px absoluto. Si no, nada.
- **Center-top**: logo startup circular (160×160) con borde salmon de 4px, sobre fondo blanco.
- **Center**: nombre startup en Sora 700, 48px, blanco.
- **Below**: pill `División · Vertical` con color de la División (league-* token).
- **Center-big**: score total en Sora 800, 180px, color salmon. Alineado al centro.
- **Below score**: línea `#4 EN SEED ROBOTICS` en Sora 600, 24px, tracking wide, uppercase, salmon.
- **Above bottom**: segunda línea más pequeña `#27 EN SEED LEAGUE · #142 NACIONAL` en JetBrains Mono 14px, lavender-300.
- **Bottom-right**: `laliga.qanvit.com` en JetBrains Mono 14px, opacidad 60%.
- **Bottom-left**: pequeño logo isotipo `{ }` en salmon.

### Versión animada (solo en web, no en OG)
- Componente `<ClassificationCardAnimated />` que muestra la misma info pero con:
  - Entrance animation (scale 0.8 → 1 + fade in).
  - Shimmer sweep pasando por encima cada 6s (simula holográfico).
  - Hover: leve tilt 3D con `transform-style: preserve-3d`.
- Usa Framer Motion (instalar).
- Aparece en `/play/resultado/[deck_id]` y en el modal de "Compartir" del dashboard.
- Cuando el usuario clica "Descargar PNG", se llama al endpoint OG estático (no se captura del DOM).

## 10. Middleware de auth

`middleware.ts` en raíz del repo. Lógica:

```
GET /dashboard/**           → redirige a /play si no hay sesión
GET /admin/**               → redirige a / si no es admin
GET /ecosistema/dashboard/**  → redirige a /ecosistema/aplicar si rol ≠ ecosystem
GET /play/re-subir          → redirige a /play si no hay sesión o si no tiene startup
GET /startup/[slug]         → público siempre, pero si hay sesión de ecosystem
                              registra una visita (server action, no blocking)
```

Usa `@supabase/ssr` para validar sesión server-side en middleware.

## 11. Data model (nuevo en este prompt)

### 11.1 `startup_ecosystem_views`
Aggregate view tracking (upsert con contador, no una fila por visita).

```sql
create table startup_ecosystem_views (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  org_id uuid not null references ecosystem_organizations(id) on delete cascade,
  views_count int not null default 1,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  unique(startup_id, org_id)
);
```

### 11.2 `startup_alerts`

```sql
create type alert_type as enum (
  'moved_up_division',
  'moved_down_division',
  'new_top3_vertical',
  'new_top10_vertical',
  'new_top10_division',
  'position_milestone'
);

create table startup_alerts (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  alert_type alert_type not null,
  payload jsonb not null,
  is_read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_startup_alerts_unread on startup_alerts(startup_id, is_read) where is_read = false;
```

### 11.3 Nuevos campos en `startups`

```sql
alter table startups add column show_public_timeline boolean not null default false;
alter table startups add column notification_email_enabled boolean not null default true;
alter table startups add column notification_frequency text not null default 'immediate';
-- values: 'immediate' | 'daily' | 'weekly'
```

### 11.4 RLS de las nuevas tablas

```sql
-- startup_ecosystem_views: la startup ve las suyas; admin ve todo;
-- la org que hizo la visita ve sus propias filas
create policy "ecosystem_views_owner_select" on startup_ecosystem_views
  for select using (
    auth.uid() = (select owner_id from startups where id = startup_id)
  );

create policy "ecosystem_views_org_select" on startup_ecosystem_views
  for select using (
    auth.uid() = (select owner_id from ecosystem_organizations where id = org_id)
  );

create policy "ecosystem_views_admin_all" on startup_ecosystem_views
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- startup_alerts: owner ve los suyos; admin ve todo
create policy "alerts_owner_select" on startup_alerts
  for select using (
    auth.uid() = (select owner_id from startups where id = startup_id)
  );

create policy "alerts_owner_update" on startup_alerts
  for update using (
    auth.uid() = (select owner_id from startups where id = startup_id)
  );
-- inserts se hacen vía trigger con security definer, no por RLS
```

## 12. Trigger de alertas

Actualiza la función `sync_startup_current_eval` (ya existe) para que **además** inserte filas en `startup_alerts`:

```sql
-- pseudocódigo
on insert into evaluations:
  select prev_eval from evaluations where startup_id = new.startup_id order by created_at desc offset 1 limit 1;
  if prev_eval is null then
    -- primera evaluación, no hay alerts (excepto milestone inicial si new_rank <= 10)
    ...
  else
    if new.assigned_division != prev_eval.assigned_division then
      insert into startup_alerts (... 'moved_up_division' or 'moved_down_division' ...)
    end if;

    -- leer rank viejo y nuevo desde league_standings
    ...
    if new_rank_vertical <= 3 and (prev_rank_vertical is null or prev_rank_vertical > 3) then
      insert new_top3_vertical
    elsif new_rank_vertical <= 10 and (prev_rank_vertical is null or prev_rank_vertical > 10) then
      insert new_top10_vertical
    end if;
    ...
  end if;
```

Después, NOTIFY canal para que la edge function `alert-dispatcher` procese los emails.

## 13. Performance y caching

- **OG images**: cachear en Vercel edge con `export const revalidate = 3600`. Invalidar por tag `startup-{slug}` al completar nueva eval.
- **Dashboard home**: Server Components con data fetching streaming.
- **Timeline**: paginar si hay >10 evals (muy improbable en V1, pero ya previsto).
- **Leaderboard de alerts**: no hace falta optimizar aún.

## 14. Copies deportivas para el dashboard

| Contexto | Copy |
|---|---|
| Hero delta positivo | ↑ **3 posiciones** en Seed Robotics esta semana |
| Hero delta negativo | ↓ 2 posiciones · revisa el feedback |
| Primera evaluación | Primera evaluación. Bienvenido a la liga. |
| Alerta subida División | **¡Has subido de División!** Bienvenido a Growth. |
| Alerta top 3 | **Top 3 en Seed Robotics.** Eres de los grandes. |
| Alerta bajada | Has bajado de posición. El mercado se mueve — tú también. |
| Countdown re-subir | Podrás re-subir tu deck en **{X} días**. |
| Re-subir ready | Tu próximo deck está listo para evaluarse. |
| Sin views todavía | El ecosistema aún no te ha visto. Comparte tu carta. |
| 0 alertas | `{ todo tranquilo }` — seguimos monitorizando tu posición. |
