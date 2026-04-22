import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ GDPR",
  description: "Preguntas frecuentes sobre privacidad y GDPR en La Liga Qanvit.",
};

const FAQ = [
  {
    q: "¿Dónde están mis datos físicamente?",
    a: "La base de datos y los archivos (decks) se almacenan en Supabase con región EU (Frankfurt). El frontend está en Vercel, región fra1 (Frankfurt). Los datos pasan por servidores de Anthropic y OpenAI en Estados Unidos únicamente durante el proceso de evaluación, amparado en Standard Contractual Clauses.",
  },
  {
    q: "¿Quién puede ver mi deck?",
    a: "Solo tú y el equipo de Qanvit. Los archivos PDF se almacenan en un bucket privado en Supabase. Ningún usuario del ecosistema puede descargar ni visualizar tu deck. Solo se expone el contenido que tú marques explícitamente como público (score, división, vertical, resumen).",
  },
  {
    q: "¿Puedo borrar mis datos?",
    a: "Sí. Desde Configuración → Eliminar cuenta, puedes solicitar la eliminación permanente de todos tus datos: perfil, deck, evaluaciones, embeddings y posición en el ranking. La eliminación se ejecuta en un plazo máximo de 30 días.",
  },
  {
    q: "¿Qué pasa con mis datos si Qanvit cierra?",
    a: "En caso de cierre de la plataforma, notificaremos a todos los usuarios con al menos 60 días de antelación y ofreceremos una exportación completa de todos tus datos antes de la fecha de cierre. Posteriormente, todos los datos se eliminarán de forma permanente.",
  },
  {
    q: "¿Mi deck se usa para entrenar modelos de IA?",
    a: "No. Tu deck se procesa para generar la evaluación (a través de la API de Anthropic) y los embeddings de búsqueda (a través de la API de OpenAI). Ni Anthropic ni OpenAI usan los datos enviados vía API para entrenar sus modelos, según sus políticas de uso para clientes API. Qanvit tampoco usa tus datos para entrenar modelos propios.",
  },
  {
    q: "¿Puedo obtener una copia de todos mis datos?",
    a: "Sí. Escribe a holaqanvit@gmail.com indicando tu email de registro. En un plazo de 30 días recibirás un archivo JSON con todos tus datos: perfil, evaluaciones, historial de ranking y preferencias. El deck se te enviará por un enlace de descarga seguro.",
  },
  {
    q: "¿Cómo retiro mi consentimiento para aparecer en el leaderboard?",
    a: "Desde Dashboard → Visibilidad, puedes marcar tu perfil como privado en cualquier momento. Tu startup desaparecerá del leaderboard público inmediatamente. Los datos permanecen en el dataset interno de Qanvit (sin PII si así lo solicitas) para mantener la integridad del ranking histórico.",
  },
  {
    q: "¿El ecosistema puede acceder a mi información sin que yo lo sepa?",
    a: "No. Las organizaciones del ecosistema solo acceden a los datos que tú hayas marcado explícitamente como públicos: nombre, score, división y vertical. El contenido de tu deck nunca es visible para el ecosistema.",
  },
  {
    q: "¿Cómo contacto al DPO?",
    a: "Escribe a holaqanvit@gmail.com. El DPO responde en un plazo máximo de 5 días hábiles. Para ejercicio formal de derechos GDPR (acceso, rectificación, supresión, oposición, portabilidad), el plazo de respuesta es de 30 días según la normativa.",
  },
];

export default function FaqGdprPage() {
  return (
    <>
      <h1>FAQ GDPR</h1>
      <p className="text-sm text-ink-secondary">Preguntas frecuentes sobre privacidad y protección de datos</p>

      <div className="space-y-8 mt-6">
        {FAQ.map((item, i) => (
          <div key={i} className="border-b border-border-soft pb-8 last:border-0">
            <h3 className="font-sora font-semibold text-ink-primary text-base mb-2">
              {item.q}
            </h3>
            <p className="text-ink-secondary text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-brand-lavender rounded-lg text-sm text-ink-secondary">
        <p className="font-semibold text-ink-primary mb-2">¿No encuentras tu respuesta?</p>
        <p>
          Escribe a{" "}
          <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">
            holaqanvit@gmail.com
          </a>{" "}
          o consulta la{" "}
          <Link href="/legal/privacidad" className="text-brand-navy font-semibold">
            Política de privacidad completa
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 border-t border-border-soft pt-6 text-xs text-ink-secondary">
        Última revisión: 22 de abril de 2026. Para dudas, escribe a{" "}
        <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">holaqanvit@gmail.com</a>
      </div>
    </>
  );
}
