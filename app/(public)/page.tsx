import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Upload, Star, Trophy } from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Upload,
    title: "Sube tu deck",
    description:
      "Ficha tu startup en 2 minutos. Sube tu pitch deck en PDF y cuéntanos lo básico.",
  },
  {
    step: "02",
    icon: Star,
    title: "Recibe feedback",
    description:
      "Nuestro evaluador analiza tu deck en 7 dimensiones y te da feedback accionable basado en evidencia de tu propio texto.",
  },
  {
    step: "03",
    icon: Trophy,
    title: "Entra en la clasificación",
    description:
      "Te asignamos División (Ideation, Seed, Growth o Elite) y Vertical. Compites en el ranking nacional.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-24 md:py-36">
        <div className="container-brand flex flex-col items-start gap-8 max-w-3xl">
          <div className="font-sora text-brand-salmon text-sm font-semibold tracking-widest uppercase">
            {"{ La Liga Qanvit }"}
          </div>
          <h1 className="font-sora font-bold text-5xl md:text-7xl leading-tight">
            La liga de startups de España.
          </h1>
          <p className="font-body text-xl text-white/70 max-w-xl leading-relaxed">
            Sube tu deck. Recibe feedback. Entra en la clasificación.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/play"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl text-base px-8 py-4 h-auto"
              )}
            >
              Ficha tu startup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/ecosistema/aplicar"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base px-8 py-4 h-auto border border-white/20"
              )}
            >
              Soy un parque, cluster o asociación
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-brand-lavender py-20 md:py-28">
        <div className="container-brand">
          <div className="text-center mb-14">
            <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
              {"— { } —"}
            </p>
            <h2 className="font-sora font-bold text-4xl text-brand-navy">
              Cómo funciona
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div
                key={step}
                className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-brand-salmon text-sm font-medium">
                    {step}
                  </span>
                  <Icon className="h-5 w-5 text-brand-navy/40" />
                </div>
                <h3 className="font-sora font-semibold text-xl text-brand-navy">
                  {title}
                </h3>
                <p className="font-body text-ink-secondary text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard en vivo — skeleton */}
      <section className="bg-white py-20 md:py-28">
        <div className="container-brand">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-sora font-bold text-4xl text-brand-navy">
              Leaderboard en vivo
            </h2>
            <Link
              href="/liga"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-ink-secondary"
              )}
            >
              Ver todo
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Skeleton — replaced by real data in prompt #3 */}
          <div className="border border-border-soft rounded-card overflow-hidden shadow-card">
            <div className="bg-brand-navy/5 px-6 py-3 grid grid-cols-[2rem_1fr_auto_auto] gap-4 text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              <span>#</span>
              <span>Startup</span>
              <span className="hidden md:block">División · Vertical</span>
              <span>Score</span>
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="px-6 py-4 grid grid-cols-[2rem_1fr_auto_auto] gap-4 items-center border-t border-border-soft animate-pulse"
              >
                <div className="h-4 w-5 bg-brand-lavender rounded" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-lavender" />
                  <div className="h-4 w-32 bg-brand-lavender rounded" />
                </div>
                <div className="hidden md:block h-4 w-28 bg-brand-lavender rounded" />
                <div className="h-6 w-10 bg-brand-lavender rounded" />
              </div>
            ))}
          </div>

          <p className="mt-6 text-center font-mono text-sm text-ink-secondary">
            {"{ la liga está empezando }"} · Sé la primera en tu vertical.
          </p>
        </div>
      </section>
    </div>
  );
}
