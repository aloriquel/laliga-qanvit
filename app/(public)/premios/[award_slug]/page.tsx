import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  getAwardWithCounts,
  getRecipientsForAward,
  type RecipientWithEdition,
} from "@/lib/awards/queries";
import AwardCatalog, { type CatalogRecipient } from "@/components/awards/AwardCatalog";

export const revalidate = 300;

type Props = { params: { award_slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const award = await getAwardWithCounts(params.award_slug);
  if (!award) return { title: "Premio no encontrado · Hall of Fame" };
  return {
    title: `${award.name} · Hall of Fame · La Liga Qanvit`,
    description: `${award.recipients_total} ganadoras y finalistas de los ${award.name} · ${award.organizer}.`,
  };
}

function toCatalog(rows: RecipientWithEdition[]): CatalogRecipient[] {
  return rows.map((r) => ({
    id: r.id,
    company_name: r.company_name,
    company_description_short: r.company_description_short,
    edition_year: r.edition.edition_year,
    category_type: r.edition.category_type,
    category_value: r.edition.category_value,
    result: r.result,
    current_status: r.current_status,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    is_spanish_ecosystem: (r as any).is_spanish_ecosystem,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    company_country: (r as any).company_country ?? null,
  }));
}

export default async function AwardPage({ params }: Props) {
  const award = await getAwardWithCounts(params.award_slug);
  if (!award) notFound();

  const recipients = await getRecipientsForAward(params.award_slug);
  const catalog = toCatalog(recipients);

  const activeCount = catalog.filter((r) => r.current_status === "active").length;
  const years = catalog.map((r) => r.edition_year);
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;

  // Orphan years: editions known to have run (start_year → current year) but for
  // which we don't yet have a single recipient documented.
  const presentYears = new Set(years);
  const startYear = award.start_year ?? minYear;
  const endYear = new Date().getUTCFullYear();
  const orphanYears: number[] = [];
  if (startYear) {
    for (let y = startYear; y <= endYear; y++) {
      if (!presentYears.has(y)) orphanYears.push(y);
    }
  }

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

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl">
          <Stat label="Premiadas" value={String(award.recipients_total)} />
          <Stat
            label="Activas verificadas"
            value={String(activeCount)}
            tooltip="Empresas con web pública que respondió OK al verificar."
          />
          <Stat
            label="Ediciones cubiertas"
            value={
              minYear && maxYear
                ? `${presentYears.size} (${minYear}–${maxYear})`
                : String(presentYears.size)
            }
            tooltip="Número de ediciones anuales con al menos una empresa documentada."
          />
          <Stat
            label="Por documentar"
            value={String(orphanYears.length)}
            tooltip="Ediciones que sabemos que ocurrieron pero para las que aún no hay datos públicos."
          />
        </div>

        {award.website_url && (
          <p className="mt-6 text-sm font-mono text-white/55">
            <a
              href={award.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white hover:underline"
            >
              Sitio oficial ↗
            </a>
          </p>
        )}
      </section>

      <section className="container-brand py-10 md:py-14 max-w-5xl">
        <AwardCatalog recipients={catalog} awardIsGlobal={award.scope === "global"} />

        {orphanYears.length > 0 && (
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
            <h2
              className="font-sora font-bold text-xs uppercase tracking-widest"
              style={{ color: "#c9a96e" }}
            >
              Ediciones no disponibles
            </h2>
            <p className="font-body text-sm text-white/75 mt-3 leading-relaxed">
              Sabemos que {award.name} se celebró estos años, pero aún no hemos
              localizado fuentes públicas con la lista completa de premiadas y finalistas:
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {orphanYears.map((y) => (
                <li
                  key={y}
                  className="font-mono text-sm rounded-md border border-white/15 px-3 py-1 text-white/70"
                >
                  {y}
                </li>
              ))}
            </ul>
            <p className="font-body text-xs text-white/55 mt-5 leading-relaxed">
              Si tienes información oficial sobre alguna de estas ediciones, escríbenos a{" "}
              <a
                href="mailto:hola@qanvit.com"
                className="hover:underline"
                style={{ color: "#c9a96e" }}
              >
                hola@qanvit.com
              </a>{" "}
              y la incorporaremos al catálogo.
            </p>
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

function Stat({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
      title={tooltip}
    >
      <p
        className="font-sora font-bold text-2xl md:text-4xl leading-none"
        style={{ color: "#c9a96e" }}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-white/55 mt-2">
        {label}
      </p>
    </div>
  );
}
