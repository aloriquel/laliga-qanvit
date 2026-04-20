import { Resend } from "https://esm.sh/resend@4.0.0";

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
};

const DIVISION_EMOJIS: Record<string, string> = {
  ideation: "🥚",
  seed: "🌱",
  growth: "🚀",
  elite: "👑",
};

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI",
  robotics_automation: "Robotics & Automation",
  mobility: "Mobility",
  energy_cleantech: "Energy & Cleantech",
  agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech",
  industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace",
  materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

type NotifyArgs = {
  to: string;
  startupName: string;
  startupSlug: string;
  division: string;
  vertical: string;
  scoreTotal: number;
  rankDivisionVertical?: number;
  deckId: string;
};

export async function notifyStartup(args: NotifyArgs): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "liga@qanvit.com";
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://laliga.qanvit.com";

  if (!apiKey) {
    console.warn(JSON.stringify({ step: "notify", ok: false, reason: "RESEND_API_KEY not set, skipping email" }));
    return;
  }

  const resend = new Resend(apiKey);
  const divisionLabel = `${DIVISION_EMOJIS[args.division] ?? ""} ${DIVISION_LABELS[args.division] ?? args.division}`;
  const verticalLabel = VERTICAL_LABELS[args.vertical] ?? args.vertical;
  const rankText = args.rankDivisionVertical ? `#${args.rankDivisionVertical} en ${divisionLabel} · ${verticalLabel}` : `${divisionLabel} · ${verticalLabel}`;
  const profileUrl = `${appUrl}/startup/${args.startupSlug}`;
  const resultUrl = `${appUrl}/play/resultado/${args.deckId}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f1e8f4;font-family:'Open Sans',sans-serif;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#22183a;border-radius:24px;overflow:hidden;">
    <div style="padding:40px 40px 32px;text-align:center;">
      <p style="color:#f4a9aa;font-size:12px;font-weight:600;letter-spacing:4px;text-transform:uppercase;margin:0 0 16px;">{ La Liga Qanvit }</p>
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;line-height:1.3;">
        ${args.startupName} ya está en la liga
      </h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0;">${divisionLabel} · ${verticalLabel}</p>
    </div>
    <div style="background:#ffffff;margin:0 24px 0;border-radius:16px;padding:32px;text-align:center;">
      <p style="color:#6b5b8a;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Score</p>
      <p style="color:#22183a;font-size:64px;font-weight:700;margin:0;line-height:1;font-variant-numeric:tabular-nums;">${args.scoreTotal.toFixed(0)}</p>
      <p style="color:#6b5b8a;font-size:14px;margin:16px 0 0;">${rankText}</p>
    </div>
    <div style="padding:32px 40px 40px;text-align:center;">
      <a href="${resultUrl}" style="display:inline-block;background:#f4a9aa;color:#22183a;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;margin-bottom:12px;">
        Ver feedback completo
      </a>
      <br>
      <a href="${profileUrl}" style="color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none;">
        Ver perfil público →
      </a>
      <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:24px 0 0;">
        La Liga Qanvit · <a href="https://laliga.qanvit.com" style="color:rgba(255,255,255,0.3);">laliga.qanvit.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from,
    to: args.to,
    subject: `Tu startup está en La Liga Qanvit — ${divisionLabel} · ${verticalLabel}`,
    html,
  });
}
