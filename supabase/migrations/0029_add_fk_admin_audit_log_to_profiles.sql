-- admin_audit_log.admin_id had no FK constraint, so PostgREST could not
-- resolve the admin:profiles() embed and the /admin/audit-log page returned
-- an empty result set. Add the FK now so the relationship is discoverable.
ALTER TABLE admin_audit_log
  ADD CONSTRAINT admin_audit_log_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES profiles(id);
