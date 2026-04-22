"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { X } from "lucide-react";

type Props = {
  userId: string;
  startupId: string;
  hasApprovedEval: boolean;
  seenWizard: boolean;
  consentPublicProfile: boolean;
  consentPublicDeck: boolean;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function DeckConsentWizard({
  userId,
  startupId,
  hasApprovedEval,
  seenWizard,
  consentPublicProfile,
  consentPublicDeck,
}: Props) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (
      !seenWizard &&
      hasApprovedEval &&
      consentPublicProfile &&
      !consentPublicDeck
    ) {
      setOpen(true);
    }
  }, [seenWizard, hasApprovedEval, consentPublicProfile, consentPublicDeck]);

  async function markSeen() {
    const supabase = getSupabase();
    await supabase
      .from("profiles")
      .update({ seen_deck_consent_wizard: true })
      .eq("id", userId);
  }

  async function handleDismiss() {
    await markSeen();
    setOpen(false);
  }

  async function handleActivate() {
    setActivating(true);
    await markSeen();
    try {
      const res = await fetch("/api/startup/enable-deck-preview", { method: "POST" });
      if (res.ok) {
        setFeedback("Generando preview. Visible en ~1 minuto.");
        setTimeout(() => setOpen(false), 2500);
      } else {
        const json = await res.json();
        setFeedback(json.error ?? "Error al activar.");
        setActivating(false);
      }
    } catch {
      setFeedback("Error de red. Inténtalo desde Configuración.");
      setActivating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-hero shadow-xl max-w-lg w-full p-8 relative">
        <button
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-ink-secondary hover:text-brand-navy transition-colors"
        >
          <X size={18} />
        </button>

        <p className="font-body text-xs text-brand-salmon uppercase tracking-widest font-semibold mb-2">
          Nueva función
        </p>
        <h2 className="font-sora font-bold text-2xl text-brand-navy mb-2">
          Haz que más orgs te descubran
        </h2>
        <p className="font-body text-sm text-ink-secondary mb-6">
          Activa el preview de tu deck en tu perfil público de La Liga. Así las orgs
          pueden conocerte antes de contactarte.
        </p>

        {/* Value bullets */}
        <ul className="flex flex-col gap-2 mb-6">
          {[
            "5 primeras slides con watermark protector",
            "Activable y desactivable en 1 click desde Configuración",
            "Aumenta el interés de orgs del ecosistema",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 font-body text-sm text-brand-navy">
              <span className="text-brand-salmon font-bold mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>

        {feedback ? (
          <p className="font-body text-sm text-ink-secondary text-center py-2">{feedback}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full bg-brand-salmon text-brand-navy font-body font-semibold text-sm rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {activating ? "Activando…" : "Activar preview público"}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full bg-transparent text-ink-secondary font-body text-sm py-2 hover:text-brand-navy transition-colors"
            >
              Lo decidiré luego
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
