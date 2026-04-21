import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPECTED_SECRET = Deno.env.get("ECOSYSTEM_ALERT_SECRET") ?? "laliga-dev-secret-32chars-local1";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "liga@qanvit.com";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://laliga.qanvit.com";

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI", robotics_automation: "Robotics & Automation",
  mobility: "Mobility", energy_cleantech: "Energy & Cleantech", agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech", industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace", materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};
const DIVISION_LABELS: Record<string, string> = {
  ideation: "🥚 Ideation", seed: "🌱 Seed", growth: "🚀 Growth", elite: "👑 Elite",
};

// ⚠️ DUPLICADO inline desde lib/emails/templates.ts (ecosystemNewStartupAlertEmail)
// Deno edge function cannot import Node modules.
function buildImmediateAlertEmail(params: {
  orgName: string;
  startupName: string;
  startupSlug: string;
  oneLiner: string | null;
  division: string | null;
  vertical: string | null;
  score: number | null;
  matchedReason: string;
}): { subject: string; html: string } {
  const divLabel = DIVISION_LABELS[params.division ?? ""] ?? params.division ?? "";
  const vertLabel = VERTICAL_LABELS[params.vertical ?? ""] ?? params.vertical ?? "";
  const subject = `[La Liga Qanvit] Nueva startup en ${vertLabel || params.matchedReason}: ${params.startupName}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="background:#f1e8f4;font-family:'Open Sans',sans-serif;margin:0;padding:24px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:#22183a;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <p style="color:#f4a9aa;font-size:13px;font-weight:600;letter-spacing:3px;margin:0;">{ La Liga Qanvit }</p>
    </div>
    <div style="background:#ffffff;padding:28px 32px;border:1px solid #e5d8ea;border-top:none;border-bottom:none;">
      <p style="font-size:15px;font-weight:600;color:#22183a;margin-top:0;">
        Nueva startup en tu vertical
      </p>
      <p style="font-size:13px;color:#6b5b8a;margin-bottom:20px;">
        Hola <strong>${params.orgName}</strong>, hay una nueva startup que encaja con vuestros criterios de seguimiento.
      </p>
      <div style="border:1px solid #e5d8ea;border-radius:12px;padding:20px;">
        <p style="font-size:16px;font-weight:700;color:#22183a;margin:0 0 4px;">${params.startupName}</p>
        ${params.oneLiner ? `<p style="font-size:13px;color:#6b5b8a;margin:0 0 12px;">${params.oneLiner}</p>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${divLabel ? `<span style="background:#f1e8f4;color:#22183a;font-size:11px;padding:3px 10px;border-radius:20px;">${divLabel}</span>` : ""}
          ${vertLabel ? `<span style="background:#f1e8f4;color:#22183a;font-size:11px;padding:3px 10px;border-radius:20px;">${vertLabel}</span>` : ""}
          ${params.score != null ? `<span style="background:#22183a;color:#f4a9aa;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">Score ${Math.round(params.score)}</span>` : ""}
        </div>
      </div>
      <div style="margin-top:20px;">
        <a href="${APP_URL}/startup/${params.startupSlug}"
           style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
          Ver perfil →
        </a>
      </div>
    </div>
    <div style="background:#f1e8f4;padding:12px 32px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="font-size:11px;color:#6b5b8a;margin:0;">
        Recibido por criterio: <code style="font-family:monospace;">${params.matchedReason}</code> ·
        <a href="${APP_URL}/ecosistema/dashboard" style="color:#6b5b8a;">Gestionar alertas</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

async function sendImmediateEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; email_id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log(`[ecosystem-alert-dispatcher] DRY RUN — would send "${params.subject}" to ${params.to}`);
    return { ok: true, email_id: "dry-run" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: RESEND_FROM, to: [params.to], subject: params.subject, html: params.html }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text };
  }

  const data = await res.json() as { id: string };
  return { ok: true, email_id: data.id };
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${EXPECTED_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { evaluation_id?: string; startup_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { evaluation_id, startup_id } = body;
  if (!evaluation_id || !startup_id) {
    return new Response(JSON.stringify({ error: "evaluation_id and startup_id required" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Load startup with all fields needed for the email card
  const { data: startup, error: startupErr } = await supabase
    .from("startups")
    .select("id, name, slug, one_liner, current_vertical, current_division, current_score, location_region")
    .eq("id", startup_id)
    .single();

  if (startupErr || !startup) {
    return new Response(JSON.stringify({ error: "Startup not found" }), { status: 404 });
  }

  // Find all ecosystem orgs with matching alert config
  const { data: configs } = await supabase
    .from("ecosystem_alerts_config")
    .select("org_id, verticals, regions, frequency, email_enabled");

  if (!configs?.length) {
    return new Response(JSON.stringify({ ok: true, notified: 0 }));
  }

  type AlertInsert = { org_id: string; startup_id: string; matched_reason: string };
  const inserts: AlertInsert[] = [];
  const immediateTargets: (AlertInsert & { frequency: string; email_enabled: boolean })[] = [];

  for (const config of configs) {
    const verticalMatch =
      config.verticals.length === 0 ||
      (startup.current_vertical && config.verticals.includes(startup.current_vertical));

    const regionMatch =
      config.regions.length === 0 ||
      (startup.location_region && config.regions.some((r: string) =>
        startup.location_region!.toLowerCase().includes(r.toLowerCase())
      ));

    if (!verticalMatch && !regionMatch) continue;

    const reason = verticalMatch && startup.current_vertical
      ? `vertical:${startup.current_vertical}`
      : `region:${startup.location_region}`;

    const entry: AlertInsert = { org_id: config.org_id, startup_id: startup.id, matched_reason: reason };
    inserts.push(entry);

    if (config.frequency === "immediate") {
      immediateTargets.push({ ...entry, frequency: config.frequency, email_enabled: config.email_enabled });
    }
  }

  // Upsert all alert rows (email_sent=false by default)
  if (inserts.length > 0) {
    await supabase
      .from("ecosystem_new_startup_alerts")
      .upsert(inserts, { onConflict: "org_id,startup_id", ignoreDuplicates: true });
  }

  // Send immediate emails
  let emailsSent = 0;
  for (const target of immediateTargets) {
    if (!target.email_enabled) continue;

    try {
      // Get org owner email
      const { data: org } = await supabase
        .from("ecosystem_organizations")
        .select("name, owner_id")
        .eq("id", target.org_id)
        .single();

      if (!org) continue;

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", org.owner_id)
        .single();

      if (!ownerProfile?.email) continue;

      const { subject, html } = buildImmediateAlertEmail({
        orgName: org.name,
        startupName: startup.name,
        startupSlug: startup.slug,
        oneLiner: startup.one_liner,
        division: startup.current_division,
        vertical: startup.current_vertical,
        score: startup.current_score,
        matchedReason: target.matched_reason,
      });

      const result = await sendImmediateEmail({ to: ownerProfile.email, subject, html });

      if (result.ok) {
        // Mark email_sent=true with timestamp
        await supabase
          .from("ecosystem_new_startup_alerts")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("org_id", target.org_id)
          .eq("startup_id", startup.id);

        emailsSent++;
        console.log(JSON.stringify({
          step: "immediate_alert_sent", org_id: target.org_id,
          startup_id: startup.id, email_id: result.email_id,
        }));
      } else {
        console.error(JSON.stringify({
          step: "immediate_alert_failed", org_id: target.org_id,
          startup_id: startup.id, error: result.error,
        }));
      }
    } catch (err) {
      console.error(JSON.stringify({
        step: "immediate_alert_error", org_id: target.org_id, error: String(err),
      }));
    }
  }

  return new Response(
    JSON.stringify({ ok: true, notified: inserts.length, emails_sent: emailsSent }),
    { headers: { "Content-Type": "application/json" } },
  );
});
