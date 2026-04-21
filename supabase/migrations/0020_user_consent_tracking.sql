-- ── consent columns on profiles ──────────────────────────────────────────────
alter table profiles
  add column if not exists consented_at      timestamptz,
  add column if not exists consent_ip        text,
  add column if not exists consent_user_agent text;

-- Backfill: mark existing users as already consented (implicit acceptance)
update profiles set consented_at = created_at where consented_at is null;

-- ── consent_given enum value on admin_audit_log ───────────────────────────────
alter type admin_action_type add value if not exists 'consent_given';
