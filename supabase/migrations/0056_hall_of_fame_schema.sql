-- ────────────────────────────────────────────────────────────────────────────
-- 0056_hall_of_fame_schema.sql  —  Hall of Fame V1 (PROMPT_HALL_OF_FAME_V1)
--
-- Catálogo histórico de startups premiadas. Solo escaparate; no afecta al
-- scoring de La Liga. V1 incluye un único premio (EmprendeXXI), pero el
-- schema escala a múltiples.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.award_scope AS ENUM (
  'national', 'regional_es', 'iberian', 'european', 'global'
);

CREATE TYPE public.award_category_type AS ENUM (
  'regional', 'challenge', 'accesit', 'trajectory', 'special'
);

CREATE TYPE public.recipient_result AS ENUM ('winner', 'finalist');

CREATE TYPE public.recipient_status AS ENUM (
  'active', 'acquired', 'closed', 'pivoted', 'unknown'
);

-- ── awards ────────────────────────────────────────────────────────────────
CREATE TABLE public.awards (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  name          text        NOT NULL,
  organizer     text        NOT NULL,
  organizer_url text,
  description   text,
  website_url   text,
  logo_url      text,
  brand_color   text,
  scope         public.award_scope NOT NULL DEFAULT 'national',
  start_year    int,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── award_editions ────────────────────────────────────────────────────────
CREATE TABLE public.award_editions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id        uuid        NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  edition_year    int         NOT NULL,
  edition_number  int,
  category_type   public.award_category_type NOT NULL,
  category_value  text        NOT NULL,
  source_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (award_id, edition_year, category_type, category_value)
);

CREATE INDEX idx_editions_year_award
  ON public.award_editions (award_id, edition_year DESC);

-- ── award_recipients ──────────────────────────────────────────────────────
CREATE TABLE public.award_recipients (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id                  uuid        NOT NULL REFERENCES public.award_editions(id) ON DELETE CASCADE,
  result                      public.recipient_result NOT NULL,

  -- Snapshot del premio
  company_name                text        NOT NULL,
  company_name_normalized     text        NOT NULL,
  company_website             text,
  company_domain_root         text,
  company_description_short   text,

  -- Estado actual
  current_status              public.recipient_status NOT NULL DEFAULT 'unknown',
  current_status_evidence     text,
  current_status_updated_at   timestamptz,

  -- Vínculo opcional con startup en La Liga
  startup_id                  uuid        REFERENCES public.startups(id) ON DELETE SET NULL,

  -- Trazabilidad
  source_url                  text,
  source_type                 text,
  imported_at                 timestamptz NOT NULL DEFAULT now(),

  external_id                 text
);

CREATE INDEX idx_recipients_edition
  ON public.award_recipients (edition_id);
CREATE INDEX idx_recipients_company_normalized
  ON public.award_recipients (company_name_normalized);
CREATE INDEX idx_recipients_domain
  ON public.award_recipients (company_domain_root)
  WHERE company_domain_root IS NOT NULL;
CREATE INDEX idx_recipients_startup
  ON public.award_recipients (startup_id)
  WHERE startup_id IS NOT NULL;
CREATE INDEX idx_recipients_status_active
  ON public.award_recipients (current_status)
  WHERE current_status = 'active';
CREATE UNIQUE INDEX uniq_recipient_external_id
  ON public.award_recipients (external_id)
  WHERE external_id IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.awards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_editions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_recipients  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awards_public_read"           ON public.awards            FOR SELECT USING (true);
CREATE POLICY "award_editions_public_read"   ON public.award_editions    FOR SELECT USING (true);
CREATE POLICY "award_recipients_public_read" ON public.award_recipients  FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE → solo service_role (RLS los bloquea por defecto sin policy).

-- ── RPC: premios por startup ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_startup_awards(p_startup_id uuid)
RETURNS TABLE (
  recipient_id    uuid,
  award_slug      text,
  award_name      text,
  edition_year    int,
  edition_number  int,
  category_type   public.award_category_type,
  category_value  text,
  result          public.recipient_result
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, a.slug, a.name, e.edition_year, e.edition_number,
    e.category_type, e.category_value, r.result
  FROM public.award_recipients r
  JOIN public.award_editions e ON e.id = r.edition_id
  JOIN public.awards a         ON a.id = e.award_id
  WHERE r.startup_id = p_startup_id
  ORDER BY e.edition_year DESC, e.edition_number DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_startup_awards(uuid) TO anon, authenticated;

-- ── Seed inicial: EmprendeXXI award ───────────────────────────────────────
INSERT INTO public.awards (
  slug, name, organizer, organizer_url, description,
  website_url, brand_color, scope, start_year, active
) VALUES (
  'emprendexxi',
  'Premios EmprendeXXI',
  'CaixaBank DayOne · Enisa',
  'https://www.caixabank.com/dayone',
  'Premios anuales que reconocen a startups españolas y portuguesas con menos de tres años de trayectoria. Una iniciativa de CaixaBank a través de DayOne, cootorgada con Enisa.',
  'https://www.emprendedorxxi.es',
  '#0070C8',
  'iberian',
  2007,
  true
);
