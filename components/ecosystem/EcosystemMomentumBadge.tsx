"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatMomentum } from "@/lib/ecosystem/votes-helpers";

type Momentum = {
  momentum_score: number;
  up_count: number;
  down_count: number;
  distinct_voters: number;
  last_vote_at: string | null;
};

type Props = {
  startupId: string;
  variant: "compact" | "full";
  initialMomentum?: Momentum | null;
};

export default function EcosystemMomentumBadge({ startupId, variant, initialMomentum }: Props) {
  const [momentum, setMomentum] = useState<Momentum | null>(initialMomentum ?? null);
  const [loading, setLoading] = useState(initialMomentum === undefined);

  // Only autofetch if no initial data was provided by the parent
  useEffect(() => {
    if (initialMomentum !== undefined) return;
    fetch(`/api/public/startup-momentum/${startupId}`)
      .then((r) => r.json())
      .then((d) => { if (d) setMomentum(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [startupId, initialMomentum]);

  if (loading) return <span className="inline-block w-10 h-5 bg-gray-100 rounded-full animate-pulse" />;
  if (!momentum) return <span className="font-body text-xs text-ink-secondary/40">sin votos</span>;

  const score = momentum.momentum_score ?? 0;
  const positive = score > 0;
  const neutral = score === 0;

  if (variant === "compact") {
    return (
      <span
        title={`👍 ${momentum.up_count} · 👎 ${momentum.down_count} · ${momentum.distinct_voters} org${momentum.distinct_voters !== 1 ? "s" : ""}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-body ${
          neutral
            ? "bg-gray-100 text-gray-400"
            : positive
            ? "bg-brand-salmon/20 text-brand-navy"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {positive ? <TrendingUp size={11} /> : neutral ? null : <TrendingDown size={11} />}
        {formatMomentum(score)}
      </span>
    );
  }

  return (
    <div className="bg-brand-lavender rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        {positive ? <TrendingUp size={16} className="text-brand-salmon" /> : <TrendingDown size={16} className="text-gray-400" />}
        <span className={`font-sora font-bold text-2xl ${positive ? "text-brand-navy" : "text-gray-400"}`}>
          {formatMomentum(score)}
        </span>
        <span className="font-body text-xs text-ink-secondary">momentum 90d</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-sora font-bold text-brand-navy">{momentum.up_count}</p>
          <p className="font-body text-xs text-ink-secondary">Up</p>
        </div>
        <div>
          <p className="font-sora font-bold text-brand-navy">{momentum.down_count}</p>
          <p className="font-body text-xs text-ink-secondary">Down</p>
        </div>
        <div>
          <p className="font-sora font-bold text-brand-navy">{momentum.distinct_voters}</p>
          <p className="font-body text-xs text-ink-secondary">Orgs</p>
        </div>
      </div>
      {momentum.last_vote_at && (
        <p className="font-body text-xs text-ink-secondary">
          Último voto: {new Date(momentum.last_vote_at).toLocaleDateString("es-ES")}
        </p>
      )}
    </div>
  );
}
