import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";
import {
  sendEcosystemApprovedEmail,
  sendEcosystemRejectedEmail,
  sendEcosystemInfoRequestedEmail,
  sendEvaluationCompleteEmail,
  sendDataExportReadyEmail,
  sendAlertNotificationEmail,
  sendEcosystemNewStartupAlertEmail,
  sendEcosystemDigestEmail,
} from "@/lib/emails/send";

export const runtime = "nodejs";

const TEMPLATE_TYPES = [
  "evaluation_ready",
  "ecosystem_welcome",
  "ecosystem_rejected",
  "ecosystem_info_requested",
  "data_export_ready",
  "alert_notification",
  "ecosystem_new_startup_alert",
  "ecosystem_digest",
] as const;

type TemplateType = (typeof TEMPLATE_TYPES)[number];

const BodySchema = z.object({
  recipient_email: z.string().email(),
  template_type: z.enum(TEMPLATE_TYPES),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

  const { recipient_email, template_type } = body.data;

  console.log(JSON.stringify({ event: "test_email", template: template_type, to: recipient_email, admin: user.id }));

  let result: { email_id: string; sent_at: string };
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";

  try {
    result = await dispatchTestEmail(template_type, recipient_email, APP_URL);
  } catch (err) {
    const message = (err as Error).message;
    console.error(JSON.stringify({ event: "test_email_failed", template: template_type, error: message }));
    return NextResponse.json({ error: message, where_it_failed: template_type }, { status: 500 });
  }

  await auditAction({
    adminId: user.id,
    actionType: "test_email_sent",
    targetType: "email",
    payload: { template: template_type, recipient: recipient_email, email_id: result.email_id },
  });

  console.log(JSON.stringify({ event: "test_email_sent", template: template_type, email_id: result.email_id }));

  return NextResponse.json({ email_id: result.email_id, sent_at: result.sent_at, recipient: recipient_email });
}

async function dispatchTestEmail(type: TemplateType, to: string, appUrl: string) {
  switch (type) {
    case "evaluation_ready":
      return sendEvaluationCompleteEmail(to, {
        name: "Arturo",
        startupName: "Startup Demo",
        score: 72,
        division: "🌱 Seed",
        vertical: "Deeptech & AI",
        rankNational: 3,
        slug: "startup-demo",
      });

    case "ecosystem_welcome":
      return sendEcosystemApprovedEmail(to, { orgName: "Parque Tecnológico Demo" });

    case "ecosystem_rejected":
      return sendEcosystemRejectedEmail(to, {
        orgName: "Org Demo",
        reason: "La organización no cumple los criterios de parque/clúster/asociación tecnológica.",
      });

    case "ecosystem_info_requested":
      return sendEcosystemInfoRequestedEmail(to, { orgName: "Org Demo" });

    case "data_export_ready":
      return sendDataExportReadyEmail(to, {
        scope: "full",
        recordCount: 47,
        downloadUrl: `${appUrl}/admin/data-export`,
        expiresHours: 24,
      });

    case "alert_notification":
      return sendAlertNotificationEmail(to, {
        alertType: "new_top3_vertical",
        bodyText: "Top 2 en Seed Deeptech & AI. Eres de los grandes.",
        subject: "[La Liga Qanvit] Top 2 en tu vertical 🥈",
      });

    case "ecosystem_new_startup_alert":
      return sendEcosystemNewStartupAlertEmail(to, {
        orgName: "Parque Tecnológico Demo",
        startupName: "Startup Demo",
        startupSlug: "startup-demo",
        matchedReason: "vertical:deeptech_ai",
      });

    case "ecosystem_digest":
      return sendEcosystemDigestEmail(to, {
        orgName: "Parque Tecnológico Demo",
        recipientName: "Arturo",
        frequency: "weekly",
        newStartups: [
          { name: "Startup Demo", slug: "startup-demo", division: "Seed", vertical: "Deeptech & AI" },
          { name: "Robotica SL", slug: "robotica-sl", division: "Growth", vertical: "Robotics & Automation" },
        ],
      });
  }
}
