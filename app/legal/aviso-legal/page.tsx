import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Información legal sobre La Liga Qanvit y FQ Source Technologies, S.L.",
};

export default function AvisoLegalPage() {
  return (
    <>
      <h1>Aviso legal</h1>
      <p className="text-sm text-ink-secondary">Última actualización: 22 de abril de 2026</p>

      <h2>1. Datos de la empresa</h2>
      <table>
        <tbody>
          <tr><td><strong>Denominación social</strong></td><td>FQ Source Technologies, S.L.</td></tr>
          <tr><td><strong>CIF</strong></td><td>B24788796</td></tr>
          <tr><td><strong>Domicilio</strong></td><td>Calle Fuente de Don Diego, nº15, 4º I, 23001 Jaén, España</td></tr>
          <tr><td><strong>Email de contacto</strong></td><td><a href="mailto:holaqanvit@gmail.com">holaqanvit@gmail.com</a></td></tr>
          <tr><td><strong>Web corporativa</strong></td><td><a href="https://www.qanvit.com" target="_blank" rel="noopener noreferrer">www.qanvit.com</a></td></tr>
        </tbody>
      </table>

      <h2>2. Responsabilidad editorial</h2>
      <p>
        <strong>FQ Source Technologies, S.L.</strong> asume la responsabilidad editorial del contenido publicado en <strong>laliga.qanvit.com</strong>.
      </p>

      <h2>3. Objeto</h2>
      <p>
        El presente aviso legal regula el acceso y uso del sitio web <strong>laliga.qanvit.com</strong> y sus subdominios, titularidad de FQ Source Technologies, S.L.
      </p>

      <h2>4. Propiedad intelectual</h2>
      <p>
        El código fuente, diseño, logotipos, textos y demás contenidos del sitio son propiedad de FQ Source Technologies, S.L. o de sus licenciantes, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda prohibida su reproducción total o parcial sin autorización expresa.
      </p>

      <h2>5. Exclusión de garantías</h2>
      <p>
        El acceso al sitio web no implica ninguna obligación de continuidad. Qanvit no garantiza la disponibilidad ininterrumpida del servicio ni la ausencia de errores en el contenido.
      </p>

      <h2>6. Ley aplicable</h2>
      <p>
        Este aviso legal se rige por la legislación española. Cualquier controversia se someterá a los Juzgados y Tribunales de Jaén.
      </p>

      <div className="mt-10 border-t border-border-soft pt-6 text-xs text-ink-secondary">
        Última revisión: 22 de abril de 2026. Para dudas, escribe a{" "}
        <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">holaqanvit@gmail.com</a>
      </div>
    </>
  );
}
