-- Migration 0036: región de startup (CA + provincia)
-- PROMPT_10 — V1 solo añade datos; rankings regionales en V1.5.
--
-- IMPORTANTE: este script hace DROP + RECREATE de league_standings (matview)
-- para añadir region_ca y region_province. Todos los índices de la vista
-- se recrean al final. El trigger trg_sync_startup_eval y la función
-- admin_refresh_league_standings siguen funcionando sin cambios.
--
-- Pasos manuales:
--   1. Aplicar este script en Supabase Studio → SQL Editor.
--   2. Regenerar tipos: npx supabase gen types typescript \
--        --project-id ongwrbdypbusnwlclqjg --schema public \
--        > lib/supabase/types.ts
--   3. Verificar con: SELECT region_ca, region_province FROM startups LIMIT 5;
--      y: SELECT region_ca FROM league_standings LIMIT 5;

-- ── 1. Enum para comunidades autónomas ────────────────────────────────────────
CREATE TYPE ca_id AS ENUM (
  'andalucia',
  'aragon',
  'asturias',
  'baleares',
  'canarias',
  'cantabria',
  'castilla_leon',
  'castilla_la_mancha',
  'cataluna',
  'valenciana',
  'extremadura',
  'galicia',
  'madrid',
  'murcia',
  'navarra',
  'pais_vasco',
  'rioja',
  'ceuta',
  'melilla'
);

-- ── 2. Añadir columnas a startups ─────────────────────────────────────────────
ALTER TABLE startups
  ADD COLUMN IF NOT EXISTS region_ca       ca_id,
  ADD COLUMN IF NOT EXISTS region_province text;

-- ── 3. CHECK de coherencia CA ↔ provincia ────────────────────────────────────
-- Regla: ambos null (no relleno) o ambos presentes con provincia válida para CA.
ALTER TABLE startups ADD CONSTRAINT region_coherence_check CHECK (
  (region_ca IS NULL AND region_province IS NULL)
  OR
  (region_ca IS NOT NULL AND region_province IS NOT NULL AND (
      (region_ca = 'andalucia'          AND region_province IN ('Almería','Cádiz','Córdoba','Granada','Huelva','Jaén','Málaga','Sevilla'))
   OR (region_ca = 'aragon'            AND region_province IN ('Huesca','Teruel','Zaragoza'))
   OR (region_ca = 'asturias'          AND region_province = 'Asturias')
   OR (region_ca = 'baleares'          AND region_province = 'Illes Balears')
   OR (region_ca = 'canarias'          AND region_province IN ('Las Palmas','Santa Cruz de Tenerife'))
   OR (region_ca = 'cantabria'         AND region_province = 'Cantabria')
   OR (region_ca = 'castilla_leon'     AND region_province IN ('Ávila','Burgos','León','Palencia','Salamanca','Segovia','Soria','Valladolid','Zamora'))
   OR (region_ca = 'castilla_la_mancha' AND region_province IN ('Albacete','Ciudad Real','Cuenca','Guadalajara','Toledo'))
   OR (region_ca = 'cataluna'          AND region_province IN ('Barcelona','Girona','Lleida','Tarragona'))
   OR (region_ca = 'valenciana'        AND region_province IN ('Alicante','Castellón','Valencia'))
   OR (region_ca = 'extremadura'       AND region_province IN ('Badajoz','Cáceres'))
   OR (region_ca = 'galicia'           AND region_province IN ('A Coruña','Lugo','Ourense','Pontevedra'))
   OR (region_ca = 'madrid'            AND region_province = 'Madrid')
   OR (region_ca = 'murcia'            AND region_province = 'Murcia')
   OR (region_ca = 'navarra'           AND region_province = 'Navarra')
   OR (region_ca = 'pais_vasco'        AND region_province IN ('Álava','Bizkaia','Gipuzkoa'))
   OR (region_ca = 'rioja'             AND region_province = 'La Rioja')
   OR (region_ca = 'ceuta'             AND region_province = 'Ceuta')
   OR (region_ca = 'melilla'           AND region_province = 'Melilla')
  ))
);

-- ── 4. Índices en startups ────────────────────────────────────────────────────
CREATE INDEX ON startups(region_ca);
CREATE INDEX ON startups(region_ca, region_province);

-- ── 5. Comentarios ───────────────────────────────────────────────────────────
COMMENT ON COLUMN startups.region_ca IS
  'Comunidad Autónoma de la startup (enum ca_id). NULL para startups pre-PROMPT_10 que no hayan completado el backfill.';
COMMENT ON COLUMN startups.region_province IS
  'Provincia de la startup. Debe ser coherente con region_ca (validado por CHECK constraint region_coherence_check).';

-- ── 6. Recrear league_standings con region_ca y region_province ───────────────
-- La vista materializada no soporta ADD COLUMN; hay que recrearla.
DROP MATERIALIZED VIEW IF EXISTS league_standings CASCADE;

CREATE MATERIALIZED VIEW league_standings AS
SELECT
  s.id                  AS startup_id,
  s.slug,
  s.name,
  s.one_liner,
  s.logo_url,
  s.region_ca,
  s.region_province,
  s.current_division,
  s.current_vertical,
  s.current_score,
  row_number() OVER (ORDER BY s.current_score DESC)                                      AS rank_national,
  row_number() OVER (PARTITION BY s.current_division ORDER BY s.current_score DESC)      AS rank_division,
  row_number() OVER (PARTITION BY s.current_division, s.current_vertical ORDER BY s.current_score DESC) AS rank_division_vertical
FROM startups s
WHERE s.is_public = true
  AND s.current_score IS NOT NULL
  AND s.consent_public_profile = true;

-- ── 7. Recrear índices ────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_league_standings_startup      ON league_standings(startup_id);
CREATE        INDEX idx_league_standings_rank_national ON league_standings(rank_national);
CREATE        INDEX idx_league_standings_div_vert      ON league_standings(current_division, current_vertical);
CREATE        INDEX idx_league_standings_region_ca     ON league_standings(region_ca);

-- ── 8. Grants (anon + authenticated necesitan SELECT para el leaderboard público)
GRANT SELECT ON league_standings TO anon, authenticated;

-- ── Verificación (ejecutar después de aplicar) ────────────────────────────────
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_name = 'startups'
--    AND column_name IN ('region_ca','region_province');
--
-- SELECT region_ca, region_province FROM league_standings LIMIT 5;
--
-- -- Test CHECK constraint (debe fallar):
-- UPDATE startups SET region_ca = 'madrid', region_province = 'Barcelona'
--  WHERE id = (SELECT id FROM startups LIMIT 1);
