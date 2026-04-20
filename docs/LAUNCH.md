# Launch & Polish — La Liga Qanvit

> Doc final que cubre: automatización (pg_cron), i18n ES/EN, SEO, legal pages completas (privacidad, términos, cookies, DPA, FAQ GDPR, transparencia), observabilidad (Sentry, PostHog), deploy a `laliga.qanvit.com` y post-launch runbook.

## 1. Modelo de launch

**Soft launch público** (decidido):
- La plataforma está accesible públicamente desde el día 1.
- Sin promo activa, sin press release, sin posts virales.
- Los primeros usuarios llegan por:
  - Banner en `qanvit.com` principal.
  - Outreach manual directo a parques/clusters/asociaciones del ICP (Arturo envía 20-30 emails personalizados).
  - Invitaciones a 10-15 startups de confianza para ser "founding members" del dataset.
- Objetivo de los primeros 30 días: **100 startups reales subidas**, **10 orgs verificadas**, **0 issues críticos**.

### Criterios "go/no-go" antes de abrir el acceso público

- [ ] Legal pages publicadas y revisadas por abogado.
- [ ] DPA con Anthropic, Supabase y OpenAI firmados.
- [ ] Monitoring live: Sentry capturando errores + PostHog tracking eventos.
- [ ] Runbook de incidentes operativo (ver §9).
- [ ] Email de Resend con dominio `qanvit.com` verificado y deliverability OK.
- [ ] Pipeline probado end-to-end con 5+ decks reales de startups amigas.
- [ ] Backup policy de Supabase activada (daily snapshots).
- [ ] Rate limits validados (no es trivial DOSear el LLM pipeline).

## 2. i18n: ES primario + EN disponible

### Estrategia
- **ES como default** (siempre). `<html lang="es">` por defecto.
- **EN disponible via switch** en el footer.
- **Sin autodetect** — la gente que llegue a `laliga.qanvit.com` espera español. El switch es explícito.
- Las URLs NO tienen prefijo por locale en V1 (ej. NO `/es/liga`, NO `/en/league`). Se usa cookie `NEXT_LOCALE` para persistir elección.
- **`next-intl`** ya instalado desde Prompt #1.

### Archivos de traducción
```
messages/
├── es.json   ← completo (primario)
└── en.json   ← completo (traducido por un humano, no machine translation)
```

### Reglas
- Todo copy visible se extrae a messages. Excepción: contenido generado por LLM (feedback, summary) queda en el idioma del deck original.
- Títulos y descripciones de metadata también extraídas.
- Nombres propios (La Liga Qanvit, Ideation/Seed/Growth/Elite) no se traducen.
- Los enums (vertical codes) tienen su `label_es` y `label_en` en un mapping.

### Cobertura del EN en V1
- Landing, leaderboard, perfil público, /play onboarding, dashboard, admin, emails.
- **No se traduce**: feedback del LLM (mantiene idioma del deck), `docs/*`.

## 3. SEO

### 3.1 Metadata globals (`app/layout.tsx`)
```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://laliga.qanvit.com"),
  title: {
    default: "La Liga Qanvit · La liga de startups de España",
    template: "%s · La Liga Qanvit"
  },
  description: "Sube tu deck. Recibe feedback de expertos. Entra en la clasificación nacional de startups por División y Vertical.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    siteName: "La Liga Qanvit",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    creator: "@qanvit"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  }
};
```

### 3.2 Metadata por ruta
- `/` → default.
- `/liga` → "Leaderboard · La Liga Qanvit" + OG dinámica con top 3 actual.
- `/startup/[slug]` → nombre startup + división + vertical + OG = su carta de clasificación.
- `/admin/**` → `robots: noindex, nofollow`.
- `/dashboard/**` → `robots: noindex, nofollow`.
- `/ecosistema/**` → `robots: noindex, nofollow` (excepto `/ecosistema/aplicar`).

### 3.3 Structured data (JSON-LD)
- Landing: `Organization` + `WebSite` + `SearchAction`.
- Perfil público de startup: `Organization` con props de la startup.
- Ver `lib/seo/structured-data.ts` donde se generan los JSON-LD.

