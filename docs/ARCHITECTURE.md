# Arquitectura — La Liga Qanvit

## 1. Visión de alto nivel

```
                   ┌─────────────────────────────────────────┐
                   │            laliga.qanvit.com            │
                   │        (Next.js 14 en Vercel)           │
                   └─────────────────────────────────────────┘
                          │                        │
        ┌─────────────────┘                        └─────────────────┐
        ▼                                                            ▼
┌───────────────────┐                                    ┌─────────────────────┐
│  Rutas públicas   │                                    │  Rutas autenticadas │
│  (SSG + ISR)      │                                    │  (SSR + RSC)        │
│  - Landing        │                                    │  - /dashboard       │
│  - Leaderboard    │                                    │  - /ecosistema      │
│  - /startup/[id]  │                                    │  - /admin           │
└───────────────────┘                                    └─────────────────────┘
        │                                                            │
        └────────────────────────┬───────────────────────────────────┘
                                 ▼
                   ┌──────────────────────────────┐
                   │   Supabase (Postgres +       │
                   │   pgvector + Auth + Storage) │
                   └──────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
  ┌────────────┐          ┌─────────────┐         ┌─────────────────┐
  │  Storage   │          │  Edge Fn    │         │  Row Level Sec  │
  │  (decks)   │─────────▶│  evaluator  │◀────────│  (per-table)    │
  └────────────┘          │  -pipeline  │         └─────────────────┘
                          └─────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Claude API          │
                    │    (Opus 4.7 +         │
                    │    Haiku 4.5)          │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Embeddings API        │
                    │  (OpenAI o Voyage)     │
                    └────────────────────────┘
```

## 2. Componentes

### 2.1 Frontend (Next.js 14)

Segmentado por route groups:
- `app/(public)/` → SSG/ISR. Landing, leaderboard, perfiles públicos. Revalidación ISR cada 60s.
- `app/(startup)/` → SSR protegido. Dashboard de la startup autenticada.
- `app/(ecosystem)/` → SSR protegido. Dashboard de parques/clusters/asociaciones (rol `ecosystem`).
- `app/(admin)/` → SSR protegido. Panel Qanvit (rol `admin`).
- `app/api/` → Route handlers para endpoints específicos.

**State**: mayoritariamente server state (via RSC). Client state mínimo con `nuqs` para filtros de URL.

### 2.2 Auth (Supabase Auth)

- **Magic link** como default (email sin password).
- **Google OAuth** para startups (reduce fricción).
- **Roles**: `startup` (default), `ecosystem`, `admin`. Se almacenan en `profiles.role` con un enum Postgres.
- **Middleware**: `middleware.ts` de Next valida sesión y redirige según rol.

### 2.3 Storage (Supabase Storage)

- Bucket **`decks`**: privado. Path: `{startup_id}/{deck_id}.pdf`.
- Bucket **`public-assets`**: público (logos startup, imágenes OG).
- Signed URLs de corta duración (15min) cuando admin o startup necesita descargar.

### 2.4 Base de datos (Supabase Postgres + pgvector)

Ver `docs/DATA_MODEL.md` para schema completo. Puntos clave:
- **Extensión `vector`** (pgvector) habilitada para embeddings (dim 1536).
- **RLS activado en todas las tablas**.
- **Triggers** para actualizar `updated_at`, calcular ranking materializado, log de puntos.
- **Vista `league_standings`** materializada, refrescada tras cada evaluación completada.

### 2.5 Pipeline de evaluación

Flujo asíncrono, orquestado por una Supabase Edge Function (`evaluator-pipeline`):

```
┌───────────────┐
│ upload deck   │  POST /api/decks/upload
│ (PDF → bucket)│
└───────┬───────┘
        │ crea registro en `decks` con status='pending'
        │ dispara edge function vía pg_net o trigger
        ▼
┌───────────────────┐
│ 1. extract text   │  pdf-parse → raw_text
│    (edge fn)      │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ 2. chunk + embed  │  chunks de 800 tokens con overlap 100
│    (edge fn)      │  → embeddings → insert en `deck_chunks`
└───────┬───────────┘
        │
        ▼
┌───────────────────────┐
│ 3. classify phase     │  Claude Haiku 4.5
│    (prompt v1)        │  → { phase: 'seed', vertical: 'robotics' }
└───────┬───────────────┘
        │
        ▼
┌────────────────────────┐
│ 4. deep evaluation     │  Claude Opus 4.7
│    (prompt v1,         │  → scores por 7 dimensiones,
│     pesos según phase) │    feedback, next actions
└───────┬────────────────┘
        │
        ▼
┌───────────────────────┐
│ 5. write evaluation   │  insert en `evaluations`
│    + update rank      │  refresh vista `league_standings`
│    + notify user      │  email con link al resultado
└───────────────────────┘
```

**Versionado**: cada prompt y cada rubric se versiona (`v1`, `v2`...) y se guarda en el registro de evaluación para reproducibilidad.

**Retry**: 3 reintentos con exponential backoff. Si falla todo, registro queda en `status='error'` y aparece en cola admin.

**Idempotencia**: el `deck_id` + `prompt_version` es clave única. Si ya existe evaluación con misma versión, no se re-corre salvo que admin fuerce re-evaluación.

### 2.6 Claude API (wrappers)

