-- 0060_neotec_schema_updates
--
-- Schema updates required by the CDTI NEOTEC import:
--   1. New 'beneficiary' value on the recipient_result enum (NEOTEC
--      grants are a single-tier "subvención concedida" — there's no
--      winner/finalist split).
--   2. Two optional columns on award_recipients:
--        - award_amount_eur (int)  — public grant amount in euros.
--        - company_cif      (text) — Spanish tax ID, public via BOE.
--      Both default null and only get populated for awards that
--      surface them (NEOTEC and any future public-grant awards).
--   3. Partial index on award_amount_eur for future "by amount"
--      queries (filters or sums per edition).

ALTER TYPE public.recipient_result ADD VALUE IF NOT EXISTS 'beneficiary';

ALTER TABLE public.award_recipients
  ADD COLUMN IF NOT EXISTS award_amount_eur int,
  ADD COLUMN IF NOT EXISTS company_cif text;

CREATE INDEX IF NOT EXISTS idx_recipients_amount
  ON public.award_recipients (award_amount_eur)
  WHERE award_amount_eur IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipients_cif
  ON public.award_recipients (company_cif)
  WHERE company_cif IS NOT NULL;
