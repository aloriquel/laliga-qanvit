import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo La Liga Qanvit trata y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p className="text-sm text-ink-secondary">Última actualización: 22 de abril de 2026</p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>FQ Source Technologies, S.L.</strong> (en adelante, «Qanvit»)<br />
        CIF: B24788796<br />
        Dirección: Calle Fuente de Don Diego, nº15, 4º I, 23001 Jaén, España<br />
        Email de contacto: <a href="mailto:holaqanvit@gmail.com">holaqanvit@gmail.com</a><br />
        Email del DPO: <a href="mailto:holaqanvit@gmail.com">holaqanvit@gmail.com</a>
      </p>

      <h2>2. Datos recopilados</h2>
      <p>Al usar La Liga Qanvit recopilamos:</p>
      <ul>
        <li><strong>Cuenta:</strong> dirección de email y, opcionalmente, nombre completo.</li>
        <li><strong>Deck:</strong> el archivo PDF que subes. Se almacena en un bucket privado en Supabase (EU).</li>
        <li><strong>Texto extraído:</strong> el contenido textual del deck, usado para evaluación y búsqueda semántica.</li>
        <li><strong>Embeddings:</strong> vectores numéricos generados a partir del texto. No contienen el texto original de forma recuperable.</li>
        <li><strong>Datos de evaluación:</strong> score, dimensiones, feedback generado por IA, historial de cambios de ranking.</li>
        <li><strong>Datos de uso:</strong> eventos de analítica (PostHog) con tu consentimiento previo.</li>
        <li><strong>Cookie de idioma:</strong> <code>NEXT_LOCALE</code>, no personal.</li>
        <li><strong>Cookie de referral:</strong> <code>qvt_ref</code>, para atribuir quién te invitó.</li>
        <li><strong>Email de seguimiento anónimo de startups:</strong> si optas por recibir novedades de una startup desde su perfil público, almacenamos tu email, la startup seguida, un token de confirmación (doble opt-in) y un token de baja (one-click).</li>
        <li><strong>Hash HMAC de IP:</strong> para prevenir votos duplicados anónimos, derivamos un hash HMAC-SHA256 de tu IP con un secreto servidor. No es reversible ni permite identificarte individualmente.</li>
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <ul>
        <li>Evaluar tu deck con IA y proporcionar feedback y clasificación.</li>
        <li>Mostrar tu posición en el leaderboard (solo con tu consentimiento explícito).</li>
        <li>Mejorar el servicio mediante análisis de uso agregado.</li>
        <li>Alimentar el agente de Structuring de Qanvit con datos anonimizados (siempre sin PII salvo consentimiento explícito).</li>
        <li>Enviar notificaciones por email sobre novedades de las startups que el usuario sigue explícitamente (nueva evaluación, subida de división, entrada en Top 3 vertical).</li>
      </ul>

      <h2>4. Base legal</h2>
      <ul>
        <li><strong>Consentimiento explícito</strong> para el tratamiento del deck y la aparición en el leaderboard público.</li>
        <li><strong>Ejecución de contrato</strong> para el acceso a la plataforma (alta de cuenta, evaluación).</li>
        <li><strong>Interés legítimo</strong> para el análisis de rendimiento técnico de la plataforma (sin PII).</li>
        <li><strong>Consentimiento explícito</strong> (art. 6.1.a GDPR) para el email de seguimiento anónimo de startups, manifestado mediante checkbox activo y confirmado vía doble opt-in por email.</li>
      </ul>

      <h2>5. Plazo de conservación</h2>
      <p>
        Tus datos se conservan mientras mantengas la cuenta activa, más 2 años desde el cierre para cumplimiento legal. Puedes solicitar la eliminación anticipada en cualquier momento.
      </p>
      <p>
        <strong>Email de seguimiento de startups:</strong> se conserva hasta que cancelas la suscripción mediante el link de baja presente en cada email, o tras 24 meses de inactividad (sin aperturas ni clics registrados).
      </p>

      <h2>6. Destinatarios y subencargados</h2>
      <table>
        <thead>
          <tr><th>Proveedor</th><th>Servicio</th><th>Garantías</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase, Inc.</td><td>Base de datos y almacenamiento (EU)</td><td>DPA + Standard Contractual Clauses</td></tr>
          <tr><td>Anthropic, PBC</td><td>Evaluación LLM del deck</td><td>DPA + SCC (datos en US)</td></tr>
          <tr><td>OpenAI, Inc.</td><td>Generación de embeddings</td><td>DPA + SCC (datos en US)</td></tr>
          <tr><td>Resend, Inc.</td><td>Envío de emails transaccionales</td><td>DPA + SCC</td></tr>
          <tr><td>Vercel, Inc.</td><td>Hosting frontend (fra1, EU)</td><td>DPA + SCC</td></tr>
          <tr><td>PostHog, Inc.</td><td>Analítica de producto (opt-in)</td><td>DPA + SCC</td></tr>
        </tbody>
      </table>

      <h2>7. Transferencias internacionales</h2>
      <p>
        Anthropic y OpenAI procesan datos en Estados Unidos. Esta transferencia se ampara en las Standard Contractual Clauses (SCCs) adoptadas por la Comisión Europea (Decisión de Ejecución 2021/914). Puedes solicitar copia de las SCCs aplicables escribiendo a <a href="mailto:holaqanvit@gmail.com">holaqanvit@gmail.com</a>.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento los derechos de <strong>acceso, rectificación, supresión, oposición, portabilidad y retirada del consentimiento</strong> escribiendo a <a href="mailto:holaqanvit@gmail.com">holaqanvit@gmail.com</a> o desde el dashboard → Configuración → Eliminar cuenta.
      </p>
      <p>
        Si consideras que el tratamiento no se ajusta a la normativa, tienes derecho a presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Ver la <a href="/legal/cookies">política de cookies</a> para el detalle de cookies técnicas y analíticas.
      </p>

      <h2 id="cookies">10. Cookies técnicas y analítica</h2>
      <ul>
        <li><code>qanvit_voted_&lt;slug&gt;</code>: marca que ya has votado a una startup; caducidad 24h; propósito: evitar múltiples envíos del mismo navegador.</li>
        <li><code>qanvit_follow_modal_shown_&lt;slug&gt;</code>: marca que se mostró el modal de suscripción tras el voto; caducidad 30 días; propósito: no abrir el modal repetidamente en visitas posteriores.</li>
        <li><code>qanvit_analytics_consent</code>: registra tu decisión sobre analítica (<em>accepted</em> / <em>rejected</em>); caducidad 13 meses; propósito: no volver a mostrar el banner mientras la decisión sea válida.</li>
        <li><code>ph_*</code> y <code>ph_session_*</code>: cookies puestas por <strong>PostHog</strong> (instancia EU) cuando aceptas analítica. Anonimizamos tu IP en origen y enmascaramos el contenido de los formularios en las grabaciones de sesión.</li>
      </ul>
      <p>
        Puedes cambiar tu decisión en cualquier momento desde el enlace «Cookies y analítica» del pie de página. Si rechazas, no se inicializa PostHog y no se envía ningún evento.
      </p>

      <h2 id="analytics">11. Analítica de uso (PostHog)</h2>
      <p>
        Usamos <strong>PostHog</strong> (Hog, Inc.) en su instancia europea para entender cómo se usa el producto. La base legal es tu consentimiento explícito vía el banner. Configuración aplicada:
      </p>
      <ul>
        <li>IP anonimizada en origen (<code>ip: false</code> en el cliente).</li>
        <li>Honra el header <code>Do Not Track</code>.</li>
        <li>Inicializa <em>opt-out por defecto</em>; sólo arranca tras tu aceptación.</li>
        <li>Grabaciones de sesión con masking de inputs (no se captura el contenido que tecleas en formularios) y sin grabar iframes externos.</li>
        <li>Datos procesados en EU (Frankfurt). PostHog Inc. tiene firmados DPA + SCCs.</li>
      </ul>

      <h2>12. Seguidores anónimos: ejercicio de derechos</h2>
      <p>
        Si sigues startups por email sin tener cuenta de usuario, puedes ejercer tus derechos de la siguiente forma:
      </p>
      <ul>
        <li><strong>Baja:</strong> enlace «Darme de baja» en cada email (GET one-click, RFC 8058). Surte efecto inmediato.</li>
        <li><strong>Acceso / supresión completa:</strong> escribe a <a href="mailto:holaqanvit@gmail.com">holaqanvit@gmail.com</a> indicando tu email de suscripción.</li>
      </ul>

      <div className="mt-10 border-t border-border-soft pt-6 text-xs text-ink-secondary">
        Última revisión: 22 de abril de 2026. Para dudas, escribe a{" "}
        <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">holaqanvit@gmail.com</a>
      </div>
    </>
  );
}
