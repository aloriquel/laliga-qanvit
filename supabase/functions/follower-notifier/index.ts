import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "liga@qanvit.com";
const FN_SECRET = Deno.env.get("FOLLOWER_NOTIFIER_FN_SECRET") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://laliga.qanvit.com";

type EventType = "new_deck" | "division_up" | "top3_vertical";

type AlertRow = {
  id: string;
  follower_id: string;
  startup_id: string;
  event_type: EventType;
  payload: Record<string, unknown>;
};

type FollowerRow = {
  email: string;
  email_verified_at: string | null;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
};

type StartupRow = {
  name: string;
  slug: string;
};

function buildHtml(
  eventType: EventType,
  startupName: string,
  startupSlug: string,
  payload: Record<string, unknown>,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const header = `
    <div style="background:#22183a;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <p style="color:#f4a9aa;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;margin:0;">{ La Liga Qanvit }</p>
    </div>`;
  const footer = `
    <p style="font-size:11px;color:#6b5b8a;margin-top:24px;line-height:1.5;">
      Recibes este email porque te suscribiste a las novedades de esta startup en La Liga Qanvit.<br/>
      <a href="${unsubscribeUrl}" style="color:#6b5b8a;">Darme de baja</a>
      &nbsp;·&nbsp;
      <a href="${APP_URL}/legal/privacidad" style="color:#6b5b8a;">Privacidad</a>
    </p>`;
  const profileUrl = `${APP_URL}/startup/${startupSlug}`;
  const cta = (label: string) => `
    <a href="${profileUrl}" style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">${label} →</a>`;

  let subject: string;
  let body: string;
  if (eventType === "new_deck") {
    subject = `${startupName} ha actualizado su deck en La Liga Qanvit`;
    body = `
      <p style="font-size:16px;font-weight:700;margin-top:0;">📄 ${startupName} tiene una nueva evaluación</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">Entra a ver su posición actualizada, feedback de IA y próximos pasos.</p>
      ${cta("Ver la nueva evaluación")}`;
  } else if (eventType === "division_up") {
    const from = (payload.from as string) ?? "";
    const to = (payload.to as string) ?? "";
    subject = `${startupName} sube a ${to} · La Liga Qanvit`;
    body = `
      <p style="font-size:16px;font-weight:700;margin-top:0;">📈 ${startupName} sube a ${to}</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">Promocionada desde ${from} a <strong>${to}</strong>. Descubre por qué y sigue su recorrido en La Liga.</p>
      ${cta("Ver perfil")}`;
  } else {
    const vertical = (payload.vertical as string) ?? "";
    const rank = (payload.rank as number) ?? 0;
    subject = `${startupName} entra en el Top 3 de ${vertical}`;
    body = `
      <p style="font-size:16px;font-weight:700;margin-top:0;">🥇 Top ${rank} en ${vertical}</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">${startupName} acaba de colarse en el Top 3 de su vertical.</p>
      ${cta("Ver perfil")}`;
  }

  const html = `
    <div style="font-family:'Open Sans',sans-serif;max-width:520px;margin:0 auto;color:#1a1230;">
      ${header}
      <div style="background:#f1e8f4;padding:28px 32px;">
        ${body}
        ${footer}
      </div>
    </div>`;
  return { subject, html };
}

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { follower_alert_id: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { follower_alert_id } = body;
  if (!follower_alert_id) {
    return new Response(JSON.stringify({ error: "follower_alert_id required" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: alert, error: aErr } = await supabase
    .from("follower_alerts")
    .select("id, follower_id, startup_id, event_type, payload")
    .eq("id", follower_alert_id)
    .single<AlertRow>();
  if (aErr || !alert) {
    return new Response(JSON.stringify({ error: "Alert not found" }), { status: 404 });
  }

  const { data: follower } = await supabase
    .from("startup_followers")
    .select("email, email_verified_at, unsubscribed_at, unsubscribe_token")
    .eq("id", alert.follower_id)
    .single<FollowerRow>();
  if (!follower) {
    await supabase.from("follower_alerts")
      .update({ email_sent: true, email_error: "follower_missing" })
      .eq("id", alert.id);
    return new Response(JSON.stringify({ sent: false, reason: "follower_missing" }));
  }

  if (!follower.email_verified_at || follower.unsubscribed_at) {
    await supabase.from("follower_alerts")
      .update({ email_sent: true, email_error: "follower_unsubscribed_or_unverified" })
      .eq("id", alert.id);
    return new Response(JSON.stringify({ sent: false, reason: "follower_unsubscribed_or_unverified" }));
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("name, slug")
    .eq("id", alert.startup_id)
    .single<StartupRow>();
  if (!startup) {
    return new Response(JSON.stringify({ error: "Startup not found" }), { status: 404 });
  }

  const unsubscribeUrl = `${APP_URL}/api/followers/unsubscribe?token=${encodeURIComponent(follower.unsubscribe_token)}`;
  const { subject, html } = buildHtml(alert.event_type, startup.name, startup.slug, alert.payload ?? {}, unsubscribeUrl);

  if (!RESEND_API_KEY) {
    console.log(`[follower-notifier] DRY RUN — would send "${subject}" to ${follower.email}`);
    await supabase.from("follower_alerts")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", alert.id);
    return new Response(JSON.stringify({ sent: true, dry_run: true }));
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [follower.email],
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error("[follower-notifier] Resend error:", errText);
    await supabase.from("follower_alerts")
      .update({ email_error: errText.slice(0, 500) })
      .eq("id", alert.id);
    return new Response(JSON.stringify({ error: "Email send failed" }), { status: 500 });
  }

  await supabase.from("follower_alerts")
    .update({ email_sent: true, email_sent_at: new Date().toISOString(), email_error: null })
    .eq("id", alert.id);

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});
