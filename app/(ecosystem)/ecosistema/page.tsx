import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowDown,
  ClipboardList,
  Search,
  Microscope,
  ListChecks,
  Columns3,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import {
  QANVIT_CONTACT_EMAIL,
  QANVIT_WEBSITE_URL,
  QANVIT_DISCOUNT_BY_TIER,
  QANVIT_DISCOUNT_TERMS,
} from "@/lib/ecosystem/qanvit-rewards";

export const metadata: Metadata = {
  title: "Ecosistema",
  description:
    "Qanvit: matchmakers de innovación corporativa para parques, clusters y asociaciones. Y La Liga Qanvit gratis como escaparate público.",
};

const STEPS: Array<{
  num: string;
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    num: "01",
    title: "Definir",
    body: "La IA estructura tu reto de innovación en un pliego técnico claro y comparable.",
    Icon: ClipboardList,
  },
  {
    num: "02",
    title: "Descubrir",
    body: "Agentes buscan startups relevantes en nuestra base propia y fuentes externas.",
    Icon: Search,
  },
  {
    num: "03",
    title: "Analizar",
    body: "Cada startup se evalúa: tecnología, equipo, tracción, madurez y señales de vida.",
    Icon: Microscope,
  },
  {
    num: "04",
    title: "Hacer match",
    body: "El motor puntúa y explica el encaje startup-reto. Shortlist accionable.",
    Icon: ListChecks,
  },
  {
    num: "05",
    title: "Gestionar pipeline",
    body: "Estados, scoring, NDAs y seguimiento hasta la implementación.",
    Icon: Columns3,
  },
];

const COMPARISON: Array<{
  label: string;
  axis: string;
  text: string;
  winner: boolean;
}> = [
  {
    label: "Crunchbase / BBDDs",
    axis: "Dato suelto · Búsqueda genérica",
    text: "Datos específicos, pero superficiales. Te dice qué startup existe, no si encaja con tu reto.",
    winner: false,
  },
  {
    label: "GPT / Deep research",
    axis: "Dato suelto · Matching especializado",
    text: "Análisis profundo, pero genérico. Útil para explorar, no para decidir.",
    winner: false,
  },
  {
    label: "Consultoría",
    axis: "Proceso completo · Búsqueda genérica",
    text: "Proceso a medida, pero no escala. Velocidad limitada por personas.",
    winner: false,
  },
  {
    label: "Qanvit",
    axis: "Proceso completo · Matching especializado",
    text: "Proceso completo y matching especializado. La única combinación que escala sin perder precisión.",
    winner: true,
  },
];

const TIERS: Array<{
  tier: "rookie" | "pro" | "elite";
  emoji: string;
  name: string;
  description: string;
}> = [
  {
    tier: "rookie",
    emoji: "🥉",
    name: "Rookie",
    description: "Recién aplicada al ecosystem.",
  },
  {
    tier: "pro",
    emoji: "🥈",
    name: "Pro",
    description: "Activa: vota startups, contribuye al ranking.",
  },
  {
    tier: "elite",
    emoji: "🥇",
    name: "Elite",
    description: "Top del ecosystem, scouting eye probado.",
  },
];

