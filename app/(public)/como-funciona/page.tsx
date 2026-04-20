import type { Metadata } from "next";
import Link from "next/link";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "De deck a clasificación nacional en menos de 60 segundos. Descubre cómo funciona La Liga Qanvit para startups y para el ecosistema.",
};

const STEPS = [
  {
    num: "01",
    title: "Sube tu deck",
    desc: "PDF de hasta 20 MB. Nuestro sistema lo lee completo, página a página, sin atajos.",
  },
  {
    num: "02",
    title: "Análisis automático",
    desc: "Un agente de IA evalúa tu deck con los mismos criterios que un panel de expertos: equipo, tracción, mercado, modelo de negocio, diferenciación tecnológica y más.",
  },
  {
    num: "03",
    title: "Score y feedback",
    desc: "Recibes un score del 0 al 100 con el desglose por dimensión y feedback accionable. No «está bien» sino qué falta, qué está débil y qué referencia consultar.",
  },
  {
    num: "04",
    title: "Clasificación en La Liga",
    desc: "Entras en la tabla nacional por División (Ideation → Seed → Growth → Elite) y Vertical tecnológico. Tú controlas qué es público.",
  },
];

const ECOSYSTEM_STEPS = [
  {
    num: "01",
    title: "Solicita acceso",
    desc: "Parques científicos, clusters, aceleradoras y asociaciones pueden solicitar acceso al ecosistema.",
  },
  {
    num: "02",
    title: "Gana puntos",
    desc: "Cada referral verificado, validación y reto completado suma puntos al ranking de tu organización.",
  },
  {
    num: "03",
    title: "Desbloquea acceso a datos",
    desc: "Los puntos desbloquean Tiers. Más Tier = más acceso a datos de startups de tu vertical y geografía.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto tarda la evaluación?",
    a: "Unos 40-60 segundos en condiciones normales. En momentos de alta carga puede tardar hasta 2 minutos.",
  },
  {
    q: "¿Quién ve mi deck?",
    a: "Solo tú y el equipo de Qanvit. Nunca lo comparte con otras startups ni con organizaciones del ecosistema. El ecosistema solo puede ver los datos que tú hayas marcado como públicos (score, división, vertical, resumen).",
  },
  {
    q: "¿Puedo volver a subir el deck?",
    a: "Sí. Hay un cooldown de 7 días entre reevaluaciones para evitar abuso. La evaluación anterior queda archivada.",
  },
  {
    q: "¿La IA entrena modelos con mi deck?",
    a: "No. Tu deck se procesa para generar la evaluación y los embeddings de búsqueda, pero no se usa para entrenar ningún modelo externo. Anthropic y OpenAI tienen sus propias políticas de no-training para clientes API.",
  },
  {
    q: "¿Qué pasa si no estoy de acuerdo con el score?",
    a: "Puedes impugnar la evaluación desde tu dashboard. Un humano del equipo Qanvit revisará y, si procede, corregirá la puntuación.",
  },
  {
    q: "¿Cómo elimino mis datos?",
    a: "Desde Configuración → Eliminar cuenta. Todos tus datos (deck, evaluaciones, embeddings) se borran de forma permanente en 30 días.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
        }}
      />

      <div className="bg-brand-lavender min-h-screen">
        {/* Hero */}
        <section className="bg-brand-navy text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-brand-salmon font-sora font-semibold text-sm mb-4">
              {"{ La Liga Qanvit }"}
            </p>
            <h1 className="font-sora font-bold text-4xl md:text-5xl mb-4">
              Cómo funciona
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              De deck a clasificación nacional en menos de 60 segundos.
            </p>
          </div>
        </section>

        {/* Para startups */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-sora font-bold text-3xl text-ink-primary mb-12">
              Para startups
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="bg-white rounded-card p-8 shadow-card border border-border-soft"
                >
                  <span className="font-sora font-bold text-4xl text-brand-salmon">
                    {step.num}
                  </span>
                  <h3 className="font-sora font-semibold text-xl text-ink-primary mt-3 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-ink-secondary text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/play"
                className="inline-block bg-brand-navy text-white font-sora font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                Ficha tu startup →
              </Link>
            </div>
          </div>
        </section>

        {/* Divisor */}
        <div className="text-center py-6 text-ink-secondary font-sora text-sm">
          — {"{ }"} —
        </div>

        {/* Para el ecosistema */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-sora font-bold text-3xl text-ink-primary mb-12">
              Para el ecosistema
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {ECOSYSTEM_STEPS.map((step) => (
                <div key={step.num} className="text-center">
                  <span className="font-sora font-bold text-5xl text-brand-salmon">
                    {step.num}
                  </span>
                  <h3 className="font-sora font-semibold text-lg text-ink-primary mt-3 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-ink-secondary text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/ecosistema/aplicar"
                className="inline-block border-2 border-brand-navy text-brand-navy font-sora font-semibold px-8 py-4 rounded-xl hover:bg-brand-lavender transition-colors"
              >
                Solicitar acceso ecosistema →
              </Link>
            </div>
          </div>
        </section>

        {/* Cómo usamos los datos */}
        <section className="py-20 px-4 bg-brand-lavender">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-sora font-bold text-3xl text-ink-primary mb-6">
              Cómo usamos los datos
            </h2>
            <div className="prose prose-slate max-w-none text-ink-secondary">
              <p>
                Tu deck se procesa en tres pasos: (1) extracción de texto,
                (2) generación de embeddings para búsqueda semántica y
                (3) evaluación por el agente LLM. Los embeddings viven en nuestra
                base de datos vectorial (Supabase + pgvector). El texto completo
                del deck solo es accesible para el equipo de Qanvit y la propia startup.
              </p>
              <p>
                Los datos estructurados (score, división, vertical, resumen) se
                usan para alimentar el dataset de agentes Qanvit. Esto significa
                que tu startup puede aparecer en resultados de búsqueda para
                Corporates usando la plataforma Qanvit, siempre con tu consentimiento
                explícito y solo los campos que hayas marcado como públicos.
              </p>
              <p>
                Más detalles en{" "}
                <Link href="/legal/privacidad" className="text-brand-navy underline">
                  Política de privacidad
                </Link>{" "}
                y{" "}
                <Link href="/legal/transparencia" className="text-brand-navy underline">
                  Página de transparencia
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-sora font-bold text-3xl text-ink-primary mb-10">
              Preguntas frecuentes
            </h2>
            <div className="space-y-6">
              {FAQ.map((item) => (
                <div
                  key={item.q}
                  className="border-b border-border-soft pb-6 last:border-0"
                >
                  <h3 className="font-sora font-semibold text-ink-primary mb-2">
                    {item.q}
                  </h3>
                  <p className="text-ink-secondary text-sm leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-brand-lavender rounded-card text-sm text-ink-secondary">
              ¿Más preguntas?{" "}
              <a
                href="mailto:hola@qanvit.com"
                className="text-brand-navy font-semibold hover:underline"
              >
                hola@qanvit.com
              </a>{" "}
              o consulta la{" "}
              <Link href="/legal/faq-gdpr" className="text-brand-navy font-semibold hover:underline">
                FAQ GDPR
              </Link>
              .
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
