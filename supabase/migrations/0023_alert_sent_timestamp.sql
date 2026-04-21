alter table ecosystem_new_startup_alerts
  add column if not exists email_sent_at timestamptz;
