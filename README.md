# La Liga Qanvit

> La liga nacional de startups en España. Sube tu deck, recibe feedback de expertos, y posiciónate en tu división y vertical.

**laliga.qanvit.com** — un producto de engagement de [Qanvit](https://www.qanvit.com).

---

## ¿Qué es?

La Liga Qanvit es una gran base de datos gamificada de startups españolas organizada como una liga deportiva: cada startup se auto-clasifica en una **División** (fase de madurez) y una **Vertical** (categoría sectorial), compitiendo por posiciones en el ranking nacional.

**Tres actores, tres valores:**

| Actor | Qué hace | Qué recibe |
|---|---|---|
| **Startup** | Sube su deck | Feedback estructurado + posición en la liga + visibilidad |
| **Ecosistema** (parques, clusters, asociaciones) | Descubre talento | Gamificación del acceso a datos, filtros, alertas |
| **Qanvit** | Opera la liga | Dataset vectorizado + flywheel de innovación abierta |

## Estructura de la liga

**4 Divisiones** (por fase de madurez — asignadas por el evaluador LLM):
- 🥚 **Ideation** — pre-producto, idea, MVP temprano
- 🌱 **Seed** — producto en mercado, primeros clientes, tracción inicial
- 🚀 **Growth** — modelo validado, escalando comercialmente
- 👑 **Elite** — líder de su vertical, crecimiento sostenido

**10 Verticales** (categorías temáticas):
Deeptech & AI · Robotics & Automation · Mobility · Energy & Cleantech · AgriFood · HealthTech & MedTech · Industrial & Manufacturing · Space & Aerospace · Materials & Chemistry · Cybersecurity

Cada startup ocupa **una combinación única** (p.ej. *Seed Robotics*, *Growth Mobility*) y tiene ranking dentro de esa combinación + ranking nacional cruzado.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js Route Handlers + Supabase Edge Functions
- **Base de datos**: Supabase (Postgres + pgvector)
- **Auth**: Supabase Auth (magic link + OAuth)
- **Storage**: Supabase Storage (decks en bucket privado)
- **Evaluador**: Claude API (`claude-opus-4-7` para evaluación profunda, `claude-haiku-4-5` para clasificación rápida)
- **Deploy**: Vercel (frontend) + Supabase (data plane)

## Documentación

| Archivo | Propósito |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Contexto maestro para Claude Code |
| [`docs/PRD.md`](./docs/PRD.md) | Product Requirements Document |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitectura técnica |
| [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) | Schema Supabase + RLS |
| [`docs/EVALUATOR_RUBRIC.md`](./docs/EVALUATOR_RUBRIC.md) | Rubric de evaluación (core del producto) |
| [`docs/LEAGUE_STRUCTURE.md`](./docs/LEAGUE_STRUCTURE.md) | Divisiones, verticales, ranking |
| [`docs/GAMIFICATION.md`](./docs/GAMIFICATION.md) | Sistema de puntos del ecosistema |
| [`docs/BRAND.md`](./docs/BRAND.md) | Brand guidelines Qanvit |
| [`FIRST_PROMPT.md`](./FIRST_PROMPT.md) | Primer prompt para Claude Code |

## Empezar

1. Abre este repo en VS Code.
2. Abre Claude Code (`⌘+Esc` o sidebar).
3. Copia el contenido de [`FIRST_PROMPT.md`](./FIRST_PROMPT.md) al chat de Claude Code.
4. Deja que Claude Code scaffold el proyecto siguiendo los docs.
