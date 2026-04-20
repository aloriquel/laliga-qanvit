# RUNBOOK — La Liga Qanvit

> Guía operacional post-launch. Para setup inicial ver README.md.

---

## 1. Monitoring diario (5 minutos cada mañana)

1. `/admin` → revisar cola de pendientes (solicitudes eco, errores de deck, impugnaciones).
2. [Sentry](https://sentry.io) → errores últimas 24h. Meta: 0 issues críticos.
3. [PostHog](https://eu.posthog.com) → funnel activación del día (play_start → deck_uploaded → evaluation_completed).
4. [Supabase Dashboard](https://supabase.com/dashboard) → coste y latencia DB.

---

## 2. Runbook de incidentes

| Síntoma | Causa probable | Acción |
|---|---|---|
| Pipeline 100% fallando | ANTHROPIC_API_KEY expirada / Anthropic down | Verificar key en Vercel env. Ver status.anthropic.com. |
| OpenAI embeddings fallando | Key expirada / rate limit | Verificar consola OpenAI. Subir rate limit si aplica. |
| Supabase lento o sin conexión | Connection pool agotado, query sin index | Ver query plan en Supabase Studio. Revisar índices. |
| Leaderboard desactualizado | Vista materializada no refrescada | Ejecutar manualmente: `REFRESH MATERIALIZED VIEW CONCURRENTLY league_standings` |
| pg_cron jobs no se ejecutan | `app.settings.xxx` no seteados / pg_cron no habilitado | Verificar: `SELECT * FROM cron.job` en Supabase SQL Editor |
| Emails no llegan | Resend deliverability / SPF/DKIM | Revisar dashboard Resend. Verificar registros DNS qanvit.com |
| Usuario informa error en evaluación | Pipeline error, schema mismatch | Ver `deck_errors` en `/admin`. Revisar logs edge function. |
| Coste LLM runaway | Usuario subiendo decks en loop | Rate limit en admin → Startups. Flag y revoke si abuso. |

---

## 3. Operaciones frecuentes

### Aprobar organización del ecosistema
1. `/admin/ecosystem-applications` → revisar solicitud → Aprobar.
2. El email de aprobación se envía automáticamente.

### Override manual de evaluación
1. `/admin/evaluations` → buscar startup → Override score.
2. Registrar razón (queda en audit log).

### Aceptar impugnación
1. `/admin/evaluation-appeals` → revisar → Aceptar/Rechazar.
2. Si se acepta, se activa rerun del pipeline.

### Exportar dataset
1. `/admin/data-export` → configurar filtros → Generar.
2. Archivo JSON disponible en bucket `exports` durante 30 días.

### Forzar refresh de métricas
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY league_standings;
REFRESH MATERIALIZED VIEW CONCURRENTLY ecosystem_anonymous_standings;
```

### Distribuir premios de un reto
1. `/admin/challenges` → tab Completed → acción "Distribuir premios".
2. Se aplica `prize_structure` al top 3 de `challenge_progress`.

---

## 4. Rollback

- **Frontend**: Vercel dashboard → Deployments → seleccionar deploy anterior → Redeploy.
- **Migration fallida**: no hay rollback automático. Crear migration compensatoria.
- **Edge function fallida**: `npx supabase functions deploy [nombre] --project-ref ongwrbdypbusnwlclqjg --no-verify-jwt`

---

## 5. Deploy de una nueva versión

```bash
# 1. Pre-deploy checks
npx ts-node scripts/pre-deploy-check.ts

# 2. Build local (con las mismas envs que Vercel)
npm run build

# 3. Push a main → Vercel deploya automáticamente
git push origin main

# 4. Si hay nuevas migrations, aplicar en Supabase SQL Editor
# (ver supabase/migrations/XXXX_*.sql)

# 5. Si hay nuevas edge functions:
npx supabase functions deploy [nombre] --project-ref ongwrbdypbusnwlclqjg --no-verify-jwt
```

---

## 6. Checklist pre-launch

- [ ] `laliga.qanvit.com` resuelve SSL válido
- [ ] Todas las env vars configuradas en Vercel production
- [ ] Supabase: RLS verificado, buckets privados, backups ON
- [ ] Edge functions deployadas: `evaluator-pipeline`, `alert-dispatcher`, `ecosystem-alert-dispatcher`, `dataset-exporter`, `challenge-progress-updater`, `ecosystem-digest-sender`, `exports-file-cleanup`
- [ ] `app.settings` seteados en DB (evaluator_url, evaluator_secret, challenge_progress_updater_url, ecosystem_digest_url, exports_cleanup_url)
- [ ] Resend verificado para dominio `qanvit.com` (SPF + DKIM + DMARC)
- [ ] Sentry: DSN en env, test error capturado
- [ ] PostHog: API key en env, test event capturado
- [ ] Legal pages publicadas y revisadas por abogado
- [ ] Cookie banner funcional (test en incógnito)
- [ ] Sitemap accesible en `/sitemap.xml`
- [ ] robots.txt accesible en `/robots.txt`
- [ ] i18n: ES funcional, EN funcional, switch persistente en cookie
- [ ] Banner en qanvit.com apuntando a laliga.qanvit.com
- [ ] Smoke test: subir 3 decks reales y verificar evaluación end-to-end
- [ ] Smoke test: 1 org ecosistema aplicando y siendo aprobada
- [ ] Google Search Console: sitemap enviado

---

## 7. Accesos y credenciales

| Recurso | Dónde está |
|---|---|
| Supabase Dashboard | supabase.com/dashboard — org Qanvit |
| Vercel | vercel.com — org Qanvit |
| Anthropic API | console.anthropic.com |
| OpenAI API | platform.openai.com |
| Resend | resend.com — workspace Qanvit |
| Sentry | sentry.io — org Qanvit |
| PostHog | eu.posthog.com — org Qanvit |

---

## 8. Contacto de emergencia

**Arturo López Riquelme** — CEO & co-founder  
Email: arturo@qanvit.com  
Para incidentes críticos de datos/seguridad: dpo@qanvit.com
