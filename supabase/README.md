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
| `0006_triggers.sql` | handle_new_user, set_updated_at, sync_startup_current_eval (trigger_evaluator_pipeline comentado hasta prompt #2) |

## Seed manual (admin bootstrap)

```sql
-- Ejecutar una vez desde el SQL Editor de Supabase tras crear el usuario en Auth:
insert into profiles (id, email, role, full_name)
values ('<auth-uid-de-arturo>', 'aloriquel@gmail.com', 'admin', 'Arturo López Riquelme')
on conflict (id) do update set role = 'admin';
```

## Buckets de Storage

Crear manualmente en el dashboard o vía script:
- `decks` → privado (decks PDF)
- `public-assets` → público (logos startup, imágenes OG)