### 3.4 Sitemap (`app/sitemap.ts`)
```tsx
export default async function sitemap() {
  const supabase = createClient();
  const { data: startups } = await supabase
    .from("startups")
    .select("slug, updated_at")
    .eq("is_public", true)
    .eq("consent_public_profile", true);
  
  return [
    { url: "https://laliga.qanvit.com", lastModified: new Date(), priority: 1 },
    { url: "https://laliga.qanvit.com/liga", lastModified: new Date(), priority: 0.9 },
    { url: "https://laliga.qanvit.com/como-funciona", priority: 0.7 },
    { url: "https://laliga.qanvit.com/ecosistema/aplicar", priority: 0.6 },
    // Legal pages priority 0.3
    { url: "https://laliga.qanvit.com/legal/privacidad", priority: 0.3 },
    // ...
    // Startup profiles
    ...(startups ?? []).map(s => ({
      url: `https://laliga.qanvit.com/startup/${s.slug}`,
      lastModified: s.updated_at,
      priority: 0.5
    }))
  ];
}
```

### 3.5 robots.txt (`app/robots.ts`)
```tsx
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/api/", "/ecosistema/dashboard/"] }
    ],
    sitemap: "https://laliga.qanvit.com/sitemap.xml"
  };
}
```

## 4. Automatización con pg_cron

Ya instalado en Supabase. Jobs recurrentes necesarios:

```sql
-- Refresh metrics_summary cada hora
select cron.schedule(
  'refresh-metrics-summary',
  '0 * * * *',
  $$refresh materialized view metrics_summary$$
);

-- Refresh ecosystem_anonymous_standings cada 4 horas
select cron.schedule(
  'refresh-anon-standings',
  '0 */4 * * *',
  $$refresh materialized view ecosystem_anonymous_standings$$
);

-- Auto-completar retos cuando pasa active_ends_at (diario a las 00:30)
select cron.schedule(
  'complete-expired-challenges',
  '30 0 * * *',
  $$update challenges set status='completed' where status='active' and active_ends_at < now()$$
);

-- Limpiar data exports expirados (diario a las 03:00)
select cron.schedule(
  'cleanup-expired-exports',
  '0 3 * * *',
  $$delete from dataset_exports where expires_at < now()$$
);
-- Nota: esto no borra los archivos del bucket. Hay que usar una edge function.

-- Actualizar challenge_progress diario (00:15)
select cron.schedule(
  'update-challenge-progress',
  '15 0 * * *',
  $$select net.http_post(
    url := current_setting('app.settings.challenge_progress_updater_url'),
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.evaluator_secret'))
  )$$
);

-- Digest diario de alertas ecosistema para frequency='daily' (08:00)
select cron.schedule(
  'daily-ecosystem-digest',
  '0 8 * * *',
  $$select net.http_post(url := current_setting('app.settings.ecosystem_digest_url'), ...)$$
);

