"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getCaById, type CaId } from "@/lib/spain-regions";

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
};

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI",
  robotics_automation: "Robotics & Automation",
  mobility: "Mobility",
  energy_cleantech: "Energy & Cleantech",
  agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech",
  industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace",
  materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

export type WinnerCategory = {
  category: string;
  segment_key: string | null;
  final_score: number;
};

type Props = {
  batchId: string;
  batchSlug: string;
  batchDisplayName: string;
  categories: WinnerCategory[];
  startupSlug: string;
};

function categoryLabel(c: WinnerCategory): string {
  switch (c.category) {
    case "national_top1": return "🏆 Campeón Nacional";
    case "national_top2": return "🥈 Subcampeón Nacional";
    case "national_top3": return "🥉 Tercero Nacional";
    case "division_top1":
      return `🏆 Campeón División ${c.segment_key ? DIVISION_LABELS[c.segment_key] ?? c.segment_key : ""}`;
    case "region_ca_top1":
      return `🏆 Campeón ${c.segment_key ? getCaById(c.segment_key as CaId)?.name ?? c.segment_key : ""}`;
    case "vertical_top1":
      return `🏆 Campeón ${c.segment_key ? VERTICAL_LABELS[c.segment_key] ?? c.segment_key : ""}`;
    default: return "🏆 Ganador";
  }
}

export default function WinnerCelebrationModal({
  batchId,
  batchSlug,
  batchDisplayName,
  categories,
  startupSlug,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Dynamic import to avoid SSR issues
    (async () => {
      try {
        const { default: confetti } = await import("canvas-confetti");
        if (cancelled) return;
        const fire = (ratio: number, opts: Record<string, unknown>) => {
          confetti({ particleCount: Math.floor(200 * ratio), ...opts });
        };
        fire(0.25, { spread: 26, startVelocity: 55, origin: { y: 0.7 } });
        setTimeout(() => !cancelled && fire(0.35, { spread: 60, origin: { y: 0.7 } }), 200);
        setTimeout(() => !cancelled && fire(0.4, { spread: 100, decay: 0.91, scalar: 0.8, origin: { y: 0.7 } }), 400);
      } catch {
        // confetti optional
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  async function markSeen() {
    try {
      await fetch(`/api/batches/celebration/${batchId}/seen`, { method: "PATCH" });
    } catch {
      // non-critical; modal won't show again because state is local
    }
  }

  async function handleClose() {
    setOpen(false);
    await markSeen();
  }

  const maxScore = Math.max(...categories.map((c) => c.final_score), 0);
  const shareUrl = `https://laliga.qanvit.com/startup/${startupSlug}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) void handleClose(); }}>
      <DialogContent className="max-w-[600px] bg-gradient-to-b from-brand-lavender to-white">
        <DialogTitle className="sr-only">¡Felicidades, eres ganador!</DialogTitle>
        <DialogDescription className="sr-only">
          Tu startup ha ganado en {batchDisplayName}.
        </DialogDescription>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl">🏆</div>
          <h2 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy text-center">
            ¡Felicidades!
          </h2>
          <p className="font-body text-ink-secondary text-center">
            Tu startup ha ganado {categories.length === 1 ? "una categoría" : `${categories.length} categorías`} en{" "}
            <span className="font-semibold text-brand-navy">{batchDisplayName}</span>:
          </p>
          <ul className="flex flex-col gap-2 w-full">
            {categories.map((c, i) => (
              <li
                key={i}
                className="bg-white border border-brand-salmon/40 rounded-xl px-4 py-3 font-sora font-medium text-brand-navy text-center"
              >
                {categoryLabel(c)}
              </li>
            ))}
          </ul>
          {maxScore > 0 && (
            <div className="text-center mt-2">
              <p className="font-mono text-xs text-ink-secondary uppercase tracking-wider">Score final</p>
              <p className="font-sora font-extrabold text-5xl text-brand-salmon">{maxScore.toFixed(1)}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 justify-center mt-4 w-full">
            <a
              href={linkedInHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[180px] bg-brand-navy text-white font-sora font-semibold rounded-xl px-5 py-3 text-center hover:bg-brand-navy/90 transition-colors"
            >
              Compartir en LinkedIn
            </a>
            <button
              onClick={handleClose}
              className="flex-1 min-w-[180px] bg-white border border-border-soft text-brand-navy font-sora font-semibold rounded-xl px-5 py-3 hover:bg-brand-lavender/50 transition-colors"
            >
              Cerrar
            </button>
          </div>
          {/* Hidden metadata for testing */}
          <span className="hidden" data-batch-slug={batchSlug}>{batchSlug}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
