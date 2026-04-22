"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const MAX_SLIDES = 5;
const RENDER_SCALE = 1.5;

type Props = {
  pdfUrl: string;
  watermark: string;
};

export default function DeckPreviewCarouselClient({ pdfUrl, watermark }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const numPages = Math.min(pdf.numPages, MAX_SLIDES);
        const dataUrls: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport }).promise;
          dataUrls.push(canvas.toDataURL("image/jpeg", 0.85));
        }

        if (!cancelled) {
          setPages(dataUrls);
          setLoading(false);
        }
      } catch (err) {
        console.error("[DeckPreviewCarousel] PDF load failed:", err);
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  function scrollBy(dir: 1 | -1) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir * scrollRef.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-card border border-border-soft p-6 mb-6">
        <div className="h-48 flex items-center justify-center text-ink-secondary text-sm animate-pulse">
          Cargando preview del deck…
        </div>
      </div>
    );
  }

  if (pages.length === 0) return null;

  const total = pages.length;
  const active = activeModal !== null ? pages[activeModal] : null;

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
        {total > 1 && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white border border-border-soft rounded-full p-1.5 shadow-card hover:bg-brand-lavender transition-colors hidden md:flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-brand-navy" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {pages.map((dataUrl, idx) => (
            <button
              key={idx}
              onClick={() => setActiveModal(idx)}
              aria-label={`Ver slide ${idx + 1} a pantalla completa`}
              className="relative flex-none snap-start rounded-lg overflow-hidden border border-border-soft shadow-card cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-salmon"
              style={{ width: "clamp(200px, 30vw, 340px)" }}
            >
              {/* Slide number badge */}
              <span className="absolute top-2 left-2 z-10 bg-brand-navy/70 text-white font-mono text-xs rounded px-1.5 py-0.5">
                {idx + 1}/{total}
              </span>

              {/* CSS watermark badge */}
              <span className="absolute bottom-2 right-2 z-10 bg-black/40 text-white/65 text-xs rounded px-2 py-0.5 font-sans pointer-events-none select-none">
                {watermark}
              </span>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt={`Slide ${idx + 1} del deck`}
                loading="lazy"
                className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-200"
              />
            </button>
          ))}
        </div>

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
        Preview con marca de agua. Deck completo disponible con contacto directo con la startup.
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

          {activeModal! > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal(activeModal! - 1);
              }}
              aria-label="Anterior"
              className="absolute left-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {activeModal! < total - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal(activeModal! + 1);
              }}
              aria-label="Siguiente"
              className="absolute right-16 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div
            className="max-w-4xl max-h-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-mono text-xs text-center mb-2">
              {activeModal! + 1} / {total}
            </p>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active}
                alt={`Slide ${activeModal! + 1} — pantalla completa`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              <span className="absolute bottom-3 right-3 bg-black/40 text-white/65 text-xs rounded px-2 py-0.5 font-sans pointer-events-none select-none">
                {watermark}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
