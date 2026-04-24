import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Transparencia",
  description: "Quiénes somos, por qué hacemos esto y cómo usamos los datos en La Liga Qanvit.",
};

export const revalidate = 3600;

type PublicMetrics = {
  total_startups?: number | null;
  startups_with_score?: number | null;
  total_organizations?: number | null;
  avg_score?: number | null;
  pipeline_success_rate?: number | null;
};

async function getPublicMetrics(): Promise<PublicMetrics | null> {
  try {
    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("metrics_summary")
      .select("total_startups,startups_with_score,total_organizations,avg_score,pipeline_success_rate")
      .single();
    return data as PublicMetrics | null;
  } catch {
    return null;
  }
}

export default async function TransparenciaPage() {
  const metrics = await getPublicMetrics();

  return (
    <>
      <h1>Transparencia</h1>
      <p className="text-sm text-ink-secondary">
        Queremos ser una plataforma en la que confíes. Por eso explicamos abiertamente quiénes somos, por qué hacemos esto y cómo usamos los datos.
      </p>

      <h2>Quiénes somos</h2>
      <p>
        Somos <strong>FQ Source Technologies, S.L.</strong> (Qanvit), una startup española con sede en Jaén. Construimos agentes de IA para Corporate Venture e innovación abierta.
      </p>
      <p>
        La Liga Qanvit es nuestra plataforma pública de evaluación de startups. Es el primer producto de cara a la comunidad emprendedora española y sirve a la vez como fuente de datos estructurados para nuestros agentes.
      </p>

      <h2>Por qué hacemos esto</h2>
      <p>
        El ecosistema de innovación español tiene un problema de visibilidad: miles de startups técnicas con potencial real que no llegan a los actores relevantes. Los parques y clusters no tienen herramientas para descubrir y clasificar startups de forma sistemática. Los Corporates que quieren hacer open innovation tampoco.
      </p>
      <p>
        La Liga existe para resolver ese problema con datos. No con promesas.
      </p>

      <h2>Cómo usamos los datos</h2>
      <ol>
        <li>
          <strong>Evaluación:</strong> tu deck se procesa por un agente LLM (Claude de Anthropic) que extrae, analiza y puntúa el contenido. El texto no se guarda en los servidores de Anthropic.
        </li>
        <li>
          <strong>Embeddings:</strong> generamos vectores numéricos (OpenAI) para búsqueda semántica. No permiten recuperar el texto original.
        </li>
        <li>
          <strong>Dataset Qanvit:</strong> los datos estructurados (score, vertical, división, resumen) alimentan el agente de Structuring de Qanvit. Esto significa que startups que lo consientan pueden aparecer en resultados de búsqueda para Corporates que usen Qanvit. Siempre opt-in explícito.
        </li>
      </ol>
      <p>
        Más detalle en la <Link href="/legal/privacidad" className="text-brand-navy underline">Política de privacidad</Link>.
      </p>

      <h2>Qué modelos LLM usamos y por qué</h2>
      <ul>
        <li>
          <strong>Claude Opus (Anthropic)</strong> para evaluación profunda de decks. Elegido por su capacidad de razonamiento estructurado y comprensión de documentos largos.
        </li>
        <li>
          <strong>Claude Haiku (Anthropic)</strong> para tareas rápidas (clasificación, resumen corto).
        </li>
        <li>
          <strong>text-embedding-3-small (OpenAI)</strong> para embeddings de búsqueda semántica.
        </li>
      </ul>
      <p>
        Ambos proveedores tienen DPA con nosotros y no usan datos API para entrenar modelos.
      </p>

      {metrics && (
        <>
          <h2>Métricas en tiempo real</h2>
          <p className="text-sm text-ink-secondary">Actualizadas cada hora desde nuestra base de datos.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 not-prose my-4">
            {[
              { label: "Startups registradas", value: metrics.total_startups ?? "—" },
              { label: "Con evaluación", value: metrics.startups_with_score ?? "—" },
              { label: "Orgs verificadas", value: metrics.total_organizations ?? "—" },
              { label: "Score medio", value: metrics.avg_score != null ? `${metrics.avg_score}/100` : "—" },
              { label: "Éxito pipeline", value: metrics.pipeline_success_rate != null ? `${metrics.pipeline_success_rate}%` : "—" },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-brand-lavender rounded-lg p-4 text-center border border-border-soft"
              >
                <div className="font-sora font-bold text-2xl text-ink-primary">{m.value}</div>
                <div className="text-xs text-ink-secondary mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Empresa responsable</h2>
      <table>
        <tbody>
          <tr><td><strong>Razón social</strong></td><td>FQ Source Technologies, S.L.</td></tr>
          <tr><td><strong>CIF</strong></td><td>B24788796</td></tr>
          <tr><td><strong>Domicilio</strong></td><td>Calle Fuente de Don Diego, nº15, 4º I, 23001 Jaén, España</td></tr>
          <tr><td><strong>Web matriz</strong></td><td><a href="https://www.fqsource.com" target="_blank" rel="noopener noreferrer">fqsource.com</a></td></tr>
        </tbody>
      </table>
      <p>
        La Liga Qanvit es una iniciativa de <strong>Qanvit</strong>, producto de FQ Source Technologies, S.L. especializado en agentes de IA para Corporate Venture. La empresa opera actualmente dos productos:
      </p>
      <ul>
        <li><a href="https://www.fqsource.com" target="_blank" rel="noopener noreferrer">fqsource.com</a> — plataforma de IA para procurement industrial.</li>
        <li><a href="https://www.qanvit.com" target="_blank" rel="noopener noreferrer">qanvit.com</a> — agentes de IA para Corporate Venture e innovación abierta.</li>
      </ul>

      <h2>Nuestros compromisos</h2>
      <ul>
        <li>No venderemos datos de startups a terceros.</li>
        <li>No usaremos decks para entrenar modelos propios ni de terceros.</li>
        <li>Eliminaremos tus datos a petición, en los plazos legales.</li>
        <li>Publicaremos los cambios relevantes en esta página y notificaremos por email.</li>
        <li>Auditaremos el acceso a datos sensibles regularmente.</li>
      </ul>

      <div className="mt-8 p-4 bg-brand-lavender rounded-lg text-sm text-ink-secondary">
        ¿Preguntas? <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">holaqanvit@gmail.com</a>
        {" "}·{" "}
        <Link href="/legal/faq-gdpr" className="text-brand-navy font-semibold">FAQ GDPR</Link>
      </div>

      <div className="mt-10 border-t border-border-soft pt-6 text-xs text-ink-secondary">
        Última revisión: 22 de abril de 2026. Para dudas, escribe a{" "}
        <a href="mailto:holaqanvit@gmail.com" className="text-brand-navy font-semibold">holaqanvit@gmail.com</a>
      </div>
    </>
  );
}
