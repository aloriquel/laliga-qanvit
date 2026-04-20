const APP_URL = "https://laliga.qanvit.com";
const FROM = "liga@qanvit.com";

const BASE_STYLE = `
  font-family: 'Open Sans', sans-serif;
  max-width: 520px;
  margin: 0 auto;
  color: #1a1230;
`;

const HEADER_HTML = `
  <div style="background:#22183a;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <p style="color:#f4a9aa;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;margin:0;">
      { La Liga Qanvit }
    </p>
  </div>
`;

const FOOTER_HTML = `
  <div style="padding:16px 32px;text-align:center;font-size:11px;color:#6b5b8a;">
    <a href="${APP_URL}" style="color:#6b5b8a;">laliga.qanvit.com</a>
    &nbsp;·&nbsp;
    <a href="${APP_URL}/legal/privacidad" style="color:#6b5b8a;">Privacidad</a>
    &nbsp;·&nbsp;
    <a href="${APP_URL}/dashboard/configuracion" style="color:#6b5b8a;">Gestionar notificaciones</a>
  </div>
`;

function wrap(content: string): string {
  return `<div style="${BASE_STYLE}">${HEADER_HTML}<div style="background:#f1e8f4;padding:28px 32px;">${content}</div>${FOOTER_HTML}</div>`;
}

// 1. Welcome after registration
export function welcomeEmail(params: { name?: string }) {
  return {
    subject: "Bienvenido a La Liga Qanvit",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">
        Bienvenido${params.name ? `, ${params.name}` : ""}. 👋
      </p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Tu cuenta está lista. Ahora sube el deck de tu startup y entra en la clasificación nacional.
      </p>
      <a href="${APP_URL}/play"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Fichar mi startup →
      </a>
    `),
  };
}

// 2. Evaluation complete
export function evaluationCompleteEmail(params: {
  name?: string;
  startupName: string;
  score: number;
  division: string;
  vertical: string;
  rankNational?: number | null;
  slug: string;
}) {
  return {
    subject: `[La Liga Qanvit] Evaluación completada — ${params.startupName}`,
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">
        Tu deck ha sido evaluado.
      </p>
      <div style="background:white;border-radius:12px;padding:20px;margin:16px 0;text-align:center;border:1px solid #e5d8ea;">
        <div style="font-family:'Sora',sans-serif;font-size:48px;font-weight:800;color:#22183a;">${params.score}</div>
        <div style="font-size:13px;color:#6b5b8a;">Score / 100</div>
        <div style="font-size:14px;color:#1a1230;margin-top:8px;font-weight:600;">${params.division} · ${params.vertical}</div>
        ${params.rankNational ? `<div style="font-size:13px;color:#6b5b8a;">#${params.rankNational} nacional</div>` : ""}
      </div>
      <a href="${APP_URL}/dashboard/evaluaciones"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
        Ver feedback completo →
      </a>
    `),
  };
}

// 3. Division promotion
export function divisionPromotionEmail(params: {
  startupName: string;
  fromDivision: string;
  toDivision: string;
}) {
  return {
    subject: `[La Liga Qanvit] ${params.startupName} ha subido a ${params.toDivision} 🚀`,
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Has subido de División.</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        <strong>${params.startupName}</strong> ha ascendido de <strong>${params.fromDivision}</strong>
        a <strong>${params.toDivision}</strong>. Bienvenido al siguiente nivel.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Ver mi posición →
      </a>
    `),
  };
}

// 4. Ecosystem application received
export function ecosystemApplicationEmail(params: { orgName: string; contactEmail: string }) {
  return {
    subject: "[La Liga Qanvit] Solicitud de acceso al ecosistema recibida",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Solicitud recibida.</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Hemos recibido la solicitud de <strong>${params.orgName}</strong>.
        El equipo de Qanvit la revisará en las próximas 24-48 horas y te responderemos a <strong>${params.contactEmail}</strong>.
      </p>
    `),
  };
}

// 5. Ecosystem application approved
export function ecosystemApprovedEmail(params: { orgName: string }) {
  return {
    subject: "[La Liga Qanvit] ¡Solicitud aprobada! Acceso al ecosistema",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">¡Acceso aprobado!</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        La solicitud de <strong>${params.orgName}</strong> ha sido aprobada.
        Ya podéis acceder al dashboard del ecosistema con vuestra cuenta.
      </p>
      <a href="${APP_URL}/ecosistema/dashboard"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Ir al dashboard →
      </a>
    `),
  };
}

// 6. Challenge prize distributed
export function challengePrizeEmail(params: {
  name?: string;
  startupName: string;
  challengeTitle: string;
  rank: number;
  points: number;
}) {
  const rankLabel = params.rank === 1 ? "🥇 1.º" : params.rank === 2 ? "🥈 2.º" : "🥉 3.º";
  return {
    subject: `[La Liga Qanvit] Premio recibido en el reto: ${params.challengeTitle}`,
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">${rankLabel} en «${params.challengeTitle}»</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        <strong>${params.startupName}</strong> ha terminado en el puesto ${rankLabel} del reto
        y ha recibido <strong>${params.points} puntos</strong>.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Ver mis puntos →
      </a>
    `),
  };
}

// 7. Magic link / OTP (fallback, Supabase handles this natively)
export function magicLinkEmail(params: { email: string; link: string }) {
  return {
    subject: "[La Liga Qanvit] Tu enlace de acceso",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Tu enlace de acceso</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Haz clic en el botón para acceder a La Liga Qanvit con <strong>${params.email}</strong>.
        El enlace expira en 1 hora.
      </p>
      <a href="${params.link}"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Acceder a La Liga →
      </a>
      <p style="font-size:11px;color:#6b5b8a;margin-top:16px;">
        Si no solicitaste este enlace, puedes ignorar este email.
      </p>
    `),
  };
}

export { FROM };
