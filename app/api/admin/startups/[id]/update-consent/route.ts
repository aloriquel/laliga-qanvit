import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";

const ALLOWED_CONSENT_FIELDS = [
  "consent_public_profile",
  "consent_internal_use",
  "consent_direct_contact",
  "is_public",
] as const;

type ConsentField = (typeof ALLOWED_CONSENT_FIELDS)[number];

const BodySchema = z.object({
  consent_field: z.enum(ALLOWED_CONSENT_FIELDS),
  new_value: z.boolean(),
  reason: z.string().min(10, "La razón debe tener al menos 10 caracteres"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const { consent_field, new_value, reason } = body.data;
  const startupId = params.id;
  const service = createServiceClient();

  // Read current value for audit trail
  const { data: startup } = await service
    .from("startups")
    .select("consent_public_profile, consent_internal_use, consent_direct_contact, is_public, current_score, current_division")
    .eq("id", startupId)
    .single();

  if (!startup) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }

  const oldValue = startup[consent_field as ConsentField];

  const { error: updateError } = await service
    .from("startups")
    .update({ [consent_field]: new_value } as never)
    .eq("id", startupId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await auditAction({
    adminId: user.id,
    actionType: "startup_consent_forced",
    targetType: "startups",
    targetId: startupId,
    reason,
    payload: { field: consent_field, old: oldValue, new: new_value, reason },
  });

  // When consent_public_profile is enabled and the startup has a valid score,
  // refresh the materialized view so it appears in the leaderboard immediately.
  if (
    consent_field === "consent_public_profile" &&
    new_value === true &&
    startup.current_score != null &&
    startup.current_division
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service.rpc as any)("admin_refresh_league_standings");
  }

  return NextResponse.json({ ok: true });
}
