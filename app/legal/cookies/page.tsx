import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies usa La Liga Qanvit y cómo gestionarlas.",
};

export default function CookiesPage() {
  return (
    <>
      <h1>Política de cookies</h1>
      <p className="text-sm text-ink-secondary">Última actualización: abril 2025</p>

      <p>
        Esta política explica qué cookies y tecnologías similares usa La Liga Qanvit, con qué finalidad y cómo puedes gestionarlas.
      </p>

      <h2>1. Cookies técnicas (necesarias)</h2>
      <p>
        No requieren consentimiento. Son imprescindibles para el funcionamiento del Servicio.
      </p>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*</code> (Supabase Auth)</td>
            <td>Sesión autenticada. Sin ella no puedes acceder a tu dashboard.</td>
            <td>Sesión / hasta 1 semana</td>
          </tr>
          <tr>
            <td><code>NEXT_LOCALE</code></td>
            <td>Guarda tu preferencia de idioma (ES / EN).</td>
            <td>1 año</td>
          </tr>
          <tr>
            <td><code>qvt_ref</code></td>
            <td>Registra el código de referral que usaste para entrar, para atribuir el referido a la organización correcta.</td>
            <td>180 días</td>
          </tr>
          <tr>
            <td><code>cookie_consent</code></td>
            <td>Guarda tu decisión sobre cookies analíticas para no preguntarte en cada visita.</td>
            <td>1 año</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Cookies analíticas (opt-in)</h2>
      <p>
        Solo se activan si aceptas expresamente. Usamos <strong>PostHog</strong> para entender cómo se usa la plataforma y mejorarla. PostHog recibe: páginas visitadas, eventos de uso (upload, evaluación, etc.) y propiedades técnicas anónimas (tipo de dispositivo, navegador). <strong>No</strong> enviamos nombre, email ni contenido del deck a PostHog.
      </p>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ph_*</code> (PostHog)</td>
            <td>Analítica de producto: embudos de conversión, retención, eventos de uso.</td>
            <td>1 año</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Gestión del consentimiento</h2>
      <p>
        Al entrar por primera vez, un banner te ofrece:
      </p>
      <ul>
        <li><strong>Solo necesarias</strong>: no se activan las analíticas.</li>
        <li><strong>Aceptar todas</strong>: se activan las analíticas PostHog.</li>
        <li><strong>Personalizar</strong>: elige qué categorías activar.</li>
      </ul>
      <p>
        Puedes cambiar tu preferencia en cualquier momento desde el pie de página → «Cookies».
      </p>

      <h2>4. Cómo desactivar cookies en el navegador</h2>
      <p>
        También puedes gestionar cookies directamente en tu navegador:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-que-los-sitios-we" target="_blank" rel="noopener noreferrer">Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
      </ul>
      <p>
        Ten en cuenta que deshabilitar cookies técnicas puede impedir el funcionamiento del Servicio.
      </p>
    </>
  );
}
