"use client";

import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import {
  DIVISION_LABELS,
  VERTICAL_LABELS,
  type Division,
  type Vertical,
} from "@/lib/home/categories";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

type Props = {
  categoryType: "division" | "vertical";
  categoryValue: string;
  slotPosition?: number;
  variant?: "full" | "ghost";
};

export default function EmptySlotCard({
  categoryType,
  categoryValue,
  slotPosition,
  variant = "full",
}: Props) {
  const label =
    categoryType === "division"
      ? DIVISION_LABELS[categoryValue as Division] ?? categoryValue
      : VERTICAL_LABELS[categoryValue as Vertical] ?? categoryValue;

  const ctaHref = `/play?${categoryType}=${encodeURIComponent(categoryValue)}&source=empty_slot`;

  function handleClick() {
    track(EVENTS.HOME_EMPTY_SLOT_CLICKED, {
      category_type: categoryType,
      category_value: categoryValue,
      slot_position: slotPosition ?? 0,
    });
  }

  if (variant === "ghost") {
    return (
      <Link
        href={ctaHref}
        onClick={handleClick}
        aria-label={`Plaza libre en ${label}. Regístrate tu startup.`}
        className="snap-start shrink-0 w-[200px] h-[280px] md:w-[240px] md:h-[320px] lg:w-[280px] lg:h-[360px] rounded-[20px] relative group focus:outline-none focus:ring-2 focus:ring-brand-salmon transition-all duration-200 border border-dashed border-brand-navy/15 bg-brand-navy/[0.03] hover:border-brand-navy/40 hover:bg-brand-navy/[0.06]"
      >
        <div className="h-full w-full flex items-center justify-center">
          <Plus
            size={40}
            className="text-brand-navy/20 group-hover:text-brand-navy/60 transition-colors"
            strokeWidth={1.5}
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={ctaHref}
      onClick={handleClick}
      aria-label={`Sé la primera en ${label}. Ocupar puesto${slotPosition ? ` #${slotPosition}` : ""}.`}
      className="snap-start shrink-0 w-[200px] h-[280px] md:w-[240px] md:h-[320px] lg:w-[280px] lg:h-[360px] rounded-[20px] relative group focus:outline-none focus:ring-2 focus:ring-brand-salmon transition-all duration-200 border-2 border-dashed border-brand-navy/20 hover:border-solid hover:border-brand-salmon hover:bg-brand-salmon/5"
    >
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-5 text-center">
        <div className="rounded-full bg-brand-lavender/60 group-hover:bg-brand-salmon/20 p-3 transition-colors">
          <Plus size={24} className="text-brand-navy/40 group-hover:text-brand-salmon transition-colors" strokeWidth={1.5} />
        </div>
        <p className="font-sora uppercase tracking-widest text-[10px] font-semibold text-brand-navy/40">
          Puesto disponible
        </p>
        <p className="font-sora font-bold text-brand-navy text-sm md:text-base leading-snug">
          Sé la primera en {label}
        </p>
        <span className="inline-flex items-center gap-1 mt-2 font-body font-semibold text-brand-salmon text-xs md:text-sm">
          Ocupar este puesto <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
