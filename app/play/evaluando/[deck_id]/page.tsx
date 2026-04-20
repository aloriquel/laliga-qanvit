"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type DeckStatus = "pending" | "processing" | "evaluated" | "error";

const COPIES: Record<string, string[]> = {
  pending:    ["Poniendo tu deck en la cola...", "Preparando el campo de juego..."],
  processing: [
    "Estamos leyendo tu deck...",
    "Calibrando tu División...",
    "Analizando tu vertical de mercado...",
    "Evaluando el equipo fundador...",
    "Calculando tracción y validación...",
    "Construyendo tu feedback...",
    "Últimos ajustes del score...",
  ],
  evaluated:  ["¡Evaluación completada!"],
  error:      ["Ha ocurrido un problema técnico."],
};

export default function EvaluandoPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.deck_id as string;

  const [status, setStatus] = useState<DeckStatus>("pending");
  const [copyIndex, setCopyIndex] = useState(0);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const copies = COPIES[status] ?? COPIES.processing;

  // Rotate the copy text while waiting
  useEffect(() => {
    const timer = setInterval(() => {
      setCopyIndex(i => (i + 1) % copies.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [copies.length]);

  useEffect(() => {
    const supabase = createClient();

    // Realtime subscription
    const channel = supabase
      .channel(`deck-${deckId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "decks", filter: `id=eq.${deckId}` },
        (payload) => {
          const newStatus = payload.new.status as DeckStatus;
          setStatus(newStatus);
          if (newStatus === "evaluated") {
            // Fetch evaluation_id then redirect
            fetchStatus();
          } else if (newStatus === "error") {
            setErrorMessage(payload.new.error_message ?? "Error desconocido");
          }
        }
      )
      .subscribe();

    // Polling fallback every 4s
    pollRef.current = setInterval(fetchStatus, 4000);

    // Initial fetch
    fetchStatus();

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/decks/${deckId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status as DeckStatus);
      if (data.status === "evaluated") {
        if (pollRef.current) clearInterval(pollRef.current);
        setEvaluationId(data.evaluation_id);
        router.push(`/play/resultado/${deckId}`);
      } else if (data.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
        setErrorMessage(data.error_message ?? "Error desconocido");
      }
    } catch {
      // Network error — keep polling
    }
  }

  if (status === "error") {
    return (
      <div className="bg-brand-lavender min-h-screen py-16 flex items-center justify-center">
        <div className="container-brand max-w-md">
          <div className="bg-white rounded-hero shadow-card border border-border-soft p-10 text-center">
            <p className="font-mono text-brand-salmon text-4xl mb-4">!</p>
            <h1 className="font-sora font-bold text-2xl text-brand-navy mb-2">Ha habido un problema</h1>
            <p className="font-body text-ink-secondary text-sm mb-6">
              Hemos tenido un problema técnico evaluando tu deck. Lo estamos revisando.
              {errorMessage && <span className="block mt-2 font-mono text-xs text-red-500">{errorMessage}</span>}
            </p>
            <div className="flex flex-col gap-3">
              <Link href="mailto:hola@qanvit.com" className="font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors">
                Contactar con el equipo →
              </Link>
              <Link href="/play" className="bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 font-body text-sm hover:bg-brand-navy/90 transition-colors">
                Intentar de nuevo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-navy min-h-screen py-16 flex items-center justify-center">
      <div className="container-brand max-w-md text-center">
        {/* Pulsing braces animation */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="font-sora font-bold text-6xl text-brand-salmon animate-pulse">{`{`}</span>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-3 w-3 rounded-full bg-brand-salmon"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <span className="font-sora font-bold text-6xl text-brand-salmon animate-pulse">{`}`}</span>
        </div>

        <h1 className="font-sora font-bold text-3xl text-white mb-3">
          {status === "pending" ? "En cola" : "Evaluando tu deck"}
        </h1>
        <p className="font-body text-white/60 text-lg transition-all duration-700 min-h-[2rem]">
          {copies[copyIndex % copies.length]}
        </p>

        <div className="mt-10 bg-white/5 rounded-card p-4">
          <p className="font-mono text-xs text-white/30">
            Esto puede tardar 1-3 minutos. Te avisaremos por email cuando esté listo.
          </p>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
      </div>
    </div>
  );
}
