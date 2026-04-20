# Admin — Panel de operación y control de La Liga Qanvit

> Complementa todos los docs anteriores. Aquí se documenta el panel que tú (Arturo, super admin) usas para operar la liga en el día a día: aprobación de orgs, moderación de retos, overrides de clasificación, distribución de premios, métricas globales con cohortes y costes LLM, y export del dataset para alimentar los otros agentes de Qanvit (Structuring → Discovering → Coordinating).

## 1. Filosofía del panel admin

1. **El admin hace lo que la automatización no puede**: aprobar humanos, corregir LLMs que se equivocan, tomar decisiones legales/editoriales, exportar datos con consentimiento.
2. **Todo override deja rastro**. Cualquier cambio manual (override de División, reasignación de puntos, unban de startup) queda logueado con autor, fecha, razón. Auditable.
3. **Super admin único en V1**. `profiles.role = 'admin'` es binario. En V2 (cuando contrates equipo) habrá roles granulares: `moderator` (aprueba orgs/retos), `analyst` (solo lectura métricas), `data_officer` (exports). Por ahora, cualquier cambio de rol lo hace un admin directamente en SQL.
4. **Las métricas son la operación**. El dashboard de métricas no es adorno: es donde detectas si la liga crece, si las costes LLM están fuera de control, o si una vertical está muerta.
5. **El export es el flywheel de Qanvit**. Lo que alimenta a los otros agentes. Se hace con consent de la startup siempre (implícito por `consent_internal_use=true`).

## 2. Rutas del panel admin

Todas bajo `/admin/**`, protegidas por middleware que verifica `profiles.role = 'admin'`.

```
/admin                                ← home con métricas clave y cola de pendientes
/admin/ecosystem-applications         ← orgs esperando aprobación
/admin/ecosystem-organizations        ← todas las orgs verificadas (edit, revoke, adjust points)
/admin/deck-errors                    ← ya existe (Prompt #2)
/admin/evaluations                    ← todas las evaluations (override div/vert, re-run, delete)
/admin/evaluation-appeals             ← impugnaciones de startups, aceptar/rechazar
/admin/challenges                     ← ya existe parcialmente (Prompt #4). Extender con:
                                        aprobar draft → voting, activar voting → active,
                                        distribuir premios al completar
/admin/startups                       ← buscador de startups con acciones admin
/admin/metrics                        ← dashboard de métricas globales con cohortes + LLM costs
/admin/audit-log                      ← log de todas las acciones admin
/admin/data-export                    ← export JSON completo del dataset
/admin/settings                       ← umbrales, configuración global
```

## 3. Home del admin (`/admin`)

Dashboard de entrada con 4 secciones:

1. **Cola de pendientes** (actionable):
   - N ecosystem applications a aprobar.
   - N deck errors.
   - N evaluation appeals.
   - N challenges en draft (a aprobar) o en voting con 5+ likes (a activar).
   - Cada ítem con CTA "Revisar" que lleva a la ruta correspondiente.

2. **Salud de la liga** (pulso rápido):
   - Startups totales con score.
   - Orgs verificadas.
   - Decks procesados últimos 7 días.
   - % éxito del pipeline (evaluated / (evaluated + error)).
   - Coste LLM estimado últimos 7 días.

3. **Alertas operativas**:
   - Si error_rate > 10% → warning.
   - Si coste LLM 7d > 2× media histórica → warning.
   - Si verticals con <3 startups → sugerencia de reto para impulsar.

4. **Actividad reciente**: feed con las últimas 20 acciones admin (del audit log).

## 4. Aprobación de ecosystem organizations (`/admin/ecosystem-applications`)

Lista de `ecosystem_organizations WHERE is_verified = false` ordenadas por fecha asc.

Por cada aplicación:
- Nombre, tipo, web, descripción, email del owner, fecha aplicación.
- Botón "Aprobar" → UPDATE is_verified=true, verified_at, verified_by. Dispara email de bienvenida via Resend con código de referral.
- Botón "Rechazar" → abre modal para escribir razón → UPDATE con notas admin + email al owner con la razón.
- Botón "Pedir más info" → email al owner con textarea personalizado.