Todo pasa por `lib/claude/`:
- `lib/claude/client.ts` → cliente singleton con `@anthropic-ai/sdk`.
- `lib/claude/evaluator.ts` → funciones puras que reciben contexto y devuelven `EvaluationResult` tipado.
- `lib/claude/prompts/` → prompts como constantes versionadas.

**Uso de modelos:**
- `claude-opus-4-7` → evaluación profunda del deck.
- `claude-haiku-4-5-20251001` → clasificación rápida de fase/vertical, extracciones, resúmenes para OG.

**Estructured output**: usar `tool_use` (function calling) para forzar JSON válido tipado con Zod.

### 2.7 Embeddings

Elegir provider al arrancar. Recomendación:
- **OpenAI `text-embedding-3-small`** (1536 dims) — barato, bien soportado.
- Alternativa: **Voyage AI `voyage-3`** — mejor para documentos técnicos.

Se guardan en `deck_chunks.embedding` (pgvector). Sirven para:
- Búsqueda semántica dentro del dashboard admin.
- V2: recommendation engine del agente Coordinating de Qanvit.
- V2: detección de duplicados (startups subiendo decks similares).

### 2.8 Ranking y clasificación

- **Score total**: promedio ponderado de 7 dimensiones según pesos de la fase.
- **División**: determinada por el clasificador de fase en paso 3 del pipeline.
- **Vertical**: determinada por el clasificador en paso 3. Lista cerrada de 10 verticales (ver `docs/LEAGUE_STRUCTURE.md`).
- **Rank nacional**: posición por score total global.
- **Rank división**: posición por score dentro de la División.
- **Rank división+vertical**: posición por score dentro de la combinación.

Se materializan en `league_standings` (vista materializada) para queries rápidas. Se refresca tras cada evaluación completada (trigger).

### 2.9 Gamificación ecosistema

Ver `docs/GAMIFICATION.md`. Técnicamente:
- Tabla `ecosystem_points_log` (append-only).
- Vista agregada `ecosystem_totals` para puntos totales por usuario.
- Tier calculado al vuelo según puntos totales.
- Feature gating en el frontend según tier leído de `ecosystem_totals`.

## 3. Seguridad

### 3.1 RLS (ejemplos clave)

```sql
-- startups: la startup ve solo su registro; admin ve todo; público ve only is_public=true rows vía view
create policy "startups_select_own" on startups
  for select using (auth.uid() = owner_id);

create policy "startups_select_admin" on startups
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- decks: nunca accesible vía RLS al ecosistema (solo via admin UI). La startup sí ve sus decks.
create policy "decks_select_own" on decks
  for select using (auth.uid() = (select owner_id from startups where id = decks.startup_id));

-- evaluations: público puede ver score+summary; la startup ve todo; admin ve todo
-- para público, se usa una vista `public_evaluations` que expone solo campos permitidos
```

### 3.2 Secrets

- `SUPABASE_SERVICE_ROLE_KEY` **nunca** al cliente. Solo en API routes (runtime Node) y edge functions.
- `ANTHROPIC_API_KEY` solo en server.
- Rotación anual de secrets mínimo.

### 3.3 Rate limiting

- Upstash Redis + middleware en `middleware.ts` para rate limit de API routes.
- Startup: máx 1 deck cada 7 días (anti-spam).
- Ecosistema free: 50 requests/hora al leaderboard.

### 3.4 PII y GDPR

- Cifrado at-rest en Supabase (default).
- DPAs firmados con Supabase y Anthropic.
- Endpoint `/api/account/delete` que purga: auth.user, profiles, startups, decks (storage), deck_chunks, evaluations.
- Log de auditoría de quién accede a qué deck.

## 4. Observabilidad

- **Logs**: Vercel logs + Supabase logs. Agregados a Axiom o Logtail.
- **Errores**: Sentry (client + server + edge functions).
- **Product analytics**: PostHog. Eventos clave: `deck_uploaded`, `evaluation_completed`, `leaderboard_viewed`, `ecosystem_tier_unlocked`.
- **Métricas LLM**: tabla `evaluation_metrics` con latencia, tokens, coste estimado por evaluación.

## 5. Deployment y entornos

- **Dev**: local con Supabase CLI (`supabase start`).
- **Preview**: cada PR en Vercel + Supabase branch database (si se usa, alternativa: una DB shared `staging`).
- **Production**: Vercel + Supabase production project. Custom domain `laliga.qanvit.com`.

**Migrations**:
- `supabase db push` para aplicar.
- CI/CD corre `supabase db diff` y valida que no haya cambios sin migración.

## 6. Decisiones arquitectónicas (ADRs en corto)

| # | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| 1 | Next.js App Router | Pages Router, Remix | RSC + streaming + mejor DX con Vercel |
| 2 | Supabase | Firebase, AWS RDS + Cognito | Postgres real + RLS + pgvector + menor coste inicial |
| 3 | Evaluador asíncrono (edge fn) | Evaluación sync en request | Decks grandes + Claude tarda >30s |
| 4 | Score 0-100 por dimensión | Star rating 1-5 | Granularidad suficiente, fácil de combinar |
| 5 | División por fase + Vertical | Solo por vertical | Diferencia madurez de sector; mejor storytelling (liga) |
| 6 | LLM determina fase (no datos) | Usuario declara fase | Reduce fricción, menos manipulación, aprovecha el deck |
| 7 | shadcn/ui | Chakra, Mantine, propio | Headless, full control, accesible, gratis |
| 8 | `next-intl` para i18n | `react-i18next`, propio | Mejor integración con App Router |
