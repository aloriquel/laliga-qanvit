import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "liga@qanvit.com";
const FN_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";

const DIVISION_DISPLAY: Record<string, string> = {
  ideation: "Ideation", seed: "Seed", growth: "Growth", elite: "Elite",
};
const VERTICAL_DISPLAY: Record<string, string> = {
  deeptech_ai: "Deeptech & AI", robotics_automation: "Robotics & Automation",
  mobility: "Mobility", energy_cleantech: "Energy & Cleantech", agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech", industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace", materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

type AlertPayload = {
  from?: string; to?: string; vertical?: string; division?: string;
  new_rank?: number; scope?: string;
};

function renderText(alertType: string, payload: AlertPayload): string {
  const d = (k?: string) => DIVISION_DISPLAY[k ?? ""] ?? k ?? "";
  const v = (k?: string) => VERTICAL_DISPLAY[k ?? ""] ?? k ?? "";
  switch (alertType) {
    case "moved_up_division":   return `Has subido a ${d(payload.to)}. Bienvenido.`;
    case "moved_down_division": return `Has bajado a ${d(payload.to)}. Revisa el feedback.`;
    case "new_top3_vertical":   return `Top ${payload.new_rank} en ${d(payload.division)} ${v(payload.vertical)}. Eres de los grandes.`;
    case "new_top10_vertical":  return `Top 10 en ${d(payload.division)} ${v(payload.vertical)}.`;
    case "new_top10_division":  return `Top 10 en la ${d(payload.division)} League.`;
    case "position_milestone":  return `Has mejorado tu posición (${payload.scope === "national" ? "nacional" : "división"}).`;
    default: return "Nueva notificación.";
  }
}

function emailSubject(alertType: string, payload: AlertPayload): string {
  switch (alertType) {
    case "moved_up_division":   return `[La Liga Qanvit] Has subido a ${DIVISION_DISPLAY[payload.to ?? ""] ?? payload.to} 🚀`;
    case "moved_down_division": return `[La Liga Qanvit] Cambio de división`;
    case "new_top3_vertical":   return `[La Liga Qanvit] Top ${payload.new_rank} en tu vertical 🥇`;
    case "new_top10_vertical":  return `[La Liga Qanvit] Estás en el Top 10`;
    case "new_top10_division":  return `[La Liga Qanvit] Top 10 en tu división`;
    case "position_milestone":  return `[La Liga Qanvit] Has ganado posiciones`;
    default: return "[La Liga Qanvit] Nueva notificación";
  }
}

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { alert_id: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { alert_id } = body;
  if (!alert_id) {
    return new Response(JSON.stringify({ error: "alert_id required" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Read alert with startup and profile
  const { data: alert, error: alertErr } = await supabase
    .from("startup_alerts")
    .select("*, startups(id, name, owner_id, notification_email_enabled, notification_frequency)")
    .eq("id", alert_id)
    .single();

  if (alertErr || !alert) {
    return new Response(JSON.stringify({ error: "Alert not found" }), { status: 404 });
  }

  const startup = (alert as Record<string, unknown>).startups as Record<string, unknown>;

  // Check notification settings
  if (!startup.notification_email_enabled) {
    await supabase.from("startup_alerts").update({ email_sent: false }).eq("id", alert_id);
    return new Response(JSON.stringify({ ok: true, skipped: "email_disabled" }));
  }

  const frequency = (startup.notification_frequency as string) ?? "immediate";
  if (frequency !== "immediate") {
    // V1: only 'immediate' is supported. Batch delivery is V1.5.
    return new Response(JSON.stringify({ ok: true, skipped: "non_immediate_frequency_v15" }));
  }

  // Get owner email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", startup.owner_id as string)
    .single();

  if (!profile?.email) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
  }

  const payload = (alert.payload ?? {}) as AlertPayload;
  const bodyText = renderText(alert.alert_type, payload);
  const subject = emailSubject(alert.alert_type, payload);

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1230;">
      <div style="background: #22183a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="color: #f4a9aa; font-size: 14px; font-weight: 600; margin: 0;">{ La Liga Qanvit }</p>
      </div>
      <div style="background: #f1e8f4; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">${bodyText}</p>
        <p style="font-size: 13px; color: #6b5b8a; margin-bottom: 24px;">
          Visita tu dashboard para ver todos los detalles y tu posición actualizada.
        </p>
        <a href="https://laliga.qanvit.com/dashboard"
           style="background: #22183a; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Ver en La Liga Qanvit →
        </a>
        <p style="font-size: 11px; color: #6b5b8a; margin-top: 24px;">
          Puedes cambiar tus preferencias de notificación en
          <a href="https://laliga.qanvit.com/dashboard/configuracion" style="color: #22183a;">configuración</a>.
        </p>
      </div>
    </div>
  `;

  if (!RESEND_API_KEY) {
    console.log(`[alert-dispatcher] DRY RUN — would send "${subject}" to ${profile.email}`);
    await supabase.from("startup_alerts").update({ email_sent: true }).eq("id", alert_id);
    return new Response(JSON.stringify({ ok: true, dry_run: true }));
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [profile.email],
      subject,
      html: htmlBody,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error("[alert-dispatcher] Resend error:", errText);
    return new Response(JSON.stringify({ error: "Email send failed" }), { status: 500 });
  }

  await supabase.from("startup_alerts").update({ email_sent: true }).eq("id", alert_id);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
