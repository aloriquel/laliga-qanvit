# Supabase — La Liga Qanvit

## Comandos útiles

```bash
# Levantar Supabase local (Docker debe estar corriendo)
npx supabase start

# Aplicar todas las migrations al entorno local
npx supabase db reset

# Generar types TypeScript desde el schema local
npx supabase gen types typescript --local > lib/supabase/types.ts

# Ver diferencias entre tu schema local y las migrations
npx supabase db diff

# Aplicar migrations a producción
npx supabase db push
```

## Estructura de migrations

| Archivo | Qué hace |
|---|---|
| `0001_extensions.sql` | Habilita uuid-ossp, vector, pg_trgm, pg_net |
| `0002_enums.sql` | Todos los tipos ENUM del schema |
| `0003_tables.sql` | Todas las tablas con índices |
| `0004_views.sql` | Vistas: league_standings (materializada), ecosystem_totals, public_evaluations |
| `0005_rls.sql` | Row Level Security policies para todas las tablas |
| `0006_triggers.sql` | handle_new_user, set_updated_at, sync_startup_current_eval |
| `0007_evaluator_trigger.sql` | trigger_evaluator_pipeline vía pg_net → edge function |
| `0008_dashboard_features.sql` | alert_type enum, nuevos campos en startups, startup_ecosystem_views, startup_alerts, RLS, track_ecosystem_view() |
| `0009_alerts_trigger.sql` | generate_startup_alerts + league_division_order, trigger trz_generate_alerts |
| `0010_alert_dispatcher_trigger.sql` | notify_alert_dispatcher, trigger trg_alert_dispatcher |

## Seed manual (admin bootstrap)

```sql
-- Ejecutar una vez desde el SQL Editor de Supabase tras crear el usuario en Auth:
insert into profiles (id, email, role, full_name)
values ('<auth-uid-de-arturo>', 'aloriquel@gmail.com', 'admin', 'Arturo López Riquelme')
on conflict (id) do update set role = 'admin';
```

## Configurar el pipeline (una vez por entorno)

Después de aplicar las migrations, settear los runtime values para que el trigger pg_net sepa a qué URL llamar:

```sql
-- LOCAL (Supabase Studio → SQL Editor):
alter database postgres
  set app.settings.evaluator_url = 'http://host.docker.internal:54321/functions/v1/evaluator-pipeline';
alter database postgres
  set app.settings.evaluator_secret = 'tu-secret-de-32-chars';
select pg_reload_conf();

-- PRODUCCIÓN:
alter database postgres
  set app.settings.evaluator_url = 'https://<project>.supabase.co/functions/v1/evaluator-pipeline';
alter database postgres
  set app.settings.evaluator_secret = 'tu-secret-de-32-chars';
select pg_reload_conf();
```

El secret debe coincidir con `EVALUATOR_FN_SECRET` en `.env.local`.

## Configurar alert-dispatcher (Prompt #3)

```sql
-- LOCAL:
alter database postgres
  set app.settings.alert_dispatcher_url = 'http://host.docker.internal:54321/functions/v1/alert-dispatcher';
select pg_reload_conf();

-- PRODUCCIÓN:
alter database postgres
  set app.settings.alert_dispatcher_url = 'https://<project>.supabase.co/functions/v1/alert-dispatcher';
select pg_reload_conf();
```

Reutiliza `app.settings.evaluator_secret` como bearer token del dispatcher.

## Generar alertas de prueba manualmente

```sql
-- Insertar alerta de prueba directamente (sirve el trigger del dispatcher):
insert into startup_alerts (startup_id, alert_type, payload)
values (
  '<uuid-de-startup>',
  'new_top3_vertical',
  '{"vertical":"robotics_automation","division":"seed","new_rank":1}'::jsonb
);

-- Ver alertas de una startup:
select * from startup_alerts where startup_id = '<uuid>' order by created_at desc;
```

## Servir la edge function localmente

```bash
# Terminal 1: Supabase local
npx supabase start

# Terminal 2: Servir la edge function con las envs
npx supabase functions serve evaluator-pipeline --env-file .env.local

# Servir alert-dispatcher también
npx supabase functions serve alert-dispatcher --env-file .env.local

# Ver logs en tiempo real
npx supabase functions logs evaluator-pipeline
npx supabase functions logs alert-dispatcher
```

## Buckets de Storage

Crear manualmente en el dashboard o vía script:
- `decks` → privado (decks PDF)
- `exports` → privado (JSONs generados por dataset-exporter, TTL 30 días)
- `public-assets` → público (logos startup, imágenes OG)

## Edge Functions (Prompt #6)

| Función | Trigger | Descripción |
|---|---|---|
| `evaluator-pipeline` | DB trigger (deck insert) | Pipeline completo: extract → chunk → embed → classify → evaluate → persist |
| `alert-dispatcher` | DB trigger (startup_alerts insert, immediate) | Emails de alerta a startups |
| `ecosystem-alert-dispatcher` | DB trigger (ecosystem_alerts insert) | Notificaciones a orgs del ecosistema |
| `dataset-exporter` | HTTP (admin API route) | Exporta dataset a JSON en bucket `exports` |
| `challenge-progress-updater` | pg_cron diario 00:15 | Actualiza `challenge_progress` con ranking actual |
| `ecosystem-digest-sender` | pg_cron diario 08:00 + lunes | Digest diario/semanal a miembros del ecosistema |
| `exports-file-cleanup` | pg_cron diario 03:30 | Elimina archivos expirados del bucket `exports` |

### Deploy funciones nuevas (Prompt #6)

```bash
npx supabase functions deploy challenge-progress-updater --project-ref ongwrbdypbusnwlclqjg --no-verify-jwt
npx supabase functions deploy ecosystem-digest-sender --project-ref ongwrbdypbusnwlclqjg --no-verify-jwt
npx supabase functions deploy exports-file-cleanup --project-ref ongwrbdypbusnwlclqjg --no-verify-jwt
```

### Configurar app.settings para pg_cron (tras aplicar migration 0018)

```sql
ALTER DATABASE postgres SET "app.settings.challenge_progress_updater_url" = 'https://ongwrbdypbusnwlclqjg.functions.supabase.co/challenge-progress-updater';
ALTER DATABASE postgres SET "app.settings.ecosystem_digest_url" = 'https://ongwrbdypbusnwlclqjg.functions.supabase.co/ecosystem-digest-sender';
ALTER DATABASE postgres SET "app.settings.exports_cleanup_url" = 'https://ongwrbdypbusnwlclqjg.functions.supabase.co/exports-file-cleanup';
SELECT pg_reload_conf();
```
