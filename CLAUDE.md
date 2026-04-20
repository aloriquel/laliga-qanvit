# CLAUDE.md — Contexto maestro del proyecto

Este archivo es la referencia permanente para Claude Code trabajando en este repositorio. **Léelo antes de cualquier tarea.** Complementa con los documentos en `docs/`.

---

## 1. Proyecto

**Nombre**: La Liga Qanvit
**Dominio**: `laliga.qanvit.com`
**Producto matriz**: [Qanvit](https://www.qanvit.com) — plataforma de agentes de IA para Corporate Venture e innovación abierta.
**Objetivo**: crear la liga nacional de startups de España gamificada, donde cada startup sube su deck, recibe feedback experto automatizado y se posiciona en una división (fase) y vertical (categoría).

**Tres loops de valor:**
1. **Startup** → sube deck → recibe feedback + visibilidad en ranking.
2. **Ecosistema** (parques, clusters, asociaciones) → descubre startups → gana puntos → desbloquea acceso a datos.
3. **Qanvit** → captura, vectoriza y estructura el mayor dataset de startups técnicas españolas.

> **Importante**: Qanvit replica la arquitectura de 4 agentes de FQ Source (Structuring → Discovering → Coordinating → Evaluating). La Liga Qanvit opera principalmente en el agente **Evaluating** y alimenta al de **Structuring**.

---

## 2. Stack técnico (decisiones tomadas)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 14** con App Router | TypeScript estricto (`strict: true`) |
| Lenguaje | **TypeScript** | No usar `any` salvo excepción justificada |
| Estilos | **Tailwind CSS** + **shadcn/ui** | Design tokens del brand book (ver `docs/BRAND.md`) |
| Base de datos | **Supabase** (Postgres 15 + pgvector) | RLS activado en todas las tablas |
| Auth | **Supabase Auth** | Magic link + Google OAuth |
| Storage | **Supabase Storage** | Bucket privado `decks` |
| LLM | **Claude API** (`@anthropic-ai/sdk`) | Opus 4.7 para evaluación, Haiku 4.5 para tareas rápidas |
| Embeddings | OpenAI `text-embedding-3-small` o Voyage AI | Dimensión 1536 → pgvector |
| PDF parsing | `pdf-parse` o `unpdf` | Server-side |
| Deploy | **Vercel** (frontend) + Supabase managed | Preview por PR |
| Analytics | PostHog | Self-hosted opcional más adelante |

**Modelos Claude a usar:**
- Evaluación profunda del deck → `claude-opus-4-7` (exacto: `claude-opus-4-7`)
- Clasificación rápida, extracciones, resúmenes → `claude-haiku-4-5-20251001`

---

## 3. Estructura de carpetas esperada

```
laliga-qanvit/
├── app/                      # Next.js App Router
│   ├── (public)/             # Rutas públicas (landing, leaderboard)
│   ├── (startup)/            # Dashboard startup autenticada
│   ├── (ecosystem)/          # Dashboard parques/clusters
│   ├── api/                  # Route handlers
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn primitives
│   ├── league/               # Componentes de liga (standings, cards)
│   └── branding/             # Logo, isotipo { }, tokens
├── lib/
│   ├── supabase/             # Cliente, types generados, helpers
│   ├── claude/               # Wrappers del SDK de Anthropic
│   ├── evaluator/            # Pipeline de evaluación
│   ├── embeddings/           # Chunking + embeddings
│   └── league/               # Lógica de divisiones/ranking
├── supabase/
│   ├── migrations/           # SQL migrations
│   ├── functions/            # Edge functions (evaluator-pipeline)
│   └── seed.sql              # Datos semilla (verticales, divisiones)
├── public/
│   ├── brand/                # Logos, isotipo (ya provistos por el usuario)
│   └── og/                   # Open Graph images
├── docs/                     # Documentación viva
├── CLAUDE.md                 # Este archivo
└── FIRST_PROMPT.md           # Prompt de arranque
```

---

## 4. Convenciones de código

- **TypeScript estricto**. Preferir `type` sobre `interface` excepto cuando se extienda de librerías externas.
- **Zod** para validación en los boundaries (API routes, form submissions, LLM outputs).
- **No inventar UI**. Usar shadcn/ui como base y customizar con tokens del brand book.
- **Server Components por defecto**. Client Components solo cuando haya interactividad real.
- **Fetches de data en Server Components o Route Handlers**. Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- **Nombres de tablas en `snake_case`**, nombres de componentes en `PascalCase`, funciones y variables en `camelCase`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **Comentarios**: en inglés si son técnicos (`// Chunk the deck into 800-token overlapping windows`). En español si son comentarios de producto/negocio.
- **Idioma de la UI**: **Español como default**, con switch a inglés previsto (i18n preparado desde el día 1 con `next-intl` o similar).

---

## 5. Branding (resumen — ver `docs/BRAND.md` para detalle)

| Token | Valor | Uso |
|---|---|---|
| `brand-navy` | `#22183a` | Fondo principal, texto sobre claro |
| `brand-salmon` | `#f4a9aa` | Acento, CTAs secundarios |
| `brand-lavender` | `#f1e8f4` | Fondos suaves, cards |
| Fuente titulares | **Sora** | Headings, números grandes (rankings) |
| Fuente cuerpo | **Open Sans** | Párrafos, UI |
| Isotipo | `{ }` (llaves curly) | Siempre visible en header |

**Tono**: confiado, directo, con toque "deportivo" (usar metáforas de liga: *subir de división*, *ganar posiciones*, *clasificar*). Evitar cursilería startup tipo "unlock your potential".

---

## 6. Principios de producto (no negociables)

1. **La privacidad del deck es sagrada**. La startup controla qué es público (ranking, score, vertical) y qué es privado (contenido del deck). El deck completo **solo** lo ve el equipo Qanvit y la propia startup — nunca otro usuario del ecosistema.
2. **El feedback debe ser accionable**. No "tu deck está bien". Siempre: qué falta, qué está débil, qué referencia consultar.
3. **El ranking debe ser justificable**. Cualquier puntuación debe poder explicarse con evidencia del deck.
4. **Gamificación del ecosistema ≠ pay-to-win**. Los parques/clusters ganan acceso por contribuir (referrals, validaciones), no solo por pagar.
5. **España primero**. El sistema se diseña para el ecosistema español (verticales, idioma, referencias). Internacionalización después.

---

## 7. Cómo Claude Code debe trabajar en este repo

1. **Antes de escribir código**: leer el doc de `docs/` relevante a la tarea.
2. **Migraciones de Supabase**: siempre SQL files versionados en `supabase/migrations/`, nunca cambios manuales en el dashboard.
3. **Types de Supabase**: regenerar con `npx supabase gen types typescript` tras cada migración.
4. **Evaluador LLM**: nunca hardcodear el prompt en una ruta. Vive en `lib/evaluator/prompts/` como constantes exportadas, con versionado (`v1`, `v2`...).
5. **Tests**: Vitest para lib, Playwright para E2E críticos (upload → evaluación → ranking).
6. **Performance**: la landing y el leaderboard son públicos y deben ser estáticos o ISR. El evaluador corre asíncrono (queue + edge function).
7. **Secrets**: `.env.local` para desarrollo; Vercel env vars en producción. Nunca committear `.env*`.

---

## 8. Variables de entorno necesarias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # solo server

# Anthropic
ANTHROPIC_API_KEY=

# Embeddings (elegir uno)
OPENAI_API_KEY=                # si se usa OpenAI
VOYAGE_API_KEY=                # si se usa Voyage

# App
NEXT_PUBLIC_APP_URL=https://laliga.qanvit.com
```

---

## 9. Estado actual del proyecto

**Fase**: Scaffolding V1 (MVP completo: upload + evaluación + ranking + ecosistema + gamificación).
**Próximos hitos**:
1. Scaffolding del proyecto + Supabase connected.
2. Schema de base de datos + RLS.
3. Flujo de upload de deck + pipeline de evaluación con Claude.
4. Leaderboard público + perfil de startup.
5. Dashboard ecosistema + sistema de puntos.
6. Polish + deploy a Vercel.

---

## 10. Contacto humano

**Owner**: Arturo López Riquelme (CEO & co-founder, Qanvit).
**Tono esperado en feedback/PRs**: directo, accionable, sin relleno.
