import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import {
  getAwards,
  getGlobalStats,
  getAwardWithCounts,
  getSpotlightRecipients,
} from "@/lib/awards/queries";
import StatusBadge from "@/components/awards/StatusBadge";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hall of Fame · La Liga Qanvit",
  description:
    "Hall of Fame de La Liga Qanvit. Catálogo histórico de startups premiadas en el ecosistema técnico español.",
};

export default async function PremiosHubPage() {
  const [awards, stats, spotlight] = await Promise.all([
    getAwards(),
    getGlobalStats(),
    getSpotlightRecipients(5),
  ]);
  const awardCards = await Promise.all(awards.map((a) => getAwardWithCounts(a.slug)));
  const editionsTotal = awardCards
    .filter((a): a is NonNullable<typeof a> => !!a)
    .reduce((sum, a) => sum + a.editions_total, 0);

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
            <Stat label="Sin verificar" value={stats.unknown} />
            <Stat label="Ediciones" value={editionsTotal} />
          </div>
        )}
      </section>

      {/* Spotlight */}
      {spotlight.length > 0 && (
        <section className="container-brand pb-12 md:pb-16 max-w-5xl">
          <p
            className="font-mono text-xs uppercase tracking-widest mb-3"
            style={{ color: "#c9a96e" }}
          >
            Empresas destacadas
          </p>
          <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex md:grid md:grid-cols-5 gap-3 min-w-max md:min-w-0">
              {spotlight.map((s) => (
                <Link
                  key={s.id}
                  href={`/premios/recipient/${s.id}`}
                  className="group flex-shrink-0 w-[220px] md:w-auto rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 transition-colors p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                    {s.edition_year}
                  </p>
                  <h3
                    className="font-sora font-bold text-base mt-1 leading-snug line-clamp-2"
                    style={{ color: "#e8d9b8" }}
                  >
                    {s.company_name}
                  </h3>
                  <p className="font-body text-[11px] text-white/55 mt-1 line-clamp-1">
                    {s.category_value}
                  </p>
                  <div className="mt-3">
                    <StatusBadge
                      status={s.current_status as "active" | "acquired" | "closed" | "pivoted" | "unknown"}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-brand pb-24 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {awardCards.filter((a): a is NonNullable<typeof a> => !!a).map((a) => (
            <Link
              key={a.id}
              href={`/premios/${a.slug}`}
              className="group block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 transition-colors p-6 md:p-7"
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
