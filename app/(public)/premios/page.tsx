import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import { getAwards, getGlobalStats, getAwardWithCounts } from "@/lib/awards/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hall of Fame · La Liga Qanvit",
  description:
    "Catálogo histórico de startups premiadas por las iniciativas más relevantes del ecosistema español. Selección curada año a año.",
};

export default async function PremiosHubPage() {
  const [awards, stats] = await Promise.all([getAwards(), getGlobalStats()]);
  const awardCards = await Promise.all(awards.map((a) => getAwardWithCounts(a.slug)));

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#1a1f3a" }}
    >
      <section className="container-brand py-20 md:py-28 max-w-4xl">
        <p
          className="font-sora text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#c9a96e" }}
        >
          Hall of Fame
        </p>
        <h1
          className="font-sora font-bold text-4xl md:text-6xl leading-tight"
          style={{ color: "#e8d9b8" }}
        >
          Las startups técnicas que han marcado el ecosistema español
        </h1>
        <p className="font-body text-lg text-white/70 mt-6 max-w-2xl leading-relaxed">
          Catálogo histórico de empresas premiadas por las iniciativas más relevantes
          del ecosistema. Selección curada año a año.
        </p>

        {stats.total > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            <Stat label="Premiadas" value={stats.total} />
            <Stat label="Activas" value={stats.active} />
            <Stat label="Adquiridas" value={stats.acquired} />
            <Stat label="Cerradas" value={stats.closed} />
          </div>
        )}
      </section>

      <section className="container-brand pb-24 max-w-4xl">
        <div className="grid grid-cols-1 gap-5">
          {awardCards.filter((a): a is NonNullable<typeof a> => !!a).map((a) => (
            <Link
              key={a.id}
              href={`/premios/${a.slug}`}
              className="group block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 transition-colors p-7 md:p-8"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-white/50">
                {a.organizer}
              </p>
              <h2
                className="font-sora font-bold text-2xl md:text-3xl mt-1"
                style={{ color: "#e8d9b8" }}
              >
                {a.name}
              </h2>
              {a.description && (
                <p className="font-body text-sm text-white/70 mt-3 max-w-3xl leading-relaxed">
                  {a.description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-mono text-white/60">
                <span>{a.recipients_total} premiadas</span>
                <span>·</span>
                <span>{a.editions_total} ediciones</span>
                {a.start_year && (
                  <>
                    <span>·</span>
                    <span>desde {a.start_year}</span>
                  </>
                )}
              </div>
              <span
                className="mt-6 inline-flex items-center gap-1 font-body font-semibold text-sm group-hover:underline"
                style={{ color: "#c9a96e" }}
              >
                Ver historial <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-16 max-w-3xl text-xs font-mono text-white/40 leading-relaxed">
          Marcas y nombres de premios son propiedad de sus respectivos organizadores. Esta
          página recoge información de carácter factual con fines de divulgación e
          investigación.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p
        className="font-sora font-bold text-3xl md:text-4xl leading-none"
        style={{ color: "#c9a96e" }}
      >
        {value}
      </p>
      <p className="font-mono text-xs uppercase tracking-widest text-white/55 mt-2">
        {label}
      </p>
    </div>
  );
}
