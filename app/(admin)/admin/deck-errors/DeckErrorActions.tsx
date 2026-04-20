"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  deckId: string;
  startupSlug: string | null;
};

export default function DeckErrorActions({ deckId, startupSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"retry" | "archive" | null>(null);
  const [done, setDone] = useState(false);

  async function handleAction(action: "retry" | "archive") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/decks/${deckId}/${action}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      } else {
        setDone(true);
        router.refresh();
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  }

  if (done) return <span className="font-mono text-xs text-green-600">OK</span>;

  return (
    <div className="flex items-center gap-2">
      {startupSlug && (
        <Link
          href={`/startup/${startupSlug}`}
          target="_blank"
          className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors"
        >
          Ver
        </Link>
      )}
      <button
        onClick={() => handleAction("retry")}
        disabled={loading !== null}
        className="font-body text-xs text-brand-navy bg-brand-lavender hover:bg-brand-navy/10 rounded px-2 py-1 transition-colors disabled:opacity-50"
      >
        {loading === "retry" ? "..." : "Reintentar"}
      </button>
      <button
        onClick={() => handleAction("archive")}
        disabled={loading !== null}
        className="font-body text-xs text-ink-secondary hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {loading === "archive" ? "..." : "Archivar"}
      </button>
    </div>
  );
}
