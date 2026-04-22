import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditSystemEvent } from "@/lib/admin/audit";
import {
  sendEcosystemApplicationEmail,
  sendEcosystemApplicationAdminEmail,
} from "@/lib/emails/send";

export const runtime = "nodejs";

const BodySchema = z.object({
  name:     z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  org_type: z.enum(["science_park", "cluster", "innovation_association", "other"]),
  website:  z.string().url("URL no válida").optional().or(z.literal("")),
  about:    z.string().max(1000).optional(),
  region:   z.string().max(100).optional(),
});

const ORG_TYPE_PREFIX: Record<string, string> = {
  science_park:           "SP",
  cluster:                "CL",
  innovation_association: "IA",
  other:                  "OT",
};

function generateReferralCode(orgType: string): string {
  const prefix = ORG_TYPE_PREFIX[orgType] ?? "OT";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

export async function POST(req: NextRequest) {
  // Require authenticated user
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión para solicitar acceso." }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, org_type, website, about, region } = parsed.data;
  const service = createServiceClient();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
  const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "holaqanvit@gmail.com";

  // Guard: one org per user
  const { data: existing } = await service
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya tienes una solicitud en proceso." },
      { status: 409 }
    );
  }

  // Ensure the profile has ecosystem role
  await service
    .from("profiles")
    .update({ role: "ecosystem" })
    .eq("id", user.id)
    .eq("role", "startup"); // only upgrade from startup, not from admin

  // Get user email for notifications
  const { data: profile } = await service
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const ownerEmail = profile?.email ?? user.email ?? "";

  // Generate unique referral code (retry on collision)
  let referralCode = generateReferralCode(org_type);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: collision } = await service
      .from("ecosystem_organizations")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!collision) break;
    referralCode = generateReferralCode(org_type);
  }

  // INSERT ecosystem_organizations
  const { data: org, error: insertErr } = await service
    .from("ecosystem_organizations")
    .insert({
      owner_id:      user.id,
      name,
      org_type,
      website:       website || null,
      about:         about   || null,
      region:        region  || null,
      is_verified:   false,
      referral_code: referralCode,
    })
    .select("id")
    .single();

  if (insertErr || !org) {
    console.error(JSON.stringify({
      event: "ecosystem_apply_insert_failed",
      org:   name,
      owner: user.id,
      error: insertErr?.message,
    }));
    return NextResponse.json(
      { error: "Error al guardar tu solicitud. Por favor, escríbenos a holaqanvit@gmail.com." },
      { status: 500 }
    );
  }

  console.log(JSON.stringify({
    event:  "ecosystem_application_received",
    org_id: org.id,
    org:    name,
    owner:  user.id,
    email:  ownerEmail,
  }));

  // Audit log
  await auditSystemEvent({
    actionType: "ecosystem_application_received",
    targetType: "ecosystem_organization",
    targetId:   org.id,
    payload:    { name, org_type, region: region ?? null },
  }).catch((err) =>
    console.error(JSON.stringify({ event: "ecosystem_apply_audit_failed", error: String(err) }))
  );

  // Emails (non-fatal)
  if (ownerEmail) {
    try {
      await sendEcosystemApplicationEmail(ownerEmail, { orgName: name, contactEmail: ownerEmail });
    } catch (err) {
      console.error(JSON.stringify({ event: "ecosystem_apply_applicant_email_failed", org_id: org.id, error: String(err) }));
    }
  }

  try {
    await sendEcosystemApplicationAdminEmail(ADMIN_EMAIL, {
      orgName:       name,
      orgType:       org_type,
      contactEmail:  ownerEmail,
      website:       website || undefined,
      about:         about   || undefined,
      region:        region  || undefined,
      adminPanelUrl: `${APP_URL}/admin/ecosystem-applications`,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: "ecosystem_apply_admin_email_failed", org_id: org.id, error: String(err) }));
  }

  return NextResponse.json(
    { success: true, org_id: org.id, referral_code: referralCode },
    { status: 201 }
  );
}
