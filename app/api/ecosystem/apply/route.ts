import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { auditSystemEvent } from "@/lib/admin/audit";
import {
  sendEcosystemApplicationEmail,
  sendEcosystemApplicationAdminEmail,
} from "@/lib/emails/send";

export const runtime = "nodejs";

const BodySchema = z.object({
  name:        z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  org_type:    z.enum(["science_park", "cluster", "innovation_association", "other"]),
  website:     z.string().url("URL no válida").optional().or(z.literal("")),
  about:       z.string().max(1000).optional(),
  region:      z.string().max(100).optional(),
  email_owner: z.string().email("Email no válido"),
});

const ORG_TYPE_PREFIX: Record<string, string> = {
  science_park:          "SP",
  cluster:               "CL",
  innovation_association: "IA",
  other:                 "OT",
};

function generateReferralCode(orgType: string): string {
  const prefix = ORG_TYPE_PREFIX[orgType] ?? "OT";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

export async function POST(req: NextRequest) {
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

  const { name, org_type, website, about, region, email_owner } = parsed.data;

  const supabase = createServiceClient();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
  const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "liga@qanvit.com";

  // ── 1. Find or create profile for the applicant ───────────────────────────
  let ownerId: string;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email_owner)
    .maybeSingle();

  if (existingProfile) {
    ownerId = existingProfile.id;
  } else {
    // Create auth user — the handle_new_user trigger creates the profiles row
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: email_owner,
      email_confirm: false,
    });

    if (createErr || !newUser?.user) {
      console.error(JSON.stringify({
        event: "ecosystem_apply_create_user_failed",
        email: email_owner,
        error: createErr?.message,
      }));
      return NextResponse.json(
        { error: "No pudimos procesar tu solicitud. Por favor, inténtalo de nuevo." },
        { status: 500 }
      );
    }

    ownerId = newUser.user.id;

    // Set role = 'ecosystem' for new accounts created via application flow
    await supabase
      .from("profiles")
      .update({ role: "ecosystem" })
      .eq("id", ownerId);
  }

  // ── 2. Generate unique referral code (retry on collision) ─────────────────
  let referralCode = generateReferralCode(org_type);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: collision } = await supabase
      .from("ecosystem_organizations")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!collision) break;
    referralCode = generateReferralCode(org_type);
  }

  // ── 3. INSERT ecosystem_organizations ────────────────────────────────────
  const { data: org, error: insertErr } = await supabase
    .from("ecosystem_organizations")
    .insert({
      owner_id:     ownerId,
      name,
      org_type,
      website:      website || null,
      about:        about   || null,
      region:       region  || null,
      is_verified:  false,
      referral_code: referralCode,
    })
    .select("id")
    .single();

  if (insertErr || !org) {
    console.error(JSON.stringify({
      event:  "ecosystem_apply_insert_failed",
      org:    name,
      owner:  ownerId,
      error:  insertErr?.message,
    }));
    return NextResponse.json(
      { error: "Error al guardar tu solicitud. Por favor, escríbenos a liga@qanvit.com." },
      { status: 500 }
    );
  }

  console.log(JSON.stringify({
    event:   "ecosystem_application_received",
    org_id:  org.id,
    org:     name,
    owner:   ownerId,
    email:   email_owner,
  }));

  // ── 4. Audit log (system event — no admin involved) ──────────────────────
  await auditSystemEvent({
    actionType: "ecosystem_application_received",
    targetType: "ecosystem_organization",
    targetId:   org.id,
    payload:    { name, org_type, email_owner, region: region ?? null },
  }).catch((err) =>
    console.error(JSON.stringify({ event: "ecosystem_apply_audit_failed", error: String(err) }))
  );

  // ── 5. Send emails (non-fatal) ────────────────────────────────────────────
  const emailResults: string[] = [];

  try {
    await sendEcosystemApplicationEmail(email_owner, {
      orgName:      name,
      contactEmail: email_owner,
    });
    emailResults.push("applicant_ok");
  } catch (err) {
    emailResults.push(`applicant_err:${String(err)}`);
    console.error(JSON.stringify({
      event: "ecosystem_apply_applicant_email_failed",
      org_id: org.id,
      error: String(err),
    }));
  }

  try {
    await sendEcosystemApplicationAdminEmail(ADMIN_EMAIL, {
      orgName:      name,
      orgType:      org_type,
      contactEmail: email_owner,
      website:      website || undefined,
      about:        about   || undefined,
      region:       region  || undefined,
      adminPanelUrl: `${APP_URL}/admin/ecosystem-applications`,
    });
    emailResults.push("admin_ok");
  } catch (err) {
    emailResults.push(`admin_err:${String(err)}`);
    console.error(JSON.stringify({
      event: "ecosystem_apply_admin_email_failed",
      org_id: org.id,
      error: String(err),
    }));
  }

  return NextResponse.json(
    {
      success:       true,
      org_id:        org.id,
      referral_code: referralCode,
      emails:        emailResults,
    },
    { status: 201 }
  );
}
