import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import {
  getAwardWithCounts,
  getRecipientsForAward,
  type RecipientWithEdition,
} from "@/lib/awards/queries";
import StatusBadge from "@/components/awards/StatusBadge";
import ResultBadge from "@/components/awards/ResultBadge";

export const revalidate = 300;

type Props = { params: { award_slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const award = await getAwardWithCounts(params.award_slug);
  if (!award) return { title: "Premio no encontrado · Hall of Fame" };
  return {
    title: `${award.name} · Hall of Fame · La Liga Qanvit`,
    description: award.description ?? `Historial de empresas premiadas en ${award.name}.`,
  };
}

function groupByYear(rows: RecipientWithEdition[]) {
  const byYear: Record<number, RecipientWithEdition[]> = {};
  for (const r of rows) {
    const y = r.edition.edition_year;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(r);
  }
  for (const y in byYear) {
    byYear[y].sort((a, b) => {
      // winners first, then alphabetical
      if (a.result !== b.result) return a.result === "winner" ? -1 : 1;
      return a.company_name.localeCompare(b.company_name, "es");
    });
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  return { byYear, years };
}

export default async function AwardPage({ params }: Props) {
  const award = await getAwardWithCounts(params.award_slug);
  if (!award) notFound();

  const recipients = await getRecipientsForAward(params.award_slug);
  const { byYear, years } = groupByYear(recipients);

  return (
    <div className="min-h-screen text-white" style={{ background: "#1a1f3a" }}>
      {/* Hero */}
      <section className="container-brand py-16 md:py-20 max-w-5xl border-b border-white/10">
        <Link
          href="/premios"
          className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-white/80"
        >
          ← Hall of Fame
        </Link>
        <p
          className="font-mono text-xs uppercase tracking-widest mt-6"
          style={{ color: "#c9a96e" }}
        >
          {award.organizer}
        </p>
        <h1
          className="font-sora font-bold text-3xl md:text-5xl mt-2 leading-tight"
          style={{ color: "#e8d9b8" }}
        >
          {award.name}
        </h1>
        {award.description && (
          <p className="font-body text-base md:text-lg text-white/70 mt-4 max-w-3xl leading-relaxed">
            {award.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-mono text-white/60">
          <span>{award.recipients_total} premiadas</span>
          <span>·</span>
          <span>{award.editions_total} ediciones</span>
          {award.start_year && (
            <>
              <span>·</span>
              <span>desde {award.start_year}</span>
            </>
          )}
          {award.website_url && (
            <>
              <span>·</span>
              <a
                href={award.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:underline"
              >
                Sitio oficial ↗
              </a>
            </>
          )}
        </div>
      </section>

      {/* Lista por año */}
      <section className="container-brand py-12 md:py-16 max-w-5xl">
        {years.length === 0 ? (
          <p className="font-body text-white/60">
            Aún no hay premiados registrados.
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            {years.map((year) => {
              const list = byYear[year];
              const winners = list.filter((r) => r.result === "winner");
              const finalists = list.filter((r) => r.result === "finalist");
              return (
                <div key={year} id={`year-${year}`}>
                  <div className="flex items-center justify-between mb-5">
                    <h2
                      className="font-sora font-bold text-2xl md:text-3xl"
                      style={{ color: "#e8d9b8" }}
                    >
                      {year}
                    </h2>
                    <span className="font-mono text-xs uppercase tracking-widest text-white/45">
                      {list.length} {list.length === 1 ? "registro" : "registros"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...winners, ...finalists].map((r) => (
                      <RecipientCard key={r.id} r={r} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-16 max-w-3xl text-xs font-mono text-white/40 leading-relaxed">
          Premio organizado por {award.organizer}.{" "}
          {award.organizer_url && (
            <a
              href={award.organizer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Información oficial ↗
            </a>
          )}
        </p>
      </section>
    </div>
  );
}

function RecipientCard({ r }: { r: RecipientWithEdition }) {
  return (
    <Link
      href={`/premios/recipient/${r.id}`}
      className="group block rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 transition-colors p-5"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3
          className="font-sora font-bold text-lg leading-tight"
          style={{ color: "#e8d9b8" }}
        >
          {r.company_name}
        </h3>
        <ResultBadge result={r.result} />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50 mt-2">
        {r.edition.category_value} · {r.edition.edition_year}
      </p>
      {r.company_description_short && (
        <p className="font-body text-sm text-white/70 mt-3 leading-snug line-clamp-3">
          {r.company_description_short}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge
          status={r.current_status as "active" | "acquired" | "closed" | "pivoted" | "unknown"}
        />
        <span
          className="text-xs font-body opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
          style={{ color: "#c9a96e" }}
        >
          Ver detalle <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
