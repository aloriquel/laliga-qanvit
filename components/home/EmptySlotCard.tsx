import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import {
  DIVISION_LABELS,
  VERTICAL_LABELS,
  type Division,
  type Vertical,
} from "@/lib/home/categories";
import type { EmptySlot } from "@/lib/home/top-by-category";

type Props = {
  slot: EmptySlot;
};

export default function EmptySlotCard({ slot }: Props) {
  const label =
    slot.category_type === "division"
      ? DIVISION_LABELS[slot.category_value as Division] ?? slot.category_value
      : VERTICAL_LABELS[slot.category_value as Vertical] ?? slot.category_value;

  const ctaHref = `/play?division=${encodeURIComponent(slot.category_value)}`;
  const firstSlot = slot.slot_position === 1;

  return (
    <Link
      href={ctaHref}
      aria-label={`Ocupar puesto ${slot.slot_position} en ${label}`}
      className="snap-start shrink-0 w-[200px] h-[280px] md:w-[240px] md:h-[320px] lg:w-[280px] lg:h-[360px] rounded-[20px] relative group focus:outline-none focus:ring-2 focus:ring-brand-salmon transition-all duration-200 border-2 border-dashed border-brand-navy/20 hover:border-solid hover:border-brand-salmon hover:bg-brand-salmon/5"
    >
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-5 text-center">
        <div className="rounded-full bg-brand-lavender/60 group-hover:bg-brand-salmon/20 p-3 transition-colors">
          <Plus size={24} className="text-brand-navy/40 group-hover:text-brand-salmon transition-colors" strokeWidth={1.5} />
        </div>
        <p className="font-sora uppercase tracking-widest text-[10px] font-semibold text-brand-navy/40">
          Puesto #{slot.slot_position} disponible
        </p>
        <p className="font-sora font-bold text-brand-navy text-sm md:text-base leading-snug">
          {firstSlot ? `¿Primera en ${label}?` : `Entra en ${label}`}
        </p>
        <p className="font-body text-ink-secondary text-[11px] md:text-xs leading-relaxed px-2">
          {firstSlot
            ? "Sé la primera startup de esta categoría y asegura el #1."
            : `Ocupa el puesto #${slot.slot_position} y empieza a escalar posiciones.`}
        </p>
        <span className="inline-flex items-center gap-1 mt-2 font-body font-semibold text-brand-salmon text-xs md:text-sm">
          Ocupar este puesto <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
