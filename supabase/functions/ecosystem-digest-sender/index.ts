import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "liga@qanvit.com";
const FN_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";
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

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { frequency?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const frequency = body.frequency ?? "daily";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Get active challenges for the digest (informational section)
  const { data: activeChallenges } = await supabase
    .from("challenges")
    .select("id, title, status")
    .in("status", ["voting", "active"])
    .limit(5);

  // Get all orgs configured for this frequency with email enabled
  const { data: configs } = await supabase
    .from("ecosystem_alerts_config")
    .select("org_id, frequency, email_enabled")
    .eq("frequency", frequency)
    .eq("email_enabled", true);

  if (!configs?.length) {
    console.log(`[ecosystem-digest-sender] No configs for frequency=${frequency}`);
    return new Response(JSON.stringify({ ok: true, sent: 0, skipped: 0 }));
  }

  let sent = 0;
  let skipped = 0;

  for (const config of configs) {
    // Get unsent alerts for this org
    const { data: pendingAlerts } = await supabase
      .from("ecosystem_new_startup_alerts")
      .select("id, startup_id, matched_reason")
      .eq("org_id", config.org_id)
      .eq("email_sent", false);

    if (!pendingAlerts?.length) {
      skipped++;
      continue;
    }

    // Fetch startup details for the pending alerts
    const startupIds = pendingAlerts.map(a => a.startup_id);
    const { data: startups } = await supabase
      .from("startups")
      .select("id, name, slug, current_vertical, current_division, current_score, one_liner")
      .in("id", startupIds)
      .order("current_score", { ascending: false })
      .limit(10);

    if (!startups?.length) {
      skipped++;
      continue;
    }

    // Fetch org owner email
    const { data: org } = await supabase
      .from("ecosystem_organizations")
      .select("name, owner_id")
      .eq("id", config.org_id)
      .single();

    if (!org) continue;

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", org.owner_id)
      .single();

    if (!ownerProfile?.email) continue;

    const subject = frequency === "weekly"
      ? `[La Liga Qanvit] Resumen semanal — ${startups.length} nueva${startups.length !== 1 ? "s" : ""} startup${startups.length !== 1 ? "s" : ""}`
      : `[La Liga Qanvit] Novedades de hoy — ${startups.length} nueva${startups.length !== 1 ? "s" : ""} startup${startups.length !== 1 ? "s" : ""}`;

    const startupsHtml = startups.map(s => {
      const div = DIVISION_LABELS[s.current_division ?? ""] ?? s.current_division ?? "";
      const vert = VERTICAL_LABELS[s.current_vertical ?? ""] ?? s.current_vertical ?? "";
      return `
        <div style="border:1px solid #e5d8ea;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
          <p style="font-size:15px;font-weight:700;color:#22183a;margin:0 0 4px;">
            <a href="${APP_URL}/startup/${s.slug}" style="color:#22183a;text-decoration:none;">${s.name}</a>
          </p>
          ${s.one_liner ? `<p style="font-size:12px;color:#6b5b8a;margin:0 0 8px;">${s.one_liner}</p>` : ""}
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${div ? `<span style="background:#f1e8f4;color:#22183a;font-size:11px;padding:2px 8px;border-radius:20px;">${div}</span>` : ""}
            ${vert ? `<span style="background:#f1e8f4;color:#22183a;font-size:11px;padding:2px 8px;border-radius:20px;">${vert}</span>` : ""}
            ${s.current_score != null ? `<span style="background:#22183a;color:#f4a9aa;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">Score ${Math.round(s.current_score)}</span>` : ""}
          </div>
        </div>`;
    }).join("");

    const challengesHtml = activeChallenges?.length
      ? `<div style="margin-top:20px;">
           <p style="font-size:13px;font-weight:700;color:#22183a;margin-bottom:8px;">Retos activos 🏆</p>
           <ul style="padding-left:18px;margin:0;color:#22183a;font-size:13px;">
             ${activeChallenges.map(c => `<li>${c.title} — ${c.status === "voting" ? "Votación abierta" : "En marcha"}</li>`).join("")}
           </ul>
         </div>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="background:#f1e8f4;font-family:'Open Sans',sans-serif;margin:0;padding:24px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:#22183a;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <p style="color:#f4a9aa;font-size:13px;font-weight:600;letter-spacing:3px;margin:0;">{ La Liga Qanvit }</p>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">${frequency === "weekly" ? "Resumen semanal" : "Novedades de hoy"}</p>
    </div>
    <div style="background:#ffffff;padding:28px 32px;border:1px solid #e5d8ea;border-top:none;border-bottom:none;">
      <p style="font-size:15px;font-weight:600;color:#22183a;margin-top:0;">
        Hola${ownerProfile.full_name ? ` ${ownerProfile.full_name}` : `, ${org.name}`},
      </p>
      <p style="font-size:13px;color:#6b5b8a;margin-bottom:20px;">
        ${frequency === "weekly" ? "Este es tu resumen semanal" : "Estas son las novedades de hoy"} en La Liga Qanvit.
        ${startups.length} nueva${startups.length !== 1 ? "s" : ""} startup${startups.length !== 1 ? "s" : ""} que encajan con vuestros criterios de seguimiento.
      </p>
      ${startupsHtml}
      ${challengesHtml}
      <div style="margin-top:24px;">
        <a href="${APP_URL}/ecosistema/dashboard"
           style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
          Ver dashboard →
        </a>
      </div>
    </div>
    <div style="background:#f1e8f4;padding:12px 32px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="font-size:11px;color:#6b5b8a;margin:0;">
        <a href="${APP_URL}/ecosistema/dashboard/configuracion" style="color:#6b5b8a;">Gestionar preferencias de notificación</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    if (!RESEND_API_KEY) {
      console.log(`[ecosystem-digest-sender] DRY RUN — would send to ${ownerProfile.email} (${startups.length} startups)`);
      sent++;
      continue;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: RESEND_FROM, to: [ownerProfile.email], subject, html }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(JSON.stringify({
          step: "digest_send_failed", org_id: config.org_id, email: ownerProfile.email, error: text,
        }));
        continue;
      }

      const emailData = await res.json() as { id: string };

      // Mark all pending alerts for this org as sent
      const alertIds = pendingAlerts.map(a => a.id);
      await supabase
        .from("ecosystem_new_startup_alerts")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .in("id", alertIds);

      sent++;
      console.log(JSON.stringify({
        step: "digest_sent", org_id: config.org_id, startups_count: startups.length,
        email_id: emailData.id, frequency,
      }));
    } catch (err) {
      console.error(JSON.stringify({
        step: "digest_error", org_id: config.org_id, error: String(err),
      }));
    }
  }

  console.log(`[ecosystem-digest-sender] frequency=${frequency} sent=${sent} skipped=${skipped}`);
  return new Response(JSON.stringify({ ok: true, sent, skipped, total: configs.length }));
});
