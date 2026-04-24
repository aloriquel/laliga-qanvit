import Link from "next/link";
import CategoryRow from "./CategoryRow";
import type { CategoryRow as CategoryRowData } from "@/lib/home/top-by-category";

type Props = {
  divisionRows: CategoryRowData[];
  verticalRows: CategoryRowData[];
  totalStartups: number;
};

export default function HomeLeaderboardSections({
  divisionRows,
  verticalRows,
  totalStartups,
}: Props) {
  // Fallback: si literalmente no hay ninguna startup en toda la liga,
  // mostramos un CTA enorme en lugar de 14 rows vacías.
  if (totalStartups === 0) {
    return (
      <section className="bg-white py-24 md:py-32">
        <div className="container-brand text-center max-w-2xl">
          <p className="font-sora text-brand-salmon text-xs font-semibold tracking-widest uppercase mb-4">
            {"{ La Liga Qanvit }"}
          </p>
          <h2 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy leading-tight">
            La liga está a punto de empezar.
          </h2>
          <p className="font-body text-ink-secondary mt-4 text-lg">
            Sé la primera startup en entrar al ranking.
          </p>
          <Link
            href="/play"
            className="mt-8 inline-flex items-center gap-2 bg-brand-navy text-white font-body font-semibold rounded-xl px-8 py-4"
          >
            Ficha tu startup →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Por División */}
      <section id="por-division" className="bg-white pt-20 pb-14 md:pt-28 md:pb-20">
        <div className="mb-10 px-6 md:px-12 lg:px-16">
          <p className="font-sora text-brand-navy/40 text-xs font-semibold tracking-widest uppercase mb-2">
            — Sección 1 —
          </p>
          <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy">
            Por División
          </h2>
          <p className="font-body text-ink-secondary mt-1 max-w-xl">
            Clasifica según tu nivel de madurez: desde Ideation hasta Elite.
          </p>
        </div>
        <div className="flex flex-col gap-12 md:gap-14">
          {divisionRows.map((row) => (
            <CategoryRow key={`division-${row.category_value}`} row={row} />
          ))}
        </div>
      </section>

      {/* Separador sutil */}
      <div className="bg-white">
        <div className="container-brand">
          <div className="h-px bg-brand-navy/10" />
        </div>
      </div>

      {/* Por Vertical */}
      <section id="por-vertical" className="bg-white py-14 md:py-20">
        <div className="mb-10 px-6 md:px-12 lg:px-16">
          <p className="font-sora text-brand-navy/40 text-xs font-semibold tracking-widest uppercase mb-2">
            — Sección 2 —
          </p>
          <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy">
            Por Vertical
          </h2>
          <p className="font-body text-ink-secondary mt-1 max-w-xl">
            Clasifica según tu área técnica, en orden de actividad del ecosistema.
          </p>
        </div>
        <div className="flex flex-col gap-12 md:gap-14">
          {verticalRows.map((row) => (
            <CategoryRow key={`vertical-${row.category_value}`} row={row} />
          ))}
        </div>
      </section>
    </>
  );
}
