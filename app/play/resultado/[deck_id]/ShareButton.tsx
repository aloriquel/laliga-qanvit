"use client";

import { useState } from "react";
import ShareModal from "@/components/league/ShareModal";

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
} | null;

type Props = { startup: Startup; ranking: Ranking };

export default function ShareButton({ startup, ranking }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 text-center bg-brand-salmon text-brand-navy font-semibold rounded-xl px-6 py-3 font-body text-sm hover:opacity-90 transition-opacity"
      >
        Compartir carta
      </button>
      <ShareModal open={open} onClose={() => setOpen(false)} startup={startup} ranking={ranking} />
    </>
  );
}
