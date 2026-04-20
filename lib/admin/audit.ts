import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type AdminActionType =
  | "org_approved" | "org_rejected" | "org_info_requested" | "org_revoked" | "org_points_adjusted"
  | "evaluation_overridden" | "evaluation_rerun" | "evaluation_deleted" | "evaluation_calibration_flagged"
  | "appeal_accepted_override" | "appeal_accepted_rerun" | "appeal_rejected"
  | "startup_hidden" | "startup_restored" | "startup_rerun_forced"
  | "challenge_approved_voting" | "challenge_activated" | "challenge_cancelled" | "challenge_prizes_distributed"
  | "dataset_exported" | "setting_updated";

export async function auditAction(params: {
  adminId: string;
  actionType: AdminActionType;
  targetType: string;
  targetId?: string;
  payload?: Record<string, unknown>;
  reason?: string;
}) {
  const supabase = createServiceClient();
  await supabase.from("admin_audit_log").insert({
    admin_id: params.adminId,
    action_type: params.actionType,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    payload: (params.payload ?? {}) as Json,
    reason: params.reason ?? null,
  });
}
