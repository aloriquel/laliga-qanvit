import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FullLeaderboardCTA() {
  return (
    <section className="bg-brand-lavender py-20 md:py-24">
      <div className="container-brand">
        <div className="bg-white rounded-card shadow-card border border-border-soft p-8 md:p-12 text-center max-w-3xl mx-auto">
          <p className="font-sora text-brand-salmon text-xs font-semibold tracking-widest uppercase mb-3">
            {"{ Ranking nacional }"}
          </p>
          <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy leading-tight">
            ¿Buscas el ranking completo?
          </h2>
          <p className="font-body text-ink-secondary mt-3 max-w-xl mx-auto">
            Ve la tabla con todas las startups, divisiones, verticales y momentum en tiempo real.
          </p>
          <Link
            href="/liga"
            className="mt-8 inline-flex items-center gap-2 bg-brand-navy text-white font-body font-semibold rounded-xl px-8 py-3.5 hover:bg-brand-navy/90 transition-colors"
          >
            Ver ranking completo <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