export default async function EcosistemaLandingPage() {
  let isEcosystemUser = false;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isEcosystemUser = profile?.role === "ecosystem";
    }
  } catch {
    // Supabase not configured in dev
  }

  return (
    <div className="flex flex-col">
      {/* A. Hero */}
      <section className="bg-brand-navy text-white py-24 md:py-32">
        <div className="container-brand max-w-3xl flex flex-col gap-6">
          <p className="font-sora text-brand-salmon text-sm font-semibold tracking-widest uppercase">
            QANVIT
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-6xl leading-tight">
            Matchmakers de innovación corporativa, para parques, clusters y asociaciones
          </h1>
          <p className="font-body text-lg text-white/70 max-w-2xl leading-relaxed">
            Qanvit convierte un reto de innovación abierta en un piloto ejecutándose.
            Un framework de cinco pasos con agentes de IA, base de datos propietaria
            y pipeline trazable. Ayudamos a definir retos mejor, descubrir oportunidades
            antes y acertar en la selección de startups.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={QANVIT_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl text-base px-8 py-4 h-auto"
              )}
            >
              Descubre Qanvit
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
          <a
            href="#liga"
            className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mt-2 font-body w-fit"
          >
            O participa gratis en La Liga Qanvit
            <ArrowDown className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* B. Diagnóstico */}
      <section className="bg-brand-navy text-white py-24 md:py-32 border-t border-white/5">
        <div className="container-brand max-w-5xl">
          <p className="font-sora text-brand-salmon text-xs font-semibold tracking-widest uppercase mb-4">
            EL PROBLEMA
          </p>
          <h2 className="font-sora font-bold text-3xl md:text-5xl leading-tight max-w-3xl">
            La innovación abierta falla por falta de proceso, no de intención
          </h2>
          <p className="font-body text-white/70 text-lg mt-4 max-w-2xl">
            Los responsables no quieren elegir. Quieren acertar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-14">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 md:p-10">
              <p className="font-sora font-extrabold text-brand-salmon text-6xl md:text-7xl leading-none tracking-tight">
                28%
              </p>
              <p className="font-body text-white/85 text-base md:text-lg mt-5 leading-relaxed">
                de las startups está satisfecha con sus colaboraciones corporativas.
              </p>
              <p className="font-mono text-white/50 text-xs mt-4 tracking-wide">
                McKinsey, 2021
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 md:p-10">
              <p className="font-sora font-extrabold text-brand-salmon text-6xl md:text-7xl leading-none tracking-tight">
                89%
              </p>
              <p className="font-body text-white/85 text-base md:text-lg mt-5 leading-relaxed">
                más probabilidad de éxito cuando hay una unidad dedicada con proceso estructurado.
              </p>
              <p className="font-mono text-white/50 text-xs mt-4 tracking-wide">
                Sopra Steria / Ipsos / INSEAD, 2023
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* C. Cómo funciona — 5 pasos */}
      <section className="bg-brand-lavender py-20 md:py-28">
        <div className="container-brand">
          <div className="max-w-2xl mb-12">
            <p className="font-sora text-brand-navy/40 text-xs font-semibold tracking-widest uppercase mb-2">
              CÓMO FUNCIONA QANVIT
            </p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy leading-tight">
              5 pasos. Un flujo completo.
            </h2>
            <p className="font-body text-ink-secondary mt-2">
              Desde definir el reto hasta cerrar el piloto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {STEPS.map(({ num, title, body, Icon }) => (
              <div
                key={num}
                className="relative bg-white rounded-card shadow-card border border-border-soft p-6 flex flex-col gap-3 overflow-hidden"
              >
                <span
                  className="absolute top-2 left-3 font-sora font-extrabold text-brand-navy/10 text-5xl leading-none pointer-events-none select-none"
                  aria-hidden
                >
                  {num}
                </span>
                <div className="h-10 w-10 rounded-xl bg-brand-navy/5 flex items-center justify-center mt-4 relative">
                  <Icon className="h-5 w-5 text-brand-navy" />
                </div>
                <h3 className="font-sora font-bold text-base text-brand-navy">
                  {title}
                </h3>
                <p className="font-body text-sm text-ink-secondary leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href={QANVIT_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-body font-semibold text-brand-navy hover:underline"
            >
              Ver Qanvit en detalle <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* D. Diferenciación */}
      <section className="bg-brand-navy text-white py-24 md:py-28">
        <div className="container-brand max-w-5xl">
          <p className="font-sora text-brand-salmon text-xs font-semibold tracking-widest uppercase mb-4">
            DIFERENCIACIÓN
          </p>
          <h2 className="font-sora font-bold text-3xl md:text-5xl leading-tight max-w-3xl">
            ¿Por qué Qanvit y no otra cosa?
          </h2>
          <p className="font-body text-white/70 text-base md:text-lg mt-4 max-w-3xl leading-relaxed">
            Dato suelto o proceso completo. Búsqueda genérica o matching especializado.
            Qanvit es la única combinación que resuelve las cuatro.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-12">
            {COMPARISON.map((c) => (
              <div
                key={c.label}
                className={cn(
                  "rounded-2xl p-6 md:p-7 flex flex-col gap-2 transition-colors",
                  c.winner
                    ? "bg-brand-salmon/10 border-2 border-brand-salmon shadow-[0_0_32px_rgba(244,169,170,0.12)]"
                    : "bg-white/[0.04] border border-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "font-sora font-bold text-lg md:text-xl",
                      c.winner ? "text-brand-salmon" : "text-white"
                    )}
                  >
                    {c.label}
                  </h3>
                  {c.winner && <CheckCircle2 size={18} className="text-brand-salmon" />}
                </div>
                <p
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-widest",
                    c.winner ? "text-brand-salmon/80" : "text-white/50"
                  )}
                >
                  {c.axis}
                </p>
                <p
                  className={cn(
                    "font-body text-sm leading-relaxed mt-2",
                    c.winner ? "text-white" : "text-white/70"
                  )}
                >
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E. La Liga Qanvit */}
      <section id="liga" className="bg-white py-20 md:py-28">
        <div className="container-brand max-w-4xl">
          <p className="font-sora text-brand-salmon text-sm font-semibold tracking-widest uppercase mb-3">
            LA LIGA QANVIT
          </p>
          <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy leading-tight">
            Además, puedes participar gratis en el escaparate
          </h2>
          <p className="font-body text-ink-secondary mt-4 text-base md:text-lg leading-relaxed max-w-3xl">
            La Liga Qanvit es el ranking público de startups técnicas españolas.
            Los parques, clusters y asociaciones del ecosystem pueden aplicar para
            ser evaluadores, descubrir startups antes que nadie y contribuir a la
            comunidad. Cuanto más aportáis, mayor descuento obtenéis en Qanvit.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((t) => (
              <div
                key={t.tier}
                className="bg-white rounded-2xl border border-border-soft p-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none" aria-hidden>{t.emoji}</span>
                  <h3 className="font-sora font-bold text-lg text-brand-navy">{t.name}</h3>
                </div>
                <p className="font-body text-sm text-ink-secondary leading-relaxed">
                  {t.description}
                </p>
                <p className="font-sora font-bold text-brand-salmon text-xl mt-auto">
                  {QANVIT_DISCOUNT_BY_TIER[t.tier]}% descuento en Qanvit
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 max-w-2xl">
            <p className="font-body text-xs text-ink-secondary/70">
              Para aplicar el descuento, escribe a{" "}
              <a href={`mailto:${QANVIT_CONTACT_EMAIL}`} className="underline text-brand-navy">
                {QANVIT_CONTACT_EMAIL}
              </a>{" "}
              indicando tu tier. Se aplica manualmente tras verificar.
            </p>
            <p className="font-body text-xs text-ink-secondary/60 mt-1">
              {QANVIT_DISCOUNT_TERMS}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href={isEcosystemUser ? "/ecosistema/dashboard" : "/ecosistema/aplicar"}
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-navy text-white hover:bg-brand-navy/90 font-semibold rounded-xl text-base px-8 py-4 h-auto"
              )}
            >
              {isEcosystemUser ? "Ir a mi dashboard" : "Aplicar al ecosistema"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/liga"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "text-brand-navy hover:bg-brand-navy/5 font-semibold rounded-xl text-base px-8 py-4 h-auto"
              )}
            >
              Ver el ranking público
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
