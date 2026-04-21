import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "liga@qanvit.com";
const FN_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";

const APP_URL = "https://laliga.qanvit.com";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { frequency?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const frequency = body.frequency ?? "daily";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const cutoff = new Date(Date.now() - (frequency === "weekly" ? 7 : 1) * 24 * 3600 * 1000);

  // Get ecosystem members with digest preference matching this frequency
  const { data: members } = await supabase
    .from("ecosystem_members")
    .select("user_id, organization_id, profiles(email, full_name), ecosystem_organizations(name, slug)")
    .eq("notification_frequency", frequency)
    .eq("notification_email_enabled", true);

  if (!members?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }));
  }

  // Get new startups since cutoff (public, with scores)
  const { data: newStartups } = await supabase
    .from("startups")
    .select("id, name, slug, current_vertical, current_division")
    .eq("is_public", true)
    .eq("consent_public_profile", true)
    .gte("created_at", cutoff.toISOString())
    .order("current_score", { ascending: false })
    .limit(10);

  // Get new active challenges
  const { data: newChallenges } = await supabase
    .from("challenges")
    .select("id, title, description, status, voting_ends_at, active_ends_at")
    .in("status", ["voting", "active"])
    .gte("created_at", cutoff.toISOString())
    .limit(5);

  let sent = 0;

  for (const member of members) {
    const profile = (member as Record<string, unknown>).profiles as Record<string, unknown> | null;
    const org = (member as Record<string, unknown>).ecosystem_organizations as Record<string, unknown> | null;
    if (!profile?.email) continue;

    const subject = frequency === "weekly"
      ? `[La Liga Qanvit] Resumen semanal del ecosistema`
      : `[La Liga Qanvit] Novedades de hoy en La Liga`;

    const startupsHtml = newStartups?.length
      ? `<h3 style="color:#22183a;margin-bottom:8px;">Nuevas startups 🚀</h3><ul style="padding-left:20px;color:#1a1230;">` +
        newStartups.map(s =>
          `<li><a href="${APP_URL}/startup/${s.slug}" style="color:#22183a;font-weight:600;">${s.name}</a> — ${s.current_division ?? ""} · ${s.current_vertical ?? ""}</li>`
        ).join("") + `</ul>`
      : `<p style="color:#6b5b8a;">No hay nuevas startups en este periodo.</p>`;

    const challengesHtml = newChallenges?.length
      ? `<h3 style="color:#22183a;margin-bottom:8px;">Retos activos 🏆</h3><ul style="padding-left:20px;color:#1a1230;">` +
        newChallenges.map(c =>
          `<li><strong>${c.title}</strong> — ${c.status === "voting" ? "Votación abierta" : "En marcha"}</li>`
        ).join("") + `</ul>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1230;">
        <div style="background:#22183a;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <p style="color:#f4a9aa;font-size:14px;font-weight:600;margin:0;">{ La Liga Qanvit }</p>
          <p style="color:white;font-size:13px;margin:4px 0 0;">${frequency === "weekly" ? "Resumen semanal" : "Novedades de hoy"}</p>
        </div>
        <div style="background:#f1e8f4;padding:24px;border-radius:0 0 12px 12px;">
          <p style="margin-top:0;">Hola${profile.full_name ? ` ${profile.full_name}` : ""},</p>
          ${startupsHtml}
          ${challengesHtml}
          <div style="margin-top:24px;">
            <a href="${APP_URL}/ecosistema/dashboard" style="background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
              Ver dashboard →
            </a>
          </div>
          <p style="font-size:11px;color:#6b5b8a;margin-top:24px;">
            Puedes cambiar tus preferencias de notificación en
            <a href="${APP_URL}/ecosistema/dashboard/configuracion" style="color:#22183a;">configuración</a>.
          </p>
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.log(`[ecosystem-digest-sender] DRY RUN — would send to ${profile.email}`);
      sent++;
      continue;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: [profile.email], subject, html }),
    });

    if (res.ok) sent++;
    else console.error(`[ecosystem-digest-sender] Resend error for ${profile.email}:`, await res.text());
  }

  console.log(`[ecosystem-digest-sender] sent ${sent}/${members.length} digests (${frequency})`);
  return new Response(JSON.stringify({ ok: true, sent, total: members.length }));
});
