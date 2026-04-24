import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIVISION_TINT, type Division } from "@/lib/home/categories";
import type { EmptyCategory } from "@/lib/home/top-by-category";

type Props = {
  emptyCategories: EmptyCategory[];
};

const VERTICAL_TINT = "#e8e0f0"; // lavender-ish default for verticals

function tintFor(c: EmptyCategory): string {
  if (c.category_type === "division") {
    return DIVISION_TINT[c.category_value as Division] ?? VERTICAL_TINT;
  }
  return VERTICAL_TINT;
}

function PromoCategoryCard({ category }: { category: EmptyCategory }) {
  const href = `/play?${category.category_type}=${encodeURIComponent(category.category_value)}`;
  const tint = tintFor(category);
  const typeBadge = category.category_type === "division" ? "DIVISIÓN" : "VERTICAL";

  return (
    <Link
      href={href}
      aria-label={`Sé la primera startup en ${category.label}`}
      className="group relative block rounded-[20px] overflow-hidden border border-brand-navy/10 bg-white hover:border-brand-navy/30 hover:shadow-card transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
      style={{ aspectRatio: "4 / 3" }}
    >
      <div
        className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${tint}55 0%, transparent 70%)`,
        }}
      />
      <div className="relative h-full w-full flex flex-col justify-between p-5">
        <p className="font-sora text-[10px] font-semibold tracking-widest uppercase text-brand-navy/50">
          {typeBadge}
        </p>
        <div>
          <h3 className="font-sora font-bold text-brand-navy text-lg md:text-xl leading-tight">
            {category.label}
          </h3>
          {category.subtitle && (
            <p className="font-body text-ink-secondary text-xs md:text-sm mt-1 line-clamp-1">
              {category.subtitle}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 font-body font-semibold text-brand-salmon text-sm">
          Sé la primera <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export default function CategoryPromoGrid({ emptyCategories }: Props) {
  if (emptyCategories.length === 0) return null;
  const n = emptyCategories.length;
  const subtitle = n === 1 ? `${n} categoría espera su primera startup` : `${n} categorías esperan su primera startup`;

  return (
    <section id="categorias-disponibles" className="bg-white py-14 md:py-20">
      <div className="mb-10 px-6 md:px-12 lg:px-16">
        <p className="font-sora text-brand-navy/40 text-xs font-semibold tracking-widest uppercase mb-2">
          — Sección 3 —
        </p>
        <h2 className="font-sora font-bold text-3xl md:text-4xl text-brand-navy">
          Categorías disponibles
        </h2>
        <p className="font-body text-ink-secondary mt-1 max-w-xl">{subtitle}</p>
      </div>
      <div className="px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
          {emptyCategories.map((c) => (
            <PromoCategoryCard key={`${c.category_type}-${c.category_value}`} category={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
