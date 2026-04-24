import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowDown,
  MessageSquare,
  Search,
  FolderOpen,
  ListChecks,
  Zap,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import {
  QANVIT_CONTACT_EMAIL,
  QANVIT_WEBSITE_URL,
  QANVIT_DISCOUNT_BY_TIER,
} from "@/lib/ecosystem/qanvit-rewards";

export const metadata: Metadata = {
  title: "Ecosistema",
  description:
    "Qanvit: corporate venture con IA para parques, clusters y asociaciones. Y La Liga Qanvit gratis como escaparate público.",
};

const AGENTS: Array<{
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Structuring",
    body: "De reto a scope estructurado en minutos.",
    Icon: MessageSquare,
  },
  {
    title: "Discovering",
    body: "BBDD propietaria de más de 16.000 startups y tech companies españolas.",
    Icon: Search,
  },
  {
    title: "Coordinating",
    body: "Workspace con documentación, acuerdos y Q&A para el proyecto.",
    Icon: FolderOpen,
  },
  {
    title: "Evaluating",
    body: "Matriz de evaluación comparativa para el comité.",
    Icon: ListChecks,
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
      {/* A. HERO — Qanvit primero */}
      <section className="bg-brand-navy text-white py-24 md:py-32">
        <div className="container-brand max-w-3xl flex flex-col gap-6">
          <p className="font-sora text-brand-salmon text-sm font-semibold tracking-widest uppercase">
            QANVIT
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-6xl leading-tight">
            Corporate venture con IA, para parques, clusters y asociaciones
          </h1>
          <p className="font-body text-lg text-white/70 max-w-2xl leading-relaxed">
            Qanvit convierte un reto de innovación abierta en un piloto ejecutándose.
            Una base de datos propietaria de más de 16.000 startups y tech companies
            españolas, y cuatro agentes de IA que estructuran el reto, descubren
            candidatas, coordinan el proyecto y evalúan los resultados.
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

      {/* B. 4 agentes */}
      <section className="bg-brand-lavender py-20 md:py-28">
        <div className="container-brand">
          <div className="max-w-2xl mb-12">
            <p className="font-sora text-brand-navy/40 text-xs font-semibold tracking-widest uppercase mb-2">
              — Cómo funciona Qanvit —
            </p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy leading-tight">
              4 agentes. Un flujo completo.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {AGENTS.map(({ title, body, Icon }) => (
              <div
                key={title}
                className="bg-white rounded-card shadow-card border border-border-soft p-6 flex flex-col gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-navy/5 flex items-center justify-center">
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

      {/* C. La Liga Qanvit — escaparate gratis */}
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

          {/* Tabla de tiers */}
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

          <p className="font-body text-xs text-ink-secondary/70 mt-5 max-w-2xl">
            Para aplicar el descuento, escribe a{" "}
            <a href={`mailto:${QANVIT_CONTACT_EMAIL}`} className="underline text-brand-navy">
              {QANVIT_CONTACT_EMAIL}
            </a>{" "}
            indicando tu tier. Se aplica manualmente tras verificar.
          </p>

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

      {/* D. ¿Cuál es la diferencia? */}
      <section className="bg-brand-lavender py-20 md:py-24">
        <div className="container-brand max-w-5xl">
          <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy leading-tight text-center mb-12">
            ¿Cuál es la diferencia?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Qanvit */}
            <div className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-salmon/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-brand-salmon" />
              </div>
              <div>
                <p className="font-sora text-brand-salmon text-[10px] font-semibold tracking-widest uppercase">
                  El motor
                </p>
                <h3 className="font-sora font-bold text-2xl text-brand-navy">Qanvit</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-sm text-ink-secondary">
                <li>· BBDD propietaria de más de 16.000 startups y tech companies.</li>
                <li>· 4 agentes IA end-to-end.</li>
                <li>· Corporate venture real: de reto a piloto.</li>
              </ul>
              <a
                href={QANVIT_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1 font-body font-semibold text-brand-navy hover:underline text-sm"
              >
                Descubre Qanvit <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* La Liga */}
            <div className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-navy/5 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-brand-navy" />
              </div>
              <div>
                <p className="font-sora text-brand-navy/50 text-[10px] font-semibold tracking-widest uppercase">
                  El escaparate
                </p>
                <h3 className="font-sora font-bold text-2xl text-brand-navy">La Liga Qanvit</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-sm text-ink-secondary">
                <li>· Ranking público de startups técnicas.</li>
                <li>· Tu actividad en la Liga = descuento en Qanvit.</li>
                <li>· Gratis para aplicar al ecosystem.</li>
              </ul>
              <Link
                href="/ecosistema/aplicar"
                className="mt-auto inline-flex items-center gap-1 font-body font-semibold text-brand-navy hover:underline text-sm"
              >
                Aplicar al ecosistema <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
