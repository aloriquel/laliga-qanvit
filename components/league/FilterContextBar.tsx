"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterContextBarProps = {
  division: string | null;
  vertical: string | null;
  count: number;
};

const DIVISIONS = [
  { key: "ideation", icon: "🥚", label: "Ideation" },
  { key: "seed",     icon: "🌱", label: "Seed" },
  { key: "growth",   icon: "🚀", label: "Growth" },
  { key: "elite",    icon: "👑", label: "Elite" },
];

const VERTICALS = [
  { key: "deeptech_ai",              label: "Deeptech & AI" },
  { key: "robotics_automation",      label: "Robotics & Automation" },
  { key: "mobility",                 label: "Mobility" },
  { key: "energy_cleantech",         label: "Energy & Cleantech" },
  { key: "agrifood",                 label: "AgriFood" },
  { key: "healthtech_medtech",       label: "HealthTech & MedTech" },
  { key: "industrial_manufacturing", label: "Industrial & Manufacturing" },
  { key: "space_aerospace",          label: "Space & Aerospace" },
  { key: "materials_chemistry",      label: "Materials & Chemistry" },
  { key: "cybersecurity",            label: "Cybersecurity" },
];

function buildUrl(d: string | null, v: string | null) {
  const params = new URLSearchParams();
  if (d) params.set("division", d);
  if (v) params.set("vertical", v);
  const qs = params.toString();
  return qs ? `/liga?${qs}` : "/liga";
}

function FilterDropdown({
  label,
  items,
  currentKey,
  buildHref,
}: {
  label: string;
  items: Array<{ key: string; label: string; icon?: string }>;
  currentKey: string | null;
  buildHref: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy/70 hover:text-brand-navy underline underline-offset-2 decoration-dotted transition-colors"
      >
        {label}
        <ChevronDown size={11} className={cn("transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-border-soft py-1.5 min-w-[200px] z-30">
          {items.map((item) => (
            <Link
              key={item.key}
              href={buildHref(item.key)}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-body text-brand-navy hover:bg-brand-lavender transition-colors",
                item.key === currentKey && "bg-brand-lavender/60 font-semibold"
              )}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterContextBar({ division, vertical, count }: FilterContextBarProps) {
  if (!division && !vertical) return null;

  const divItem = division ? DIVISIONS.find((d) => d.key === division) : null;
  const vertItem = vertical ? VERTICALS.find((v) => v.key === vertical) : null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-body text-brand-navy/60">
      <span>
        Ranking filtrado ·{" "}
        <span className="font-semibold text-brand-navy">
          {count} startup{count !== 1 ? "s" : ""}
        </span>{" "}
        en esta combinación.
      </span>

      <span className="text-brand-navy/30 select-none">·</span>

      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>Ver también:</span>

        {/* Switch division, keep current vertical */}
        <FilterDropdown
          label={divItem ? `${divItem.icon} ${divItem.label}` : "División"}
          items={DIVISIONS}
          currentKey={division}
          buildHref={(key) => buildUrl(key, vertical)}
        />

        <span className="text-brand-navy/30 select-none">·</span>

        {/* Switch vertical, keep current division */}
        <FilterDropdown
          label={vertItem ? vertItem.label : "Vertical"}
          items={VERTICALS}
          currentKey={vertical}
          buildHref={(key) => buildUrl(division, key)}
        />

        <span className="text-brand-navy/30 select-none">·</span>

        <Link
          href="/liga"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy/60 hover:text-brand-navy transition-colors"
        >
          <X size={11} />
          Quitar filtros
        </Link>
      </span>
    </div>
  );
}
