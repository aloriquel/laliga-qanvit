-- 0061_seed_cdti_neotec
--
-- Adds the NEOTEC programme (CDTI) as the fourth award.

INSERT INTO public.awards (
  slug,
  name,
  organizer,
  organizer_url,
  description,
  website_url,
  brand_color,
  scope,
  start_year,
  active
) VALUES (
  'cdti-neotec',
  'Programa NEOTEC',
  'CDTI · Ministerio de Ciencia, Innovación y Universidades',
  'https://www.cdti.es',
  'Programa público español de apoyo a la creación y consolidación de Empresas de Base Tecnológica (EBT). Desde 2002, financia proyectos empresariales basados en desarrollo tecnológico propio. Hasta 2014 fueron ayudas reembolsables; desde 2015, subvenciones a fondo perdido (hasta 325.000€ por beneficiaria).',
  'https://www.cdti.es/ayudas/ayudas-neotec',
  '#003F7F',
  'national',
  2002,
  true
)
ON CONFLICT (slug) DO NOTHING;
