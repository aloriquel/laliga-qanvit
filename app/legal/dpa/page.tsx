import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Agreement (DPA)",
  description: "Acuerdo de tratamiento de datos para organizaciones del ecosistema de La Liga Qanvit.",
};

export default function DpaPage() {
  return (
    <>
      <h1>Data Processing Agreement (DPA)</h1>
      <p className="text-sm text-ink-secondary">Última actualización: abril 2025</p>

      <div className="bg-brand-lavender rounded-lg p-4 text-sm text-ink-secondary mb-6">
        Este DPA aplica a las <strong>organizaciones del ecosistema</strong> (parques tecnológicos, clusters, aceleradoras y asociaciones) que accedan a datos de startups a través de La Liga Qanvit. Para startups individuales, ver la <a href="/legal/privacidad" className="text-brand-navy underline">Política de privacidad</a>.
      </div>

      <h2>1. Roles de las partes</h2>
      <ul>
        <li><strong>Responsable del tratamiento:</strong> FQ Source Technologies, S.L. («Qanvit»). Determina los fines y medios del tratamiento de datos de startups.</li>
        <li><strong>Encargado del tratamiento:</strong> La organización del ecosistema que firma este DPA. Trata datos de startups según las instrucciones de Qanvit.</li>
      </ul>

      <h2>2. Objeto y instrucciones</h2>
      <p>
        Qanvit encarga al ecosistema el tratamiento de datos de startups exclusivamente para:
      </p>
      <ul>
        <li>Consulta de perfiles públicos a través de la plataforma.</li>
        <li>Exportación de datos para análisis privado del ecosistema, en los límites del Tier contratado.</li>
        <li>Actividades de matchmaking con Corporates, siempre con consentimiento explícito de la startup.</li>
      </ul>
      <p>
        El ecosistema no puede usar los datos para ninguna finalidad no autorizada expresamente.
      </p>

      <h2>3. Confidencialidad</h2>
      <p>
        El ecosistema se compromete a mantener la confidencialidad de los datos de startups y a que solo accedan personas autorizadas con obligación de confidencialidad.
      </p>

      <h2>4. Medidas de seguridad</h2>
      <p>El ecosistema implementará medidas técnicas y organizativas que incluyan como mínimo:</p>
      <ul>
        <li>Acceso a la plataforma con autenticación segura (MFA recomendado).</li>
        <li>No almacenar decks ni datos sensibles de startups fuera de la plataforma sin autorización expresa.</li>
        <li>Notificación inmediata a Qanvit ante cualquier brecha de seguridad.</li>
      </ul>

      <h2>5. Subencargados</h2>
      <p>
        Qanvit utiliza los siguientes subencargados aprobados: Supabase (almacenamiento), Anthropic (evaluación), OpenAI (embeddings), Resend (email), Vercel (hosting). El ecosistema puede consultar la lista actualizada escribiendo a <a href="mailto:dpo@qanvit.com">dpo@qanvit.com</a>.
      </p>

      <h2>6. Derechos de los interesados</h2>
      <p>
        Si el ecosistema recibe una solicitud de ejercicio de derechos de una startup, debe redirigirla a Qanvit en un plazo máximo de 48 horas.
      </p>

      <h2>7. Notificación de brechas</h2>
      <p>
        El ecosistema notificará a Qanvit en un plazo máximo de 24 horas desde que tenga conocimiento de cualquier brecha de seguridad que afecte a datos de startups.
      </p>

      <h2>8. Devolución y eliminación de datos</h2>
      <p>
        Al terminar la relación con La Liga Qanvit, el ecosistema eliminará o devolverá todos los datos de startups en su posesión en un plazo de 30 días.
      </p>

      <h2>9. Auditoría</h2>
      <p>
        Qanvit puede auditar el cumplimiento de este DPA con 30 días de preaviso, a un coste razonable.
      </p>

      <h2>10. Firma del DPA</h2>
      <p>
        Para firmar el DPA con tu organización, escribe a <a href="mailto:dpo@qanvit.com">dpo@qanvit.com</a> indicando el nombre de la organización, CIF y persona de contacto responsable del tratamiento.
      </p>
    </>
  );
}
