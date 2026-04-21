import { Resend } from "resend";
import {
  ecosystemApprovedEmail,
  ecosystemRejectedEmail,
  ecosystemInfoRequestedEmail,
  evaluationCompleteEmail,
  contactRequestToStartupEmail,
  contactRequestAcceptedEmail,
  challengePrizeEmail,
  dataExportReadyEmail,
  alertNotificationEmail,
  ecosystemNewStartupAlertEmail,
  ecosystemDigestEmail,
  ecosystemApplicationEmail,
  ecosystemApplicationAdminEmail,
  FROM,
} from "./templates";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  return new Resend(key);
}

function from(): string {
  return process.env.RESEND_FROM_EMAIL ?? FROM;
}

type SendResult = { email_id: string; sent_at: string };

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const resend = getResend();
  const { data, error } = await resend.emails.send({ from: from(), to, subject, html });
  if (error || !data) throw new Error(error?.message ?? "Resend returned no data");
  return { email_id: data.id, sent_at: new Date().toISOString() };
}

export async function sendEcosystemApprovedEmail(to: string, params: { orgName: string }): Promise<SendResult> {
  const { subject, html } = ecosystemApprovedEmail(params);
  return send(to, subject, html);
}

export async function sendEcosystemRejectedEmail(to: string, params: { orgName: string; reason?: string }): Promise<SendResult> {
  const { subject, html } = ecosystemRejectedEmail(params);
  return send(to, subject, html);
}

export async function sendEcosystemInfoRequestedEmail(to: string, params: { orgName: string }): Promise<SendResult> {
  const { subject, html } = ecosystemInfoRequestedEmail(params);
  return send(to, subject, html);
}

export async function sendEvaluationCompleteEmail(to: string, params: Parameters<typeof evaluationCompleteEmail>[0]): Promise<SendResult> {
  const { subject, html } = evaluationCompleteEmail(params);
  return send(to, subject, html);
}

export async function sendContactRequestToStartupEmail(to: string, params: Parameters<typeof contactRequestToStartupEmail>[0]): Promise<SendResult> {
  const { subject, html } = contactRequestToStartupEmail(params);
  return send(to, subject, html);
}

export async function sendContactRequestAcceptedEmail(to: string, params: Parameters<typeof contactRequestAcceptedEmail>[0]): Promise<SendResult> {
  const { subject, html } = contactRequestAcceptedEmail(params);
  return send(to, subject, html);
}

export async function sendChallengePrizeEmail(to: string, params: Parameters<typeof challengePrizeEmail>[0]): Promise<SendResult> {
  const { subject, html } = challengePrizeEmail(params);
  return send(to, subject, html);
}

export async function sendDataExportReadyEmail(to: string, params: Parameters<typeof dataExportReadyEmail>[0]): Promise<SendResult> {
  const { subject, html } = dataExportReadyEmail(params);
  return send(to, subject, html);
}

export async function sendAlertNotificationEmail(to: string, params: Parameters<typeof alertNotificationEmail>[0]): Promise<SendResult> {
  const { subject, html } = alertNotificationEmail(params);
  return send(to, subject, html);
}

export async function sendEcosystemNewStartupAlertEmail(to: string, params: Parameters<typeof ecosystemNewStartupAlertEmail>[0]): Promise<SendResult> {
  const { subject, html } = ecosystemNewStartupAlertEmail(params);
  return send(to, subject, html);
}

export async function sendEcosystemDigestEmail(to: string, params: Parameters<typeof ecosystemDigestEmail>[0]): Promise<SendResult> {
  const { subject, html } = ecosystemDigestEmail(params);
  return send(to, subject, html);
}

export async function sendEcosystemApplicationEmail(to: string, params: Parameters<typeof ecosystemApplicationEmail>[0]): Promise<SendResult> {
  const { subject, html } = ecosystemApplicationEmail(params);
  return send(to, subject, html);
}

export async function sendEcosystemApplicationAdminEmail(to: string, params: Parameters<typeof ecosystemApplicationAdminEmail>[0]): Promise<SendResult> {
  const { subject, html } = ecosystemApplicationAdminEmail(params);
  return send(to, subject, html);
}
