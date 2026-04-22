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
        Email de contacto: <a href="mailto:hola@qanvit.com">hola@qanvit.com</a><br />
        Email del DPO: <a href="mailto:dpo@qanvit.com">dpo@qanvit.com</a>
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
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <ul>
        <li>Evaluar tu deck con IA y proporcionar feedback y clasificación.</li>
        <li>Mostrar tu posición en el leaderboard (solo con tu consentimiento explícito).</li>
        <li>Mejorar el servicio mediante análisis de uso agregado.</li>
        <li>Alimentar el agente de Structuring de Qanvit con datos anonimizados o con tu consentimiento explícito para contacto directo por parte de Corporates.</li>
      </ul>

      <h2>4. Base legal</h2>
      <ul>
        <li><strong>Consentimiento explícito</strong> para el tratamiento del deck y la aparición en el leaderboard público.</li>
        <li><strong>Ejecución de contrato</strong> para el acceso a la plataforma (alta de cuenta, evaluación).</li>
        <li><strong>Interés legítimo</strong> para el análisis de rendimiento técnico de la plataforma (sin PII).</li>
      </ul>

      <h2>5. Plazo de conservación</h2>
      <p>
        Tus datos se conservan mientras mantengas la cuenta activa, más 2 años desde el cierre para cumplimiento legal. Puedes solicitar la eliminación anticipada en cualquier momento.
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
        Anthropic y OpenAI procesan datos en Estados Unidos. Esta transferencia se ampara en las Standard Contractual Clauses (SCCs) adoptadas por la Comisión Europea (Decisión de Ejecución 2021/914). Puedes solicitar copia de las SCCs aplicables escribiendo a <a href="mailto:dpo@qanvit.com">dpo@qanvit.com</a>.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento los derechos de <strong>acceso, rectificación, supresión, oposición, portabilidad y retirada del consentimiento</strong> escribiendo a <a href="mailto:dpo@qanvit.com">dpo@qanvit.com</a> o desde el dashboard → Configuración → Eliminar cuenta.
      </p>
      <p>
        Si consideras que el tratamiento no se ajusta a la normativa, tienes derecho a presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Ver la <a href="/legal/cookies">política de cookies</a> para el detalle de cookies técnicas y analíticas.
      </p>

      <div className="mt-10 border-t border-border-soft pt-6 text-xs text-ink-secondary">
        Última revisión: 22 de abril de 2026. Para dudas, escribe a{" "}
        <a href="mailto:privacy@qanvit.com" className="text-brand-navy font-semibold">privacy@qanvit.com</a>
        {" "}o al responsable de protección de datos:{" "}
        <a href="mailto:contact@fqsource.com" className="text-brand-navy font-semibold">contact@fqsource.com</a>
      </div>
    </>
  );
}
