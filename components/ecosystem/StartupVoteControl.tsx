"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import type { Database } from "@/lib/supabase/types";
import { track } from "@/lib/analytics/posthog";
import { EVENTS, type Tier as AnalyticsTier } from "@/lib/analytics/events";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];

type VoteRecord = {
  vote_type: "up" | "down";
  created_at: string;
};

type Props = {
  startupId: string;
  startupName: string;
  currentOrgTier: Tier;
  currentVote?: VoteRecord | null;
  onVoteCast?: (voteType: "up" | "down", momentum: number) => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function nextEligibleDate(votedAt: string) {
  const d = new Date(new Date(votedAt).getTime() + 90 * 24 * 3600 * 1000);
  return formatDate(d.toISOString());
}

export default function StartupVoteControl({
  startupId,
  startupName,
  currentOrgTier,
  currentVote,
  onVoteCast,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [casted, setCasted] = useState<"up" | "down" | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alreadyVoted = !!currentVote;
  const effectiveVote = casted ?? currentVote?.vote_type ?? null;
  const disabledMsg = alreadyVoted
    ? `Votaste ${currentVote.vote_type === "up" ? "👍" : "👎"} el ${formatDate(currentVote.created_at)}. Próximo voto: ${nextEligibleDate(currentVote.created_at)}`
    : null;

  async function castVote(voteType: "up" | "down", reasonText?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ecosystem/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startup_id: startupId, vote_type: voteType, reason: reasonText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Error al registrar voto");
        return;
      }
      setCasted(voteType);
      const momentumScore = data.momentum?.momentum_score ?? 0;
      track(EVENTS.ECOSYSTEM_VOTE_CAST, {
        startup_id: startupId,
        vote_type: voteType,
        tier: currentOrgTier as AnalyticsTier,
      });
      onVoteCast?.(voteType, momentumScore);
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
      setShowReasonModal(false);
      setReason("");
    }
  }

  function handleDown() {
    if (currentOrgTier === "pro" || currentOrgTier === "elite") {
      setShowReasonModal(true);
    } else {
      castVote("down");
    }
  }

  const btnBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => !alreadyVoted && !casted && castVote("up")}
          disabled={submitting || alreadyVoted || !!casted}
          title={disabledMsg ?? `Votar 👍 a ${startupName}`}
          className={`${btnBase} ${
            effectiveVote === "up"
              ? "bg-brand-salmon text-brand-navy"
              : "bg-brand-salmon/20 text-brand-navy hover:bg-brand-salmon/40"
          }`}
        >
          <ThumbsUp size={13} />
          Up
        </button>
        <button
          onClick={() => !alreadyVoted && !casted && handleDown()}
          disabled={submitting || alreadyVoted || !!casted}
          title={disabledMsg ?? `Votar 👎 a ${startupName}`}
          className={`${btnBase} ${
            effectiveVote === "down"
              ? "bg-gray-400 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          <ThumbsDown size={13} />
          Down
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1 font-body">{error}</p>
      )}

      {/* Reason modal — for Pro/Elite down votes */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="font-sora font-bold text-brand-navy text-lg">Voto negativo — razón requerida</h3>
              <p className="font-body text-sm text-ink-secondary mt-1">
                Como organización {currentOrgTier}, tu voto negativo tiene más peso. Explica brevemente por qué.
              </p>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: El deck no justifica la valoración de mercado declarada..."
              rows={3}
              minLength={30}
              className="w-full border border-border-soft rounded-xl px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon/40"
            />
            <p className="font-mono text-xs text-ink-secondary">{reason.trim().length}/30 mín.</p>
            {error && <p className="text-xs text-red-500 font-body">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowReasonModal(false); setReason(""); setError(null); }}
                disabled={submitting}
                className="font-body text-sm px-4 py-2 rounded-xl border border-border-soft hover:bg-brand-lavender/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => castVote("down", reason.trim())}
                disabled={submitting || reason.trim().length < 30}
                className="font-body text-sm px-4 py-2 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Enviando..." : "Confirmar voto negativo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
