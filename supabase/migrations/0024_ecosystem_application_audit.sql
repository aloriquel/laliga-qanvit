-- Add ecosystem_application_received to admin_action_type enum.
-- Also allows admin_id to be NULL so system-triggered events (no human admin)
-- can be recorded in the same audit log table.

alter type admin_action_type add value if not exists 'ecosystem_application_received';
alter type admin_action_type add value if not exists 'startup_consent_forced';
alter type admin_action_type add value if not exists 'test_email_sent';

-- Allow admin_id = NULL for system-generated audit rows (not admin actions)
alter table admin_audit_log alter column admin_id drop not null;
