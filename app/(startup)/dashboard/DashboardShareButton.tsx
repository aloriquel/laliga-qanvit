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

export default function DashboardShareButton({ startup, ranking }: { startup: Startup; ranking: Ranking }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-brand-salmon text-brand-navy font-semibold rounded-xl px-4 py-2 font-body text-xs hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Compartir carta
      </button>
      <ShareModal open={open} onClose={() => setOpen(false)} startup={startup} ranking={ranking} />
    </>
  );
}
