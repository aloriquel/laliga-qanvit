"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DivisionItem = { key: string; icon: string; label: string };
export type VerticalItem = { key: string; label: string };

type NavMenuProps = {
  labels: {
    liga: string;
    divisions: string;
    verticals: string;
    ecosystem: string;
  };
  divisions: DivisionItem[];
  verticals: VerticalItem[];
};

export function NavMenu({ labels, divisions, verticals }: NavMenuProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDivisionsOpen, setMobileDivisionsOpen] = useState(false);
  const [mobileVerticalsOpen, setMobileVerticalsOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* ── Desktop nav ──────────────────────────────────────────── */}
      <nav
        className="hidden md:flex items-center gap-6"
        aria-label="Navegación principal"
      >
        <Link
          href="/liga"
          className="font-body text-sm text-white/70 hover:text-white transition-colors"
        >
          {labels.liga}
        </Link>

        {/* Divisiones dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 font-body text-sm text-white/70 hover:text-white transition-colors cursor-default"
            aria-haspopup="true"
          >
            {labels.divisions}
            <ChevronDown
              size={12}
              className="mt-px transition-transform duration-150 group-hover:rotate-180"
            />
          </button>
          <div
            className={cn(
              "absolute left-0 top-full pt-2",
              "opacity-0 invisible pointer-events-none",
              "group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto",
              "transition-all duration-150 z-50"
            )}
          >
            <div className="bg-white rounded-xl shadow-lg border border-border-soft py-1.5 min-w-[180px]">
              {divisions.map((d) => (
                <Link
                  key={d.key}
                  href={`/liga?division=${d.key}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 font-body text-sm text-brand-navy hover:bg-brand-lavender transition-colors"
                >
                  <span aria-hidden="true">{d.icon}</span>
                  <span>{d.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Verticales dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 font-body text-sm text-white/70 hover:text-white transition-colors cursor-default"
            aria-haspopup="true"
          >
            {labels.verticals}
            <ChevronDown
              size={12}
              className="mt-px transition-transform duration-150 group-hover:rotate-180"
            />
          </button>
          <div
            className={cn(
              "absolute left-0 top-full pt-2",
              "opacity-0 invisible pointer-events-none",
              "group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto",
              "transition-all duration-150 z-50"
            )}
          >
            <div className="bg-white rounded-xl shadow-lg border border-border-soft py-1.5 min-w-[230px]">
              {verticals.map((v) => (
                <Link
                  key={v.key}
                  href={`/liga?vertical=${v.key}`}
                  className="block px-4 py-2.5 font-body text-sm text-brand-navy hover:bg-brand-lavender transition-colors"
                >
                  {v.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/premios"
          className="font-body text-sm text-white/70 hover:text-white transition-colors"
        >
          Premios
        </Link>

        <Link
          href="/ecosistema"
          className="font-body text-sm text-white/70 hover:text-white transition-colors"
        >
          {labels.ecosystem}
        </Link>
      </nav>

      {/* ── Mobile hamburger button ───────────────────────────────── */}
      <button
        className="md:hidden text-white/70 hover:text-white transition-colors p-1 -mr-1"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Mobile menu panel (fixed below header) ───────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-16 bg-brand-navy border-t border-white/10 z-40 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <nav className="flex flex-col divide-y divide-white/5" aria-label="Navegación móvil">
            <Link
              href="/liga"
              onClick={closeMobile}
              className="px-6 py-3.5 font-body text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            >
              {labels.liga}
            </Link>

            {/* Divisiones accordion */}
            <div>
              <button
                onClick={() => setMobileDivisionsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-3.5 font-body text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                aria-expanded={mobileDivisionsOpen}
              >
                <span>{labels.divisions}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-150",
                    mobileDivisionsOpen && "rotate-180"
                  )}
                />
              </button>
              {mobileDivisionsOpen && (
                <div className="bg-white/5 border-t border-white/5">
                  {divisions.map((d) => (
                    <Link
                      key={d.key}
                      href={`/liga?division=${d.key}`}
                      onClick={closeMobile}
                      className="flex items-center gap-2.5 pl-10 pr-6 py-3 font-body text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span aria-hidden="true">{d.icon}</span>
                      <span>{d.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Verticales accordion */}
            <div>
              <button
                onClick={() => setMobileVerticalsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-3.5 font-body text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                aria-expanded={mobileVerticalsOpen}
              >
                <span>{labels.verticals}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-150",
                    mobileVerticalsOpen && "rotate-180"
                  )}
                />
              </button>
              {mobileVerticalsOpen && (
                <div className="bg-white/5 border-t border-white/5">
                  {verticals.map((v) => (
                    <Link
                      key={v.key}
                      href={`/liga?vertical=${v.key}`}
                      onClick={closeMobile}
                      className="block pl-10 pr-6 py-3 font-body text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {v.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/premios"
              onClick={closeMobile}
              className="px-6 py-3.5 font-body text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            >
              Premios
            </Link>

            <Link
              href="/ecosistema"
              onClick={closeMobile}
              className="px-6 py-3.5 font-body text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            >
              {labels.ecosystem}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
