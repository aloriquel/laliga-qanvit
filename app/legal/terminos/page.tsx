import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de servicio",
  description: "Condiciones de uso de La Liga Qanvit.",
};

export default function TerminosPage() {
  return (
    <>
      <h1>Términos de servicio</h1>
      <p className="text-sm text-ink-secondary">Última actualización: 22 de abril de 2026</p>

      <h2>1. Aceptación</h2>
      <p>
        Al registrarte y usar La Liga Qanvit (en adelante, «el Servicio»), operas por FQ Source Technologies, S.L. («Qanvit»), aceptas estos términos en su totalidad. Si no los aceptas, no uses el Servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        La Liga Qanvit es una plataforma que permite a startups subir su deck de presentación, recibir feedback automatizado generado por IA y figurar en una clasificación nacional por División y Vertical tecnológico.
      </p>

      <h2>3. Obligaciones del usuario (startup)</h2>
      <ul>
        <li>Proporcionar información veraz y actualizada sobre tu startup.</li>
        <li>Ser titular o tener los derechos necesarios sobre el contenido del deck que subas.</li>
        <li>No usar el Servicio para fines ilegales, fraudulentos o para enviar contenido abusivo, engañoso o que infrinja derechos de terceros.</li>
        <li>No realizar ataques automatizados, scraping masivo ni intentar acceder a datos de otras startups a los que no tienes derecho.</li>
        <li>Respetar el cooldown de reevaluación (7 días entre subidas).</li>
      </ul>

      <h2>4. Obligaciones de Qanvit</h2>
      <ul>
        <li>Proporcionar el Servicio con disponibilidad razonable (best-effort, sin SLA garantizado en V1).</li>
        <li>Proteger la confidencialidad de tu deck según la Política de privacidad.</li>
        <li>No garantizar una clasificación específica ni que el feedback sea infalible. La evaluación es orientativa.</li>
        <li>Reservarse el derecho a rechazar o eliminar contenido que infrinja estos términos.</li>
      </ul>

      <h2>5. Propiedad intelectual</h2>
      <p>
        <strong>Tu deck sigue siendo tuyo.</strong> Al subirlo, concedes a Qanvit una licencia no exclusiva, gratuita y revocable para procesarlo con el único propósito de prestarte el Servicio tal como se describe en la Política de privacidad. Qanvit no cede ni vende tu deck a terceros.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        El feedback generado por IA es orientativo y no constituye asesoramiento jurídico, financiero ni de inversión. Qanvit no es responsable de decisiones tomadas basándose en las evaluaciones. La responsabilidad máxima de Qanvit por cualquier reclamación se limita al importe abonado por el usuario en los 12 meses anteriores al incidente (o 0 € en el caso de acceso gratuito).
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        Qanvit puede modificar estos términos con 30 días de preaviso por email. El uso continuado del Servicio tras la entrada en vigor implica aceptación.
      </p>

      <h2>8. Terminación</h2>
      <p>
        Puedes cancelar tu cuenta en cualquier momento desde Configuración. Qanvit puede suspender o terminar el acceso ante infracciones graves de estos términos.
      </p>

      <h2>9. Jurisdicción y ley aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Jaén, con renuncia expresa a cualquier otro fuero.
      </p>

      <div className="mt-10 border-t border-border-soft pt-6 text-xs text-ink-secondary">
        Última revisión: 22 de abril de 2026. Para dudas, escribe a{" "}
        <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">holaqanvit@gmail.com</a>
      </div>
    </>
  );
}