-- Digest semanal (lunes 08:00)
select cron.schedule(
  'weekly-ecosystem-digest',
  '0 8 * * 1',
  $$select net.http_post(url := current_setting('app.settings.ecosystem_digest_url'), ..., body := '{"frequency":"weekly"}')$$
);
```

## 5. Legal pages (completas)

### 5.1 Estructura
```
app/legal/
├── privacidad/page.tsx
├── terminos/page.tsx
├── cookies/page.tsx
├── aviso-legal/page.tsx
├── dpa/page.tsx
├── faq-gdpr/page.tsx
└── transparencia/page.tsx
```

### 5.2 Privacidad
Template con las siguientes secciones obligatorias:
- Responsable del tratamiento: Qanvit (FQ Source Technologies, S.L.), CIF, dirección, email.
- Datos recopilados: email, nombre, deck PDF, raw_text, embeddings, evaluation data.
- Finalidad: evaluación de startups + mejora del servicio + dataset para agentes Qanvit.
- Base legal: consentimiento explícito + interés legítimo (evaluación si la startup es cliente en futuro).
- Conservación: mientras haya cuenta + 2 años post-cierre para cumplimiento legal.
- Destinatarios: Anthropic (evaluación), OpenAI (embeddings), Supabase (hosting), Resend (email). Todos con DPA.
- Derechos: acceso, rectificación, supresión, oposición, portabilidad, retirada de consentimiento. Email `dpo@qanvit.com`.
- Transferencias internacionales: menciona que Anthropic/OpenAI tienen servidores en US, cobertura vía Standard Contractual Clauses de la UE.
- Cookies técnicas vs analíticas (link a `/legal/cookies`).

### 5.3 Términos
- Descripción del servicio.
- Obligaciones del usuario (startup): datos veraces, derechos sobre el deck, cumplimiento legal.
- Obligaciones de Qanvit: servicio best-effort, no garantía de clasificación, derecho a rechazar contenido abusivo.
- Propiedad intelectual: el deck sigue siendo de la startup. Qanvit tiene licencia no exclusiva para procesarlo dentro del consent.
- Limitación de responsabilidad.
- Jurisdicción: tribunales de Jerez de la Frontera / Cádiz.

### 5.4 Cookies
- Técnicas (necesarias): supabase auth cookie, `NEXT_LOCALE`, `qvt_ref`.
- Analíticas (opt-in): PostHog.
- Banner de consentimiento con rechazar/aceptar/personalizar.

### 5.5 Aviso legal
- Datos de la empresa: FQ Source Technologies, S.L., CIF, registro mercantil, email contacto.
- Director responsable.
- Condiciones de uso.

### 5.6 DPA (Data Processing Agreement)
Template para firmar con ecosistemas (parques/clusters) cuando traten datos de startups a través de La Liga:
- Roles: Qanvit = responsable del tratamiento; ecosystem = encargado cuando exporte datos.
- Instrucciones del responsable.
- Confidencialidad.
- Medidas de seguridad.
- Subencargados (lista: Supabase, Resend, Anthropic, OpenAI).
- Derechos de los interesados.
- Notificación de brechas.
- Devolución/eliminación al terminar.
- Auditoría.

Publicado como PDF en `public/legal/dpa.pdf` + página `/legal/dpa` con resumen y link de descarga.

### 5.7 FAQ GDPR
Preguntas esperables:
- ¿Dónde están mis datos físicamente?
- ¿Quién puede ver mi deck?
- ¿Puedo borrar mis datos?
- ¿Qué pasa con mis datos si cierras Qanvit?
- ¿Cómo se usa mi deck para entrenar modelos? (Respuesta: NO se usa para entrenar modelos externos. Solo se procesa.)
- ¿Puedo obtener una copia completa de mis datos?
- ¿Cómo contactar al DPO?

### 5.8 Transparencia
Página pública que explica qué es Qanvit, qué es La Liga, quién está detrás, cómo se usan los datos. Tono abierto, sin corporate-speak.
- Quiénes somos (Arturo + David + equipo).
- Por qué hacemos esto.
- Cómo se usan los datos (en detalle, con diagrama).
- Qué modelos LLM usamos y por qué.
- Métricas públicas: N startups, N orgs, coste medio por evaluación, latencia media. **Actualizado en tiempo real desde metrics_summary** (pública, sin PII).
- Commitments: no vender datos, no entrenar modelos con decks, eliminar a petición.

## 6. Observabilidad

### 6.1 Sentry
- Instalar `@sentry/nextjs`.
- Configurar `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- Capturar errores en:
  - React error boundaries.
  - API routes (wrap con try/catch + `Sentry.captureException`).
  - Edge functions (Deno — usar SDK compatible o llamada HTTP directa a Sentry ingest).
- Alertas configuradas: error rate >5% en 15min, cualquier error en pipeline LLM.

### 6.2 PostHog
- Instalar `posthog-js` y `posthog-node`.
- Eventos tracking:
  - `landing_view`, `play_start`, `deck_uploaded`, `evaluation_completed`,
    `evaluation_error`, `leaderboard_view`, `startup_profile_view`,
    `share_card_click`, `share_card_download`,
    `ecosystem_application_submit`, `ecosystem_tier_unlocked`,
    `challenge_proposed`, `challenge_voted`, `feedback_validated`,
    `admin_action` (con payload).
- Funnels pre-configurados para las métricas del dashboard admin.
- Cohorts para retention de startups.