Todas las acciones crean entrada en `admin_audit_log`.

## 5. Evaluations admin (`/admin/evaluations`)

Tabla filtrable de todas las evaluations (filtros: division, vertical, startup, score_range, model_used, degraded_mode).

Acciones por fila:
- **Override clasificación**: modal con selects de División y Vertical → UPDATE evaluations + UPDATE startups.current_* + refresh league_standings. Guarda razón obligatoria.
- **Re-run pipeline**: UPDATE decks SET status='pending' → trigger re-dispara pipeline.
- **Marcar como sample de calibración**: flag `is_calibration_sample` (nuevo campo) → se usa para el "golden set" de validación cuando cambian prompts.
- **Delete evaluation**: hard delete con confirmación (doble confirm). Razón obligatoria. No borra el deck ni los chunks.

Vista detalle de evaluation muestra todos los campos, feedback jsonb completo, metadata del modelo, tokens, coste, y un botón "Ver deck original" que abre signed URL del storage (15min).

Todas las acciones → audit_log.

## 6. Evaluation appeals (`/admin/evaluation-appeals`)

Lista de `evaluation_appeals WHERE status = 'pending'`. Por cada:
- Info de la evaluación original.
- Lo que la startup pide (reason, requested_division, requested_vertical).
- Acciones:
  - **Aceptar con override**: aplica override → resolve con accepted.
  - **Aceptar con re-run**: UPDATE deck SET status='pending' → pipeline re-evalúa con prompt actualizado.
  - **Rechazar**: UPDATE status='rejected' + resolution_notes + email a la startup.

## 7. Challenges admin (`/admin/challenges`)

Ya existe parcialmente desde Prompt #4. Completar:
- **Tab "Drafts"**: retos proposed, botón "Aprobar para votación" → UPDATE status='voting'.
- **Tab "En votación"**: retos con likes, botón "Activar" cuando ready.
- **Tab "Activos"**: retos corriendo, ver progreso por org, botón "Cancelar" de emergencia.
- **Tab "Completados"**: retos finalizados. Botón **"Distribuir premios"**:
  - Muestra modal con top N orgs según `challenge_progress` ordenado desc.
  - Aplica `prize_structure` (1º: X pts, 2º: Y, 3º: Z).
  - Al confirmar: INSERT en ecosystem_points_log para cada ganador + UPDATE challenge status.
  - Envía email a cada ganador.

## 8. Startups admin (`/admin/startups`)

Buscador + acciones operativas:
- Ver todas las startups (incluye is_public=false y unverified).
- Filtros: division, vertical, region, consent_public, account_status.
- Acciones por startup:
  - **Forzar reclasificación**: UPDATE deck SET status='pending'.
  - **Ocultar del leaderboard**: UPDATE is_public=false + razón.
  - **Restaurar visibilidad**: UPDATE is_public=true.
  - **Marcar como verified** (badge blue): flag `is_verified_startup` para startups que aportan credibilidad (si decides añadirlo — TODO V1.5, dejar botón disabled).
  - **Ver historial completo**: todas las evaluations + appeals + access logs + contact_requests.

## 9. Metrics globales (`/admin/metrics`)

Dashboard con 3 tabs:

### 9.1 Overview (básicas)

**KPIs top** (grandes, en cards):
- Startups en la liga (total con score válido).
- Orgs verificadas.
- Decks procesados total.
- % éxito pipeline (7d y 30d).

**Distribución**:
- Pie chart: startups por División.
- Pie chart: startups por Vertical.
- Heatmap División × Vertical (ver 9.2).

**Funnel de activación startup**:
- Visitantes landing → signups → deck subido → deck evaluado → consent público.
- Conversion rate entre cada paso.

**Funnel de activación ecosystem**:
- Aplicación enviada → aprobada → primera acción de puntos → tier Pro → tier Elite.

### 9.2 Cohortes + tendencias

**Retention de startups**:
- Cohortes semanales (startups que subieron primer deck esa semana).
- Retention de re-subida (W1, W4, W8, W12): % que vuelve a subir deck.
- Visualización: tabla cohort heatmap estilo Amplitude.

