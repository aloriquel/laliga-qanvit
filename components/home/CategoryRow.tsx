"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StartupCompactCard from "./StartupCompactCard";
import EmptySlotCard from "./EmptySlotCard";
import type { CategoryRow as CategoryRowData } from "@/lib/home/top-by-category";

type Props = {
  row: CategoryRowData;
};

export default function CategoryRow({ row }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const occupied = row.items.filter((i) => i.kind === "startup").length;

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const step = firstChild ? firstChild.getBoundingClientRect().width + 20 : 260;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section
      role="region"
      aria-label={row.title}
      className="relative group"
    >
      <div className="flex items-end justify-between mb-3 px-6 md:px-12 lg:px-16">
        <div>
          <h3 className="font-sora font-bold text-2xl md:text-3xl text-brand-navy leading-tight">
            {row.title}
          </h3>
          {row.subtitle && (
            <p className="font-body text-sm text-ink-secondary mt-0.5">
              {row.subtitle}
            </p>
          )}
        </div>
        <p className="font-mono text-[11px] text-ink-secondary whitespace-nowrap">
          {occupied}/5 ocupadas
        </p>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-4 md:gap-5 lg:gap-6 overflow-x-auto snap-x snap-mandatory px-6 md:px-12 lg:px-16 pb-4 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {row.items.map((item, idx) =>
            item.kind === "startup" ? (
              <StartupCompactCard
                key={item.id}
                startup={item}
                categoryType={row.category_type}
              />
            ) : (
              <EmptySlotCard key={`empty-${row.category_value}-${idx}`} slot={item} />
            )
          )}
        </div>

        {canPrev && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Anterior"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-brand-navy shadow-md items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Siguiente"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-brand-navy shadow-md items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}
