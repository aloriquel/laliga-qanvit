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

// 4b. Ecosystem application — admin notification
export function ecosystemApplicationAdminEmail(params: {
  orgName: string;
  orgType: string;
  contactEmail: string;
  website?: string;
  about?: string;
  region?: string;
  adminPanelUrl: string;
}) {
  const typeLabel = params.orgType.replace(/_/g, " ");
  return {
    subject: `[La Liga — Admin] Nueva aplicación de ecosistema: ${params.orgName}`,
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Nueva solicitud de ecosistema</p>
      <div style="background:white;border-radius:12px;padding:16px 20px;margin:12px 0;border:1px solid #e5d8ea;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#22183a;">${params.orgName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b5b8a;">Tipo: ${typeLabel}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b5b8a;">Contacto: ${params.contactEmail}</p>
        ${params.region ? `<p style="margin:4px 0 0;font-size:13px;color:#6b5b8a;">Región: ${params.region}</p>` : ""}
        ${params.website ? `<p style="margin:4px 0 0;font-size:13px;color:#6b5b8a;">Web: <a href="${params.website}" style="color:#22183a;">${params.website}</a></p>` : ""}
        ${params.about ? `<p style="margin:8px 0 0;font-size:12px;color:#6b5b8a;font-style:italic;">"${params.about.slice(0, 200)}${params.about.length > 200 ? "…" : ""}"</p>` : ""}
      </div>
      <a href="${params.adminPanelUrl}"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Revisar en el panel admin →
      </a>
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

// 7. Ecosystem rejected
export function ecosystemRejectedEmail(params: { orgName: string; reason?: string }) {
  return {
    subject: "[La Liga Qanvit] Solicitud de ecosistema no aprobada",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Solicitud no aprobada</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Tras revisar la solicitud de <strong>${params.orgName}</strong>, no hemos podido aprobarla en este momento.
        ${params.reason ? `<br/><br/>Motivo: <em>${params.reason}</em>` : ""}
      </p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Si crees que es un error o tienes más información, contáctanos en
        <a href="mailto:hola@qanvit.com" style="color:#22183a;">hola@qanvit.com</a>.
      </p>
    `),
  };
}

// 8. Ecosystem info requested
export function ecosystemInfoRequestedEmail(params: { orgName: string }) {
  return {
    subject: "[La Liga Qanvit] Necesitamos más información sobre vuestra solicitud",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Necesitamos un poco más de información</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Estamos revisando la solicitud de <strong>${params.orgName}</strong> y necesitamos más detalles.
        El equipo de Qanvit se pondrá en contacto contigo directamente.
      </p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        También puedes escribirnos a
        <a href="mailto:hola@qanvit.com" style="color:#22183a;">hola@qanvit.com</a>.
      </p>
    `),
  };
}

// 9. Data export ready
export function dataExportReadyEmail(params: {
  scope: string;
  recordCount: number;
  downloadUrl: string;
  expiresHours?: number;
}) {
  return {
    subject: "[La Liga Qanvit] Tu export de datos está listo",
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Export listo para descargar</p>
      <div style="background:white;border-radius:12px;padding:16px 20px;margin:12px 0;border:1px solid #e5d8ea;">
        <p style="margin:0;font-size:13px;color:#6b5b8a;">Scope: <strong>${params.scope}</strong></p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b5b8a;">Registros: <strong>${params.recordCount}</strong></p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b5b8a;">Expira en: <strong>${params.expiresHours ?? 24} horas</strong></p>
      </div>
      <a href="${params.downloadUrl}"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Descargar JSON →
      </a>
    `),
  };
}

// 12. Alert notification (⚠️ DUPLICADO desde edge function alert-dispatcher)
export function alertNotificationEmail(params: {
  alertType: string;
  bodyText: string;
  subject: string;
}) {
  return {
    subject: params.subject,
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">${params.bodyText}</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Visita tu dashboard para ver todos los detalles y tu posición actualizada.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Ver en La Liga Qanvit →
      </a>
    `),
  };
}

// 13. Ecosystem new startup alert (for immediate notify — producer writes to table, digest handles batch)
export function ecosystemNewStartupAlertEmail(params: {
  orgName: string;
  startupName: string;
  startupSlug: string;
  matchedReason: string;
}) {
  return {
    subject: `[La Liga Qanvit] Nueva startup en tu ecosistema: ${params.startupName}`,
    html: wrap(`
      <p style="font-size:16px;font-weight:600;margin-top:0;">Nueva startup en tu vertical / región</p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Hola <strong>${params.orgName}</strong>, hay una nueva startup que encaja con vuestros criterios de seguimiento.
      </p>
      <div style="background:white;border-radius:12px;padding:16px 20px;margin:12px 0;border:1px solid #e5d8ea;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#22183a;">${params.startupName}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b5b8a;font-family:monospace;">${params.matchedReason}</p>
      </div>
      <a href="${APP_URL}/startup/${params.startupSlug}"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Ver perfil →
      </a>
    `),
  };
}

// 14. Ecosystem digest (⚠️ DUPLICADO desde edge function ecosystem-digest-sender)
export function ecosystemDigestEmail(params: {
  orgName: string;
  recipientName?: string;
  frequency: "daily" | "weekly";
  newStartups: { name: string; slug: string; division?: string; vertical?: string }[];
}) {
  const label = params.frequency === "weekly" ? "Resumen semanal" : "Novedades de hoy";
  const startupsHtml = params.newStartups.length
    ? `<h3 style="color:#22183a;margin-bottom:8px;">Nuevas startups 🚀</h3><ul style="padding-left:20px;color:#1a1230;">` +
      params.newStartups.map(s => `<li><a href="${APP_URL}/startup/${s.slug}" style="color:#22183a;font-weight:600;">${s.name}</a>${s.division ? ` — ${s.division}` : ""}${s.vertical ? ` · ${s.vertical}` : ""}</li>`).join("") + `</ul>`
    : `<p style="color:#6b5b8a;">No hay nuevas startups en este periodo.</p>`;
  return {
    subject: params.frequency === "weekly" ? "[La Liga Qanvit] Resumen semanal del ecosistema" : "[La Liga Qanvit] Novedades de hoy en La Liga",
    html: wrap(`
      <p style="margin-top:0;font-size:14px;color:#6b5b8a;">${label} — ${params.orgName}</p>
      <p>Hola${params.recipientName ? ` ${params.recipientName}` : ""},</p>
      ${startupsHtml}
      <div style="margin-top:24px;">
        <a href="${APP_URL}/ecosistema/dashboard"
           style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
          Ver dashboard →
        </a>
      </div>
    `),
  };
}

// 16. Batch winner (one email per startup, consolidates multiple categories)
export function batchWinnerEmail(params: {
  startupName: string;
  startupSlug: string;
  batchDisplayName: string;
  batchSlug: string;
  categories: string[]; // pre-formatted labels, e.g. "🏆 Campeón Nacional"
  finalScore: number;
}) {
  const categoriesHtml = params.categories
    .map((c) => `<li style="margin:6px 0;font-size:14px;color:#22183a;font-weight:600;">${c}</li>`)
    .join("");
  const ogImage = `${APP_URL}/api/og/batch/${params.batchSlug}/champion/${params.startupSlug}`;
  const profileUrl = `${APP_URL}/startup/${params.startupSlug}`;
  return {
    subject: `🏆 Habéis ganado en ${params.batchDisplayName}`,
    html: wrap(`
      <p style="font-size:18px;font-weight:700;margin-top:0;color:#22183a;">
        ¡Felicidades, ${params.startupName}!
      </p>
      <p style="color:#6b5b8a;font-size:14px;line-height:1.6;">
        Tu startup ha ganado en <strong>${params.batchDisplayName}</strong>:
      </p>
      <ul style="padding-left:20px;margin:8px 0 16px;">
        ${categoriesHtml}
      </ul>
      <div style="background:white;border-radius:12px;padding:16px;margin:16px 0;text-align:center;border:1px solid #e5d8ea;">
        <div style="font-family:'Sora',sans-serif;font-size:40px;font-weight:800;color:#f4a9aa;">${params.finalScore.toFixed(1)}</div>
        <div style="font-size:12px;color:#6b5b8a;">Score final</div>
      </div>
      <img src="${ogImage}" alt="" style="width:100%;max-width:520px;border-radius:12px;margin:12px 0;" />
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}"
         style="display:inline-block;background:#22183a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
        Compartir en LinkedIn →
      </a>
    `),
  };
}

// 15. Magic link / OTP (fallback, Supabase handles this natively)
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
