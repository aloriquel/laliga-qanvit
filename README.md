# La Liga Qanvit

> La liga nacional de startups en España. Sube tu deck, recibe feedback de expertos, y posiciónate en tu división y vertical.

**laliga.qanvit.com** — un producto de engagement de [Qanvit](https://www.qanvit.com).

---

## ¿Qué es?

La Liga Qanvit es una base de datos gamificada de startups españolas organizada como una liga deportiva: cada startup se clasifica en una **División** (fase de madurez) y una **Vertical** (categoría sectorial), compitiendo por posiciones en el ranking nacional.

**Tres actores, tres valores:**

| Actor | Qué hace | Qué recibe |
|---|---|---|
| **Startup** | Sube su deck | Feedback estructurado + posición en la liga + visibilidad |
| **Ecosistema** (parques, clusters, asociaciones) | Descubre talento | Gamificación del acceso a datos, filtros, alertas |
| **Qanvit** | Opera la liga | Dataset vectorizado + flywheel de innovación abierta |

---

## Levantar el entorno local

### Pre-requisitos

- Node.js 18+
- Docker (para Supabase local)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado globalmente

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno y rellenar manualmente
cp .env.example .env.local

# 3. Levantar Supabase local (requiere Docker)
npx supabase start

# 4. Aplicar todas las migrations (crea el schema completo)
npx supabase db reset

# 5. Generar los types TypeScript desde el schema local
npx supabase gen types typescript --local > lib/supabase/types.ts

# 6. Arrancar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### Comandos útiles

```bash
npm run dev        # servidor de desarrollo con hot reload
npm run build      # build de producción
npm run lint       # ESLint

npx supabase start           # levantar Supabase local
npx supabase stop            # parar Supabase local
npx supabase db reset        # resetear DB y aplicar migrations
npx supabase db diff         # ver cambios sin migration
npx supabase gen types typescript --local > lib/supabase/types.ts
npm run smoke:pipeline [deck_id]  # smoke test del pipeline end-to-end
npx supabase functions serve evaluator-pipeline --env-file .env.local
npx supabase functions logs evaluator-pipeline
```

---

## Estructura del proyecto

```
laliga-qanvit/
├── app/                      # Next.js 14 App Router
│   ├── (public)/             # Landing, leaderboard, perfiles (SSG + ISR)
│   ├── (startup)/            # Dashboard startup autenticada (SSR)
│   ├── (ecosystem)/          # Dashboard parques/clusters (SSR)
│   ├── (admin)/              # Panel Qanvit (SSR)
│   ├── api/                  # Route handlers
│   ├── play/                 # Flujo onboarding startup
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn/ui primitivos
│   ├── league/               # Componentes de liga (standings, cards)
│   └── branding/             # Header, Footer, isotipo { }
├── lib/
│   ├── supabase/             # Clientes server/client + types
│   ├── claude/               # Wrappers del SDK de Anthropic
│   ├── evaluator/            # Schemas Zod + pesos por fase
│   ├── embeddings/           # Chunking + embeddings (prompt #2)
│   └── league/               # Lógica de divisiones/ranking
├── supabase/
│   ├── migrations/           # SQL migrations versionadas (0001-0006)
│   ├── functions/            # Edge functions (evaluator-pipeline — prompt #2)
│   └── README.md             # Comandos Supabase
├── docs/                     # Documentación viva del producto
├── .env.example              # Variables de entorno (plantilla)
└── CLAUDE.md                 # Contexto maestro para Claude Code
```

---

## Documentación

| Archivo | Propósito |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Contexto maestro para Claude Code |
| [`docs/PRD.md`](./docs/PRD.md) | Product Requirements Document |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitectura técnica |
| [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) | Schema Supabase + RLS |
| [`docs/EVALUATOR_RUBRIC.md`](./docs/EVALUATOR_RUBRIC.md) | Rubric de evaluación |
| [`docs/LEAGUE_STRUCTURE.md`](./docs/LEAGUE_STRUCTURE.md) | Divisiones, verticales, ranking |
| [`docs/GAMIFICATION.md`](./docs/GAMIFICATION.md) | Sistema de puntos ecosistema |
| [`docs/BRAND.md`](./docs/BRAND.md) | Brand guidelines Qanvit |

---

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript strict + Tailwind CSS + shadcn/ui
- **Backend**: Next.js Route Handlers + Supabase Edge Functions
- **Base de datos**: Supabase (Postgres 15 + pgvector + RLS)
- **Auth**: Supabase Auth (magic link + Google OAuth)
- **Storage**: Supabase Storage (bucket privado `decks`)
- **LLM**: Claude API (`claude-opus-4-7` evaluación, `claude-haiku-4-5-20251001` clasificación)
- **Deploy**: Vercel (frontend) + Supabase (data plane)

---

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Embeddings
OPENAI_API_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=liga@qanvit.com

# Analytics (opcional en dev, requerido en prod)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Error tracking (opcional en dev, requerido en prod)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# App
NEXT_PUBLIC_APP_URL=https://laliga.qanvit.com

# Edge functions (para pg_cron jobs)
EVALUATOR_FN_SECRET=
```

## Antes de abrir el login público

Estas dos configuraciones manuales en Supabase son **obligatorias** antes de que usuarios reales accedan. Sin ellas, los magic links pueden ir a spam y los endpoints de auth están expuestos a abuso.

### 1. Custom SMTP para emails de auth

Supabase Dashboard → **Authentication → SMTP Settings**:

| Campo | Valor |
|---|---|
| Sender email | `liga@qanvit.com` |
| Sender name | `La Liga Qanvit` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `<RESEND_API_KEY>` (la misma key verificada con qanvit.com) |

> Sin esto, Supabase usa su SMTP por defecto y los magic links llegan desde `noreply@mail.supabase.io`, lo que dispara filtros de spam.

### 2. Rate limits en Supabase Auth

Supabase Dashboard → **Authentication → Rate Limits**:

| Endpoint | Límite recomendado |
|---|---|
| Sign-up | 10 por hora por IP |
| Magic link / OTP | 5 por hora por IP |
| Email change | 3 por hora por IP |

> El rate limiter de aplicación (`lib/auth/rate-limit.ts` + Upstash) opera en capa Next.js. Los límites de Supabase son la segunda barrera si alguien llama directamente a la API de Supabase.

### 3. Upstash Redis para rate limiting de aplicación

1. Crea un Redis gratuito en [upstash.com](https://upstash.com) → región EU-West-1.
2. Añade a Vercel env vars:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

> Sin las vars de Upstash el rate limiter pasa todas las peticiones (graceful degradation). Con las vars activo, límite de 3 intentos/IP/15min y 5/email/hora.

---

## Prompts implementados

| Prompt | Qué implementa |
|---|---|
| **#1** | Scaffolding: Next.js + Tailwind + shadcn + Supabase schema + Claude SDK |
| **#2** | Pipeline evaluación: extracción PDF + embeddings + Claude + edge function |
| **#3** | Dashboard startup con data real |
| **#4** | Dashboard ecosistema + puntos + gamificación |
| **#5** | Panel admin + métricas + export + audit log |
| **#6 (este)** | pg_cron, i18n ES/EN, SEO, legal pages GDPR, Sentry, PostHog, deploy Vercel |
