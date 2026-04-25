import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { getRecipientById } from "@/lib/awards/queries";
import StatusBadge from "@/components/awards/StatusBadge";
import ResultBadge from "@/components/awards/ResultBadge";

export const revalidate = 300;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getRecipientById(params.id);
  if (!r) return { title: "Empresa no encontrada · Hall of Fame" };
  return {
    title: `${r.company_name} · ${r.award.name} ${r.edition.edition_year} · La Liga Qanvit`,
    description:
      r.company_description_short ??
      `${r.company_name} fue ${r.result === "winner" ? "ganadora" : "finalista"} en ${r.award.name} ${r.edition.edition_year}.`,
  };
}

export default async function RecipientPage({ params }: Props) {
  const r = await getRecipientById(params.id);
  if (!r) notFound();

  const verifiedAt = r.current_status_updated_at
    ? new Date(r.current_status_updated_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    : null;

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: r.company_name,
    description: r.company_description_short ?? undefined,
    url: r.company_website ?? undefined,
    award: `${r.award.name} ${r.edition.edition_year}`,
    awardingBody: r.award.organizer,
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#1a1f3a" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />

      <section className="container-brand py-16 md:py-20 max-w-4xl">
        <Link
          href={`/premios/${r.award.slug}`}
          className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-white/80"
        >
          ← {r.award.name}
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ResultBadge result={r.result} />
          <StatusBadge
            status={r.current_status as "active" | "acquired" | "closed" | "pivoted" | "unknown"}
          />
        </div>

        <h1
          className="font-sora font-bold text-4xl md:text-6xl mt-3 leading-tight"
          style={{ color: "#e8d9b8" }}
        >
          {r.company_name}
        </h1>
        <p className="font-mono text-sm uppercase tracking-widest mt-3 text-white/65">
          {r.edition.category_value} · {r.edition.edition_year}
        </p>

        {/* Sobre la edición */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
          <h2
            className="font-sora font-bold text-xs uppercase tracking-widest"
            style={{ color: "#c9a96e" }}
          >
            Sobre la edición
          </h2>
          <p className="font-body text-sm text-white/80 mt-3 leading-relaxed">
            <strong>{r.award.name}</strong> · {r.award.organizer} · edición {r.edition.edition_year}{" "}
            · categoría {r.edition.category_value}.
          </p>
          {r.source_url && (
            <a
              href={r.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-body hover:underline"
              style={{ color: "#c9a96e" }}
            >
              Fuente original <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Sobre la empresa al recibir el premio */}
        {r.company_description_short && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
            <h2
              className="font-sora font-bold text-xs uppercase tracking-widest"
              style={{ color: "#c9a96e" }}
            >
              Sobre la empresa al recibir el premio
            </h2>
            <p className="font-body text-base text-white/85 mt-3 leading-relaxed">
              {r.company_description_short}
            </p>
            {r.company_website && (
              <p className="mt-4 text-sm">
                {r.current_status === "closed" ? (
                  <span className="font-mono line-through text-white/40">
                    {r.company_website}
                  </span>
                ) : (
                  <a
                    href={r.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-white/70 hover:text-white hover:underline inline-flex items-center gap-1"
                  >
                    {r.company_domain_root ?? r.company_website} <ExternalLink size={12} />
                  </a>
                )}
              </p>
            )}
          </div>
        )}

        {/* Estado actual */}
        {(r.current_status_evidence || verifiedAt) && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
            <h2
              className="font-sora font-bold text-xs uppercase tracking-widest"
              style={{ color: "#c9a96e" }}
            >
              Estado actual
            </h2>
            {r.current_status_evidence && (
              <p className="font-body text-sm text-white/80 mt-3 leading-relaxed">
                {r.current_status_evidence}
              </p>
            )}
            {verifiedAt && (
              <p className="font-mono text-xs text-white/45 mt-3">
                Última verificación: {verifiedAt}
              </p>
            )}
          </div>
        )}

        {/* Cross-link a Liga */}
        {r.startup_id && r.startup_slug && (
          <div
            className="mt-6 rounded-2xl border-2 p-6 md:p-7"
            style={{ borderColor: "#c9a96e", background: "rgba(201,169,110,0.06)" }}
          >
            <p
              className="font-sora font-bold text-xs uppercase tracking-widest"
              style={{ color: "#c9a96e" }}
            >
              📊 Activa en La Liga Qanvit
            </p>
            <p className="font-body text-sm text-white/85 mt-2">
              Esta empresa también participa en La Liga Qanvit con perfil propio.
            </p>
            <Link
              href={`/startup/${r.startup_slug}`}
              className="mt-4 inline-flex items-center gap-1 font-body font-semibold text-sm hover:underline"
              style={{ color: "#c9a96e" }}
            >
              Ver perfil en La Liga →
            </Link>
          </div>
        )}

        <p className="mt-16 text-xs font-mono text-white/40 leading-relaxed">
          {r.award.name} es una iniciativa de {r.award.organizer}. Marcas y nombres de
          premios son propiedad de sus respectivos organizadores.
        </p>
      </section>
    </div>
  );
}
