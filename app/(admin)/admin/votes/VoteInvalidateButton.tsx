"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoteInvalidateButton({ voteId }: { voteId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleInvalidate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/votes/${voteId}/invalidate`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Error invalidando voto");
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleInvalidate}
          disabled={loading}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {loading ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-ink-secondary hover:underline"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-ink-secondary hover:text-red-600 transition-colors"
    >
      Invalidar
    </button>
  );
}