**Growth MoM**:
- Línea con startups nuevas por semana.
- Línea con decks evaluados por semana.
- Línea con orgs activas (al menos 1 punto generado).

**Heatmap División × Vertical**:
- Grid 4×10 con conteo de startups en cada celda.
- Color intensidad según densidad.
- Identifica zonas "desérticas" (ej. "Elite Space" vacío → oportunidad de challenge dirigido).

**Distribución de scores**:
- Histograma de scores (0-100 en bins de 5).
- Media + mediana marcadas.
- Si la media drifta >10 puntos vs histórico → warning.

### 9.3 LLM costs & pipeline health

**Coste acumulado**:
- Coste total desde el launch.
- Coste últimos 30 días.
- Proyección mensual basada en trend últimos 7 días.

**Breakdown**:
- Bar chart: coste por modelo (Opus vs Haiku vs embeddings).
- Bar chart: tokens in/out por modelo.
- Coste medio por evaluación.
- Evaluaciones en degraded_mode (% y absoluto).

**Latencia**:
- Distribución de latency_ms del pipeline (p50, p90, p99).
- Alert si p90 > 90s en últimos 7 días.

**Forecast**:
- Si la tendencia continúa a ritmo actual, coste próximo mes.
- Si el ritmo crece 2× o 3×, coste proyectado.
- Umbral configurable: warning si forecast > budget configurado en `/admin/settings`.

## 10. Audit log (`/admin/audit-log`)

Tabla append-only de todas las acciones admin. Filtros: fecha, admin (user), action_type, target.

Campos:
- created_at, admin_id (profile), action_type, target_type, target_id, payload (jsonb con antes/después).

Nunca se borra. Exportable a CSV.

## 11. Data export (`/admin/data-export`)

El punto que conecta La Liga Qanvit con los otros agentes Qanvit.

**UI simple**:
- Dropdown "Scope":
  - Full dump: TODO el dataset con consent_internal_use=true.
  - Por vertical.
  - Por rango de fechas.
- Botón "Generar export JSON".
- Lista de exports previos (fecha, scope, admin, filename, size).

**Formato JSON generado**:
```json
{
  "export_metadata": {
    "exported_at": "2026-04-20T12:00:00Z",
    "exported_by_admin_id": "uuid",
    "scope": "full",
    "filters": {},
    "record_count": 1234,
    "pipeline_versions": ["v1"]
  },
  "startups": [
    {
      "id": "uuid",
      "slug": "demo-robotics",
      "name": "Demo Robotics",
      "one_liner": "...",
      "location_region": "Andalucía",
      "consent_internal_use": true,
      "current_division": "seed",
      "current_vertical": "robotics_automation",
      "current_score": 72.5,
      "created_at": "...",
      "evaluations": [
        {
          "id": "uuid",
          "scores": { ... },
          "feedback": { ... },
          "summary": "...",
          "next_actions": [...],
          "metadata": {
            "model": "claude-opus-4-7",
            "prompt_version": "v1",
            "rubric_version": "v1",
            "tokens_in": 15000,
            "tokens_out": 3000,
            "cost_usd": 0.51
          }
        }
      ],
      "decks": [
        {
          "id": "uuid",
          "version": 1,
          "language": "es",
          "page_count": 15,
          "raw_text": "... (full extraction)",
          "chunks": [
            {
              "index": 0,
              "content": "...",
              "token_count": 800,
              "embedding": [0.123, -0.456, ...]  // 1536 floats
            }
          ]
        }
      ]
    }
  ]
}
```

**Reglas**:
- Solo incluir startups con `consent_internal_use = true`.
- Excluir PII directo: no se exporta email del founder, ni owner_id.
- El export se guarda en Storage bucket `exports` (privado, solo admin) con retention de 30 días.
- Entrada en `admin_audit_log` con detalle de qué se exportó.
- Archivos grandes se generan vía Supabase Edge Function async (`dataset-exporter`), no en la request HTTP (evita timeout).

**Consumo**:
- Los otros agentes de Qanvit (Structuring, Discovering, Coordinating) leerán estos exports periódicamente vía signed URL + ingestion pipeline propio. No exponemos el export como API pública en V1.

