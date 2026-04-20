"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";

type Props = { challengeId: string; alreadyVoted: boolean };

export default function ChallengeVoteButton({ challengeId, alreadyVoted }: Props) {
  const [voted, setVoted] = useState(alreadyVoted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function vote() {
    if (voted || loading) return;
    setLoading(true);
    const res = await fetch(`/api/ecosystem/challenges/${challengeId}/vote`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setVoted(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Error al votar");
    }
  }

  if (voted) {
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 bg-brand-salmon/20 text-brand-navy rounded-xl text-sm font-semibold font-body">
        <ThumbsUp size={14} className="fill-brand-salmon stroke-brand-salmon" />
        Votado
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={vote}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy text-white rounded-xl text-sm font-semibold font-body hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
      >
        <ThumbsUp size={14} />
        {loading ? "..." : "Votar"}
      </button>
      {error && <p className="text-xs text-red-500 font-body">{error}</p>}
    </div>
  );
}
