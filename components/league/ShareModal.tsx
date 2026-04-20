"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ClassificationCard from "./ClassificationCard";
import { Check, Copy, Download } from "lucide-react";

type Startup = {
  name: string;
  slug: string;
  logo_url?: string | null;
  current_division?: string | null;
  current_vertical?: string | null;
  current_score?: number | null;
};

type Ranking = {
  rank_national: number;
  rank_division: number;
  rank_division_vertical: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  startup: Startup;
  ranking?: Ranking | null;
};

export default function ShareModal({ open, onClose, startup, ranking }: Props) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://laliga.qanvit.com/startup/${startup.slug}`;
  const encodedUrl = encodeURIComponent(profileUrl);
  const encodedText = encodeURIComponent(
    `Mi startup ${startup.name} está en La Liga Qanvit con un score de ${Math.round(Number(startup.current_score ?? 0))}. #LaLigaQanvit`
  );

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-fit p-6 bg-brand-navy border-brand-salmon/30">
        <DialogHeader>
          <DialogTitle className="font-sora text-white text-lg mb-4">
            {"{ "}Comparte tu carta{" }"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center mb-6 overflow-hidden">
          <div style={{ transform: "scale(0.6)", transformOrigin: "top center", height: 378 }}>
            <ClassificationCard
              startup={startup}
              ranking={ranking}
              size="share"
              interactive={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#0077B5] text-white rounded-xl px-4 py-2.5 text-sm font-semibold font-body hover:opacity-90 transition-opacity"
          >
            <span className="text-xs">in</span>
            LinkedIn
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-semibold font-body hover:opacity-90 transition-opacity"
          >
            <span className="font-bold text-xs">𝕏</span>
            X / Twitter
          </a>

          <a
            href={`/api/og/startup/${startup.slug}/preview`}
            download
            className="flex items-center justify-center gap-2 border border-brand-salmon/40 text-brand-salmon rounded-xl px-4 py-2.5 text-sm font-semibold font-body hover:bg-brand-salmon/10 transition-colors"
          >
            <Download size={16} />
            Descargar PNG
          </a>

          <Button
            variant="ghost"
            onClick={copyLink}
            className="flex items-center gap-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold font-body"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            {copied ? "¡Copiado!" : "Copiar link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