## 12. Settings globales (`/admin/settings`)

Key-value editable para configuración crítica. Tabla `admin_settings`:

```sql
create table admin_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);
```

**Keys iniciales**:
- `llm_budget_monthly_usd`: presupuesto mensual (default 500) — warning si forecast supera.
- `pipeline_error_threshold_pct`: umbral de alerta de errores (default 10).
- `challenge_min_votes`: votos mínimos para activar reto (default 5).
- `referral_cookie_days`: duración cookie referral (default 180).
- `deck_cooldown_days`: días entre re-subidas (default 7).
- `rate_limit_upload_per_hour`: cap de uploads por hora por usuario (default 2).

## 13. Data model nuevo o extendido

### 13.1 `admin_audit_log`

```sql
create type admin_action_type as enum (
  'org_approved',
  'org_rejected',
  'org_info_requested',
  'org_revoked',
  'org_points_adjusted',
  'evaluation_overridden',
  'evaluation_rerun',
  'evaluation_deleted',
  'evaluation_calibration_flagged',
  'appeal_accepted_override',
  'appeal_accepted_rerun',
  'appeal_rejected',
  'startup_hidden',
  'startup_restored',
  'startup_rerun_forced',
  'challenge_approved_voting',
  'challenge_activated',
  'challenge_cancelled',
  'challenge_prizes_distributed',
  'dataset_exported',
  'setting_updated'
);

create table admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references profiles(id),
  action_type admin_action_type not null,
  target_type text not null,
  target_id uuid,
  payload jsonb not null default '{}',
  reason text,
  created_at timestamptz not null default now()
);

create index idx_audit_log_admin on admin_audit_log(admin_id);
create index idx_audit_log_created on admin_audit_log(created_at desc);
create index idx_audit_log_type on admin_audit_log(action_type);
```

### 13.2 `admin_settings` (ver §12)

### 13.3 `dataset_exports`

```sql
create table dataset_exports (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references profiles(id),
  scope text not null,                    -- 'full' | 'vertical' | 'date_range'
  filters jsonb default '{}',
  record_count int,
  file_size_bytes int,
  storage_path text,                      -- 'exports/{id}.json'
  status text not null default 'pending', -- 'pending' | 'generating' | 'completed' | 'error'
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz                  -- retention 30 días
);
```

### 13.4 Extensiones a tablas existentes

```sql
-- marcar evaluaciones como sample de calibración para el golden set
alter table evaluations add column is_calibration_sample boolean not null default false;

-- cost_estimate_usd y latency_ms ya existen desde Prompt #2
-- si falta algún campo, añadir aquí
```

### 13.5 RLS de las nuevas tablas

```sql
-- admin_audit_log: solo admin
alter table admin_audit_log enable row level security;
create policy "audit_admin_all" on admin_audit_log
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- admin_settings: solo admin
alter table admin_settings enable row level security;
create policy "settings_admin_all" on admin_settings
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- dataset_exports: solo admin
alter table dataset_exports enable row level security;
create policy "exports_admin_all" on dataset_exports
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

## 14. Edge function `dataset-exporter`

- Recibe `{ export_id }`.
- Valida bearer secret.
- Lee `dataset_exports` row, set status='generating'.
- Ejecuta query con filtros aplicados.
- Construye JSON streaming a un archivo temporal (evitar OOM).
- Sube a storage bucket `exports/{export_id}.json`.
- UPDATE dataset_exports status='completed', file_size_bytes, record_count, completed_at, expires_at=now()+30d.
- Email a admin con link de descarga (signed URL 24h).
- Si falla: status='error', error_message, email admin.

## 15. Helpers para métricas

### 15.1 Vista `metrics_summary` (refrescable via cron)

```sql
create materialized view metrics_summary as
select 
  -- counts
  (select count(*) from startups where current_score is not null) as startups_with_score,
  (select count(*) from ecosystem_organizations where is_verified=true) as orgs_verified,
  (select count(*) from decks where status='evaluated') as decks_evaluated_total,
  (select count(*) from decks where status='error') as decks_error_total,
  (select count(*) from decks where status='evaluated' and processed_at > now() - interval '7 days') as decks_evaluated_7d,
  (select count(*) from decks where status='error' and uploaded_at > now() - interval '7 days') as decks_error_7d,
  -- success rate
  round(
    100.0 * 
    (select count(*) from decks where status='evaluated' and processed_at > now() - interval '7 days')::numeric / 
    nullif((select count(*) from decks where status in ('evaluated','error') and uploaded_at > now() - interval '7 days'), 0),
    2
  ) as pipeline_success_rate_7d,
  -- LLM costs
  (select coalesce(sum(cost_estimate_usd), 0) from evaluations) as total_cost_usd,
  (select coalesce(sum(cost_estimate_usd), 0) from evaluations where created_at > now() - interval '7 days') as cost_usd_7d,
  (select coalesce(sum(cost_estimate_usd), 0) from evaluations where created_at > now() - interval '30 days') as cost_usd_30d,
  (select coalesce(avg(cost_estimate_usd), 0) from evaluations where created_at > now() - interval '30 days') as avg_cost_per_eval_30d,
  -- degraded
  (select count(*) from evaluations where (feedback->>'degraded_mode')::boolean = true and created_at > now() - interval '30 days') as degraded_evals_30d,
  now() as refreshed_at;