### 6.3 Logs estructurados
- Edge functions ya loguean JSON structured (Prompt #2+).
- Next.js server-side: usa `pino` en prod (menor overhead que console.log).

## 7. Deploy a Vercel + dominio

### 7.1 Vercel project
1. Crear proyecto Vercel conectado al repo GitHub.
2. Environment variables (production): todas las de `.env.example` pero con valores de Supabase cloud, Anthropic, OpenAI, Resend prod.
3. Build command: `npm run build`.
4. Output: Next.js default.
5. Regions: Frankfurt (fra1) — proximidad al ecosistema español y Supabase EU.

### 7.2 Dominio
- En Vercel → Domains → Add `laliga.qanvit.com`.
- En el DNS provider de `qanvit.com`: CNAME `laliga` → `cname.vercel-dns.com`.
- Tarda 10-30min en propagar + SSL auto.

### 7.3 Banner en `qanvit.com`
- Añadir banner en el header de `qanvit.com` (Lovable):
  - Texto: `La Liga Qanvit está abierta. Ficha tu startup.`
  - CTA: botón a `https://laliga.qanvit.com`.
  - Dismissable con cookie.
- **Sticky** en desktop, sólo en home en mobile.

### 7.4 Checklist pre-launch

- [ ] `laliga.qanvit.com` resuelve y sirve SSL válido.
- [ ] Todas las env vars en Vercel production.
- [ ] Supabase production: RLS verificado, buckets privados, backups ON.
- [ ] Edge functions deployadas a producción: `evaluator-pipeline`, `alert-dispatcher`, `ecosystem-alert-dispatcher`, `dataset-exporter`.
- [ ] Runtime values seteados en prod DB (evaluator_url, alert_dispatcher_url, etc.).
- [ ] Resend verificado para dominio `qanvit.com`.
- [ ] Sentry con DSN en env + test error captured.
- [ ] PostHog con API key en env + test event captured.
- [ ] Legal pages publicadas y linkadas desde footer.
- [ ] Favicon + `og-default.png` custom.
- [ ] Cookie banner funcional.
- [ ] Sitemap + robots.txt accesibles.
- [ ] i18n ES funcional, EN funcional, switch persistente.
- [ ] Banner en `qanvit.com` live.
- [ ] Google Search Console: sitemap enviado.
- [ ] Smoke test con 3 startups reales (Arturo + 2 invitados).
- [ ] Smoke test con 1 org real (parque científico invitado).

## 8. Post-launch runbook

### 8.1 Monitoring diario
- **Cada mañana**: admin review 5 minutos.
  - `/admin` → cola de pendientes.
  - Sentry → errores últimas 24h.
  - PostHog → funnel de activación últimas 24h.
  - Supabase → coste, latencia DB.

### 8.2 Alertas Slack (opcional V1, recomendado)
Webhook de Slack configurado para:
- Nueva aplicación de ecosistema.
- Pipeline error rate > 10% en 15min.
- Coste LLM 24h > 2× media.
- Nueva startup top 10 nacional (celebración).

### 8.3 Runbook de incidentes

| Síntoma | Causa probable | Acción |
|---|---|---|
| Pipeline 100% fail | ANTHROPIC_API_KEY expirada, Anthropic down, schema mismatch | Verificar key, status.anthropic.com, revisar migrations |
| OpenAI embeddings fallando | Key o rate limit | Verificar consola OpenAI, subir rate limit si aplica |
| Supabase lento | Connection pool, query sin index | Verificar query plan, añadir index, escalar compute |
| Decks > 20MB siendo rechazados pero son legítimos | Subir límite o comprimir server-side | V1.5: implementar PDF optimizer |
| Usuarios reportan que el email no llega | Resend deliverability issue | Verificar SPF/DKIM/DMARC, revisar Resend dashboard |
| Leaderboard desactualizado | Vista materializada no refrescada | `refresh materialized view league_standings` manual, revisar pg_cron |
| Coste LLM runaway | Un usuario subiendo decks en loop | Rate limit + flag cuenta en admin |

### 8.4 Rollback
- Vercel tiene deploys instantáneos y rollback con un click desde el dashboard.
- Si hay issue de migration: no hay rollback automático — aplicar migration compensatoria.
- **Importante**: probar migrations en staging antes de prod.

## 9. Métricas de éxito de launch

### Semana 1
- 20+ startups subidas.
- 0 incidentes críticos.
- 5+ orgs ecosistema aplicando.

### Mes 1
- 100+ startups.
- 10+ orgs verificadas.
- Error rate pipeline <5%.
- Coste LLM < $500.

### Mes 3
- 500+ startups.
- 30+ orgs verificadas.
- Primer retorno del dataset al agente Structuring de Qanvit (KPI crítico del flywheel).
- 3+ retos del mes completados con premios distribuidos.

### Mes 6
- 2000+ startups.
- Primer partnership formal con un parque/asociación grande (APTE, un cluster nacional).
- Evaluar moving a V2 (API pública, dashboard embebible, matchmaking activo).
