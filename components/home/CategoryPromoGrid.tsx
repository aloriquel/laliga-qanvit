"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIVISION_TINT, type Division } from "@/lib/home/categories";
import type { EmptyCategory } from "@/lib/home/top-by-category";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

type Props = {
  emptyCategories: EmptyCategory[];
};

const VERTICAL_TINT = "#e8e0f0";

function tintFor(c: EmptyCategory): string {
  if (c.category_type === "division") {
    return DIVISION_TINT[c.category_value as Division] ?? VERTICAL_TINT;
  }
  return VERTICAL_TINT;
}

function initialFor(c: EmptyCategory): string {
  return c.label.charAt(0).toUpperCase();
}

function PromoCategoryCard({ category }: { category: EmptyCategory }) {
  const href = `/play?${category.category_type}=${encodeURIComponent(category.category_value)}`;
  const tint = tintFor(category);
  const typeBadge = category.category_type === "division" ? "DIVISIÓN" : "VERTICAL";
  const ariaTail = category.category_type === "division" ? "esta división" : "este vertical";

  return (
    <Link
      href={href}
      aria-label={`Ficha tu startup en ${category.label}. Sé la primera en ${ariaTail}.`}
      className="group flex items-center gap-4 rounded-2xl border border-border-soft bg-white p-4 md:p-5 transition-colors duration-150 hover:border-brand-navy/30 hover:bg-brand-lavender/30 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
    >
      <div
        className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-sora font-semibold text-brand-navy text-base"
        style={{ backgroundColor: `${tint}55` }}
      >
        {initialFor(category)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-sora text-[10px] md:text-xs font-semibold uppercase text-brand-navy/50 tracking-[0.18em]">
          {typeBadge}
        </p>
        <h3 className="font-sora font-semibold text-base md:text-lg text-brand-navy leading-tight truncate">
          {category.label}
        </h3>
        {category.subtitle && (
          <p className="font-body text-xs md:text-sm text-ink-secondary/70 mt-0.5 line-clamp-1 md:line-clamp-2">
            {category.subtitle}
          </p>
        )}
      </div>

      <ArrowRight
        size={20}
        className="shrink-0 text-brand-navy/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150"
      />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {emptyCategories.map((c) => (
            <PromoCategoryCard key={`${c.category_type}-${c.category_value}`} category={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
