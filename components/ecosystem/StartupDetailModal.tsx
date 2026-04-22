"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import type { Database } from "@/lib/supabase/types";
import EcosystemMomentumBadge from "@/components/ecosystem/EcosystemMomentumBadge";
import StartupVoteControl from "@/components/ecosystem/StartupVoteControl";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];

type StartupDetail = {
  id: string;
  name: string;
  vertical: string;
  division: string;
  score: number;
  rank_national: number;
  rank_division: number;
  region: string | null;
  founded_year: number | null;
  website: string | null;
  feedback_summary: string | null;
};

type VoteRecord = { vote_type: "up" | "down"; created_at: string };

type Props = {
  startupId: string;
  startupName: string;
  orgId: string;
  tier: Tier;
  currentVote?: VoteRecord | null;
  onVoteCast?: (voteType: "up" | "down", momentumScore: number) => void;
  onClose: () => void;
};

const APP_QANVIT_URL = process.env.NEXT_PUBLIC_APP_QANVIT_URL ?? "https://app.qanvit.com";

export default function StartupDetailModal({ startupId, startupName, tier, currentVote, onVoteCast, onClose }: Props) {
  const [detail, setDetail] = useState<StartupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ecosystem/startup-detail/${startupId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [startupId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft sticky top-0 bg-white z-10">
          <h2 className="font-sora font-bold text-brand-navy text-lg">
            {loading ? "Cargando..." : detail?.name ?? "Startup"}
          </h2>
          <button onClick={onClose} className="text-ink-secondary hover:text-brand-navy transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-salmon border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !detail ? (
            <p className="text-ink-secondary font-body text-sm">No se pudo cargar la información.</p>
          ) : (
            <>
              {/* Scores */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Score", value: detail.score.toFixed(1) },
                  { label: "#Nacional", value: `#${detail.rank_national}` },
                  { label: "#División", value: `#${detail.rank_division}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-brand-lavender rounded-xl px-3 py-3 text-center">
                    <p className="font-sora font-bold text-brand-navy text-xl">{value}</p>
                    <p className="font-body text-xs text-ink-secondary mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between border-b border-border-soft py-2">
                  <span className="text-ink-secondary">Vertical</span>
                  <span className="text-brand-navy capitalize font-medium">{detail.vertical.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between border-b border-border-soft py-2">
                  <span className="text-ink-secondary">División</span>
                  <span className="text-brand-navy capitalize font-medium">{detail.division}</span>
                </div>
                {detail.region && (
                  <div className="flex justify-between border-b border-border-soft py-2">
                    <span className="text-ink-secondary">Región</span>
                    <span className="text-brand-navy font-medium">{detail.region}</span>
                  </div>
                )}
                {detail.founded_year && (
                  <div className="flex justify-between border-b border-border-soft py-2">
                    <span className="text-ink-secondary">Fundación</span>
                    <span className="text-brand-navy font-medium">{detail.founded_year}</span>
                  </div>
                )}
                {detail.website && (
                  <div className="flex justify-between py-2">
                    <span className="text-ink-secondary">Web</span>
                    <a
                      href={detail.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-salmon font-medium flex items-center gap-1 hover:underline"
                    >
                      Visitar <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Momentum */}
              <EcosystemMomentumBadge startupId={startupId} variant="full" />

              {/* Feedback summary — pro/elite only */}
              {tier !== "rookie" && detail.feedback_summary && (
                <div className="bg-brand-lavender rounded-xl p-4">
                  <p className="font-body text-xs text-ink-secondary uppercase tracking-wide mb-2">Resumen evaluación</p>
                  <p className="font-body text-sm text-brand-navy">{detail.feedback_summary}</p>
                </div>
              )}

              {/* Vote */}
              <div className="border-t border-border-soft pt-4">
                <p className="font-body text-xs text-ink-secondary mb-2">Tu voto sobre esta startup</p>
                <StartupVoteControl
                  startupId={startupId}
                  startupName={startupName || detail.name}
                  currentOrgTier={tier}
                  currentVote={currentVote ?? undefined}
                  onVoteCast={onVoteCast}
                />
              </div>

              {/* CTA to app.qanvit.com */}
              <div className="border-t border-border-soft pt-4">
                <a
                  href={`${APP_QANVIT_URL}?utm_source=laliga&utm_medium=cta&utm_campaign=startup_modal&utm_content=${encodeURIComponent(detail.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-brand-salmon text-brand-navy font-semibold font-body text-sm px-4 py-3 rounded-xl hover:bg-brand-salmon/90 transition-colors"
                >
                  Más datos sobre {detail.name} → app.qanvit.com
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
