# FIRST_PROMPT.md — Primer prompt para Claude Code

> Copia y pega el contenido **entre los separadores** en el chat de Claude Code. Es el primero de una serie de ~5-6 prompts que llevarán el proyecto del vacío a un MVP funcional. No intentes hacerlo todo en un solo prompt.

---

## Prompt #1 — Scaffolding + base de datos + rutas mínimas

```
Eres el ingeniero principal de La Liga Qanvit. Antes de hacer NADA, lee con atención estos archivos en este orden exacto y dime en 5 bullets qué has entendido del proyecto:

1. CLAUDE.md
2. README.md
3. docs/PRD.md
4. docs/ARCHITECTURE.md
5. docs/DATA_MODEL.md
6. docs/LEAGUE_STRUCTURE.md
7. docs/EVALUATOR_RUBRIC.md
8. docs/GAMIFICATION.md
9. docs/BRAND.md

Después, sin pedirme permiso, ejecuta el SCAFFOLDING inicial siguiendo estos pasos en orden. Ante cualquier duda arquitectónica, decide tú y documenta la decisión en un comentario — iteraremos.

══════════════════════════════════════════════════════
FASE 1 — Setup del proyecto Next.js
══════════════════════════════════════════════════════

1. Inicializa un proyecto Next.js 14 con App Router:
   - TypeScript estricto
   - Tailwind CSS
   - ESLint
   - App directory
   - src/ directory = NO (mantén `app/` y `lib/` en raíz según CLAUDE.md)
   - Import alias: `@/*`

2. Instala dependencias base:
   - @anthropic-ai/sdk
   - @supabase/supabase-js
   - @supabase/ssr
   - zod
   - clsx tailwind-merge
   - lucide-react
   - next-intl
   - nuqs

3. Configura shadcn/ui:
   - npx shadcn@latest init con los tokens del brand book.
   - Instala los componentes: button, card, input, label, select, dialog, dropdown-menu, table, tabs, toast, badge, avatar, separator, sheet, tooltip, progress.

4. Configura Tailwind con los tokens de docs/BRAND.md:
   - Aplica el snippet completo de la sección 10 en tailwind.config.ts.
   - Carga Sora, Open Sans y JetBrains Mono vía next/font en app/layout.tsx.
   - Define CSS variables en globals.css para shadcn theming.

5. Crea la estructura de carpetas exactamente como CLAUDE.md sección 3 indica:
   app/(public), app/(startup), app/(ecosystem), app/(admin), app/api,
   components/ui, components/league, components/branding,
   lib/supabase, lib/claude, lib/evaluator, lib/embeddings, lib/league,
   supabase/migrations, supabase/functions.

══════════════════════════════════════════════════════
FASE 2 — Supabase
══════════════════════════════════════════════════════

6. Crea lib/supabase/server.ts y lib/supabase/client.ts siguiendo el patrón oficial de @supabase/ssr para Next.js App Router.

7. Crea supabase/migrations/0001_extensions.sql con las extensiones de docs/DATA_MODEL.md sección 1.

8. Crea supabase/migrations/0002_enums.sql con TODOS los enums de docs/DATA_MODEL.md sección 2.

9. Crea supabase/migrations/0003_tables.sql con TODAS las tablas de docs/DATA_MODEL.md sección 3 (profiles, startups, decks, deck_chunks, evaluations, ecosystem_organizations, ecosystem_points_log, feedback_validations, deck_access_log, evaluation_appeals).

10. Crea supabase/migrations/0004_views.sql con:
    - la vista materializada league_standings (sección 3.6)
    - la vista ecosystem_totals (sección 3.9)
    - la vista public_evaluations (sección 4, al final)

11. Crea supabase/migrations/0005_rls.sql con TODAS las policies de docs/DATA_MODEL.md sección 4.

12. Crea supabase/migrations/0006_triggers.sql con los triggers de docs/DATA_MODEL.md sección 5 (handle_new_user, set_updated_at, sync_startup_current_eval). DEJA trigger_evaluator_pipeline comentado con TODO — lo habilitamos en el siguiente prompt cuando tengamos la edge function.

13. Crea un README.md dentro de supabase/ con comandos útiles: supabase start, supabase db reset, supabase gen types.

══════════════════════════════════════════════════════
FASE 3 — Rutas mínimas (placeholders con branding aplicado)
══════════════════════════════════════════════════════

14. app/layout.tsx:
    - Aplicar fuentes Sora, Open Sans, JetBrains Mono.
    - lang="es".
    - Metadata con title "La Liga Qanvit" y description copy del brand.
    - <Header /> + <Footer /> globales.

15. components/branding/Header.tsx:
    - Logo `{ }` en brand-salmon sobre fondo navy (o navy sobre claro).
    - Wordmark "La Liga Qanvit" en Sora 600.
    - Nav: Liga · Divisiones · Verticales · Ficha tu startup · Ecosistema.

16. components/branding/Footer.tsx:
    - Copyright Qanvit {new Date().getFullYear()}.
    - Enlaces legales: Privacidad, Términos, Consentimiento GDPR.
    - Link a qanvit.com.

17. app/(public)/page.tsx — landing stub:
    - Hero: título grande "La liga de startups de España." con subtítulo "Sube tu deck. Recibe feedback. Entra en la clasificación."
    - CTA primary: "Ficha tu startup" → /play
    - CTA secondary: "Soy un parque, cluster o asociación" → /ecosistema/aplicar
    - Sección "Cómo funciona" con 3 pasos.
    - Sección "Leaderboard en vivo" con skeleton (aún sin datos).
    - Usa Sora para títulos grandes, Open Sans para cuerpo.

18. app/(public)/liga/page.tsx — leaderboard público:
    - Tabla básica con columnas: rank, logo, nombre, División, Vertical, score.
    - Datos: lee de la vista league_standings vía el cliente Supabase server.
    - Placeholder "{ la liga está empezando }" si no hay datos.

19. app/(public)/startup/[slug]/page.tsx — perfil público de startup:
    - Stub que lee startup por slug.
    - Muestra logo, nombre, one-liner, División, Vertical, score, ranking.
    - Si is_public=false → 404.

20. app/play/page.tsx — flujo onboarding de la startup:
    - Solo stub con 3 pasos visuales (aún sin lógica).
    - Paso 1: datos básicos form (name, website, one-liner).
    - Paso 2: upload deck (input file, aún no procesa).
    - Paso 3: consent checkboxes.
    - Botón final "Ficharme en la liga" (dummy).

21. app/(ecosystem)/ecosistema/aplicar/page.tsx — form de aplicación del ecosistema:
    - Nombre, tipo (select), web, descripción, email institucional.
    - Submit crea registro en ecosystem_organizations con is_verified=false.

══════════════════════════════════════════════════════
FASE 4 — Claude SDK wrapper (stub)
══════════════════════════════════════════════════════

22. lib/claude/client.ts:
    - Exporta un cliente singleton de Anthropic SDK.
    - Lee ANTHROPIC_API_KEY de env.

23. lib/claude/models.ts:
    - Exporta constantes:
      - CLASSIFIER_MODEL = "claude-haiku-4-5-20251001"
      - EVALUATOR_MODEL = "claude-opus-4-7"

24. lib/claude/prompts/classifier_v1.ts y lib/claude/prompts/evaluator_v1.ts:
    - Copia los prompts de docs/EVALUATOR_RUBRIC.md sección 6 como constantes exportadas.

25. lib/evaluator/schemas.ts:
    - Copia los Zod schemas de docs/EVALUATOR_RUBRIC.md sección 7 (ClassificationResultSchema, EvaluationResultSchema).

26. lib/evaluator/weights.ts:
    - Exporta el objeto DIVISION_WEIGHTS con los pesos de docs/EVALUATOR_RUBRIC.md sección 4.

══════════════════════════════════════════════════════
FASE 5 — Env y documentación de arranque
══════════════════════════════════════════════════════

27. .env.example con las variables de CLAUDE.md sección 8.

28. .gitignore estándar Next.js + .env*.

29. Actualiza README.md del proyecto con instrucciones claras para levantar el entorno local:
    - npm install
    - cp .env.example .env.local (rellenar manualmente)
    - npx supabase start
    - npx supabase db reset (aplica migrations)
    - npx supabase gen types typescript --local > lib/supabase/types.ts
    - npm run dev

══════════════════════════════════════════════════════
ENTREGABLE FINAL DE ESTE PROMPT
══════════════════════════════════════════════════════

Al terminar, ejecuta `npm run dev` mentalmente y dime:
- ¿Compila sin errores?
- ¿Qué rutas funcionan?
- ¿Qué migrations están listas para aplicar?
- ¿Qué has dejado como TODO para prompts siguientes?

NO implementes aún:
- El pipeline de evaluación (extracción PDF, embeddings, llamadas a Claude). Es el prompt #2.
- El dashboard de startup autenticada con data real. Es el prompt #3.
- El dashboard de ecosistema con data real. Es el prompt #4.
- El panel admin. Es el prompt #5.

Si encuentras algo en los docs que es ambiguo o contradictorio, enumera las dudas al final de tu respuesta antes de ejecutar. En caso contrario, ejecuta.
```

---

## Prompts siguientes (resumen — los expandimos uno a uno)

- **Prompt #2** — Pipeline de evaluación: upload PDF → extract → chunk + embed → classifier → evaluator → persistencia → refresh ranking.
- **Prompt #3** — Dashboard startup autenticada: ver evaluaciones, timeline, re-subir deck tras 7 días, carta de clasificación compartible (@vercel/og).
- **Prompt #4** — Dashboard ecosistema: filtros avanzados, puntos en vivo, referral code, alertas por email.
- **Prompt #5** — Panel admin: cola de decks en error, aprobación de organizaciones, override manual de División/Vertical, métricas globales.
- **Prompt #6** — Polish y deploy: i18n, OG images, seo, sitemap, legal pages, Vercel config, dominio `laliga.qanvit.com`.

Cuando termines el Prompt #1, pídeme el Prompt #2 y te lo paso.
