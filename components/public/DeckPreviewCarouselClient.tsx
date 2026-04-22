"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { DeckPreview } from "./DeckPreviewCarousel";

type Props = { thumbnails: DeckPreview[] };

export default function DeckPreviewCarouselClient({ thumbnails }: Props) {
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const total = thumbnails.length;

  function scrollBy(dir: 1 | -1) {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({ left: dir * w * 0.85, behavior: "smooth" });
  }

  const active = activeModal !== null ? thumbnails[activeModal] : null;

  return (
    <div className="bg-white rounded-card border border-border-soft p-6 mb-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-sora font-bold text-lg text-brand-navy">
          Primeras {total} slide{total !== 1 ? "s" : ""} del deck
        </h2>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left arrow */}
        {total > 1 && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white border border-border-soft rounded-full p-1.5 shadow-card hover:bg-brand-lavender transition-colors hidden md:flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-brand-navy" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {thumbnails.map((thumb, idx) => (
            <button
              key={thumb.id}
              onClick={() => setActiveModal(idx)}
              aria-label={`Ver slide ${thumb.slide_number} a pantalla completa`}
              className="relative flex-none snap-start rounded-lg overflow-hidden border border-border-soft shadow-card cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-salmon"
              style={{ width: "clamp(200px, 30vw, 340px)" }}
            >
              {/* Slide number badge */}
              <span className="absolute top-2 left-2 z-10 bg-brand-navy/70 text-white font-mono text-xs rounded px-1.5 py-0.5">
                {thumb.slide_number}/{total}
              </span>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.thumbnail_url}
                alt={`Slide ${thumb.slide_number} del deck`}
                loading="lazy"
                width={thumb.width ?? 600}
                height={thumb.height ?? 450}
                className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-200"
              />
            </button>
          ))}
        </div>

        {/* Right arrow */}
        {total > 1 && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white border border-border-soft rounded-full p-1.5 shadow-card hover:bg-brand-lavender transition-colors hidden md:flex items-center justify-center"
          >
            <ChevronRight size={16} className="text-brand-navy" />
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="font-body text-xs text-ink-secondary mt-3">
        Preview con marca de agua. Deck completo disponible con consent directo con la startup.
      </p>

      {/* Full-screen modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <button
            onClick={() => setActiveModal(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Prev/Next in modal */}
          {activeModal! > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveModal(activeModal! - 1); }}
              aria-label="Anterior"
              className="absolute left-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {activeModal! < total - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveModal(activeModal! + 1); }}
              aria-label="Siguiente"
              className="absolute right-16 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div
            className="max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-mono text-xs text-center mb-2">
              {active.slide_number} / {total}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.thumbnail_url}
              alt={`Slide ${active.slide_number} — pantalla completa`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