-- Refresh manual por admin, o pg_cron en Prompt #6
```

### 15.2 Function `get_cohort_retention`

```sql
create or replace function get_cohort_retention(
  cohort_period text default 'week',  -- 'week' | 'month'
  weeks_back int default 12
)
returns table(
  cohort date,
  cohort_size int,
  retention_w1 numeric,
  retention_w4 numeric,
  retention_w8 numeric,
  retention_w12 numeric
) as $$
-- SQL window functions para calcular cohortes de startups que subieron primer deck 
-- esa semana, y qué % subió un segundo deck en W1/W4/W8/W12 después
...
$$ language sql stable;
```

### 15.3 Function `get_division_vertical_heatmap`

```sql
create or replace function get_division_vertical_heatmap()
returns table(
  division league_division,
  vertical startup_vertical,
  startup_count int,
  avg_score numeric
) as $$
select 
  assigned_division, 
  assigned_vertical, 
  count(distinct startup_id)::int,
  avg(score_total)
from evaluations e
where e.id in (
  select distinct on (startup_id) id 
  from evaluations 
  order by startup_id, created_at desc
)
group by 1, 2;
$$ language sql stable;
```

## 16. Seguridad

- Todas las rutas `/admin/**` verificadas en middleware (Prompt #3 ya lo cubre).
- Además, Server Components revalidan el rol en cada request (defensa en profundidad).
- Cualquier action admin que modifique estado hace INSERT en `admin_audit_log` dentro de la misma transaction.
- Exports en storage bucket privado `exports`, signed URLs de 24h máximo.
- Settings con historial opcional (V2) para rollback.

## 17. Copies del admin (tono profesional, no deportivo)

El dashboard admin es operativo, no user-facing. Tono directo, sin emojis deportivos. Mantener `{ }` en header por consistencia de marca.

| Contexto | Copy |
|---|---|
| Home header | `{ admin }` · La Liga Qanvit |
| Cola vacía | Nada pendiente. Buen trabajo. |
| Org aprobada | Organización aprobada y notificada. |
| Override confirmado | Clasificación actualizada. Razón guardada en auditoría. |
| Premios distribuidos | {N} organizaciones recibieron {M} puntos en total. |
| Export listo | Export listo. Link expira en 24h. |
| Warning coste LLM | ⚠ Coste mensual proyectado supera presupuesto. |

## 18. Roadmap admin post-V1

**V1.5**:
- Roles granulares (moderator, analyst, data_officer).
- Pre-checks automáticos de aplicaciones de ecosistema (detección de dominio corp, no Gmail personal).
- Botón "enviar draft del evaluator a golden set" para testing de nuevos prompts sin afectar prod.

**V2**:
- API pública de datos (con OAuth + rate limits).
- Webhooks para ecosistema (notifican cambios).
- Billing y planes de pago para ecosistema (cuando monetices).
