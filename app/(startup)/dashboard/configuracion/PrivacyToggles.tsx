"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Startup = {
  id: string;
  is_public: boolean;
  consent_public_profile: boolean;
  consent_public_deck: boolean;
  show_public_timeline: boolean;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  disabledTitle,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  disabledTitle?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border-soft last:border-0">
      <div>
        <p className={`font-body text-sm font-medium ${disabled ? "text-ink-secondary" : "text-brand-navy"}`}>
          {label}
        </p>
        <p className="font-body text-xs text-ink-secondary mt-0.5">{description}</p>
      </div>
      <span title={disabled ? disabledTitle : undefined}>
        <button
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:ring-offset-2 ${
            disabled
              ? "bg-gray-100 cursor-not-allowed opacity-50"
              : checked
              ? "bg-brand-salmon"
              : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </span>
    </div>
  );
}

export default function PrivacyToggles({ startup }: { startup: Startup }) {
  const [isPublic, setIsPublic] = useState(startup.is_public);
  const [consentPublic, setConsentPublic] = useState(startup.consent_public_profile);
  const [consentDeck, setConsentDeck] = useState(startup.consent_public_deck);
  const [showTimeline, setShowTimeline] = useState(startup.show_public_timeline);
  const [deckFeedback, setDeckFeedback] = useState<string | null>(null);

  async function update(field: string, value: boolean) {
    const supabase = getSupabase();
    await supabase.from("startups").update({ [field]: value }).eq("id", startup.id);
  }

  async function handleDeckToggle(v: boolean) {
    setConsentDeck(v);
    setDeckFeedback(null);
    if (v) {
      try {
        const res = await fetch("/api/startup/enable-deck-preview", { method: "POST" });
        if (res.ok) {
          setDeckFeedback("Generando thumbnails... Tarda ~45s");
        } else {
          const json = await res.json();
          setDeckFeedback(json.error ?? "Error al activar el preview.");
          setConsentDeck(false);
        }
      } catch {
        setDeckFeedback("Error de red. Inténtalo de nuevo.");
        setConsentDeck(false);
      }
    } else {
      await fetch("/api/startup/disable-deck-preview", { method: "POST" });
      setDeckFeedback("Preview oculto de tu perfil público.");
    }
  }

  return (
    <div className="bg-white rounded-card border border-border-soft px-5">
      <Toggle
        label="Visible en el leaderboard"
        description="Si está OFF, tu startup no aparece en el ranking público."
        checked={isPublic}
        onChange={(v) => { setIsPublic(v); update("is_public", v); }}
      />
      <Toggle
        label="Perfil público compartible"
        description="Si está OFF, tu score no cuenta en el ranking y la carta no se puede compartir."
        checked={consentPublic}
        onChange={(v) => { setConsentPublic(v); update("consent_public_profile", v); }}
      />
      <Toggle
        label="Mostrar preview del deck en mi perfil público"
        description="Comparte las 5 primeras slides del deck con marca de agua de La Liga Qanvit en tu perfil público. Se genera automáticamente y es visible sin login para el ecosistema."
        checked={consentDeck}
        disabled={!consentPublic}
        disabledTitle="Activa primero Perfil público."
        onChange={handleDeckToggle}
      />
      {deckFeedback && (
        <p className="font-body text-xs text-ink-secondary pb-3 -mt-1">{deckFeedback}</p>
      )}
      <Toggle
        label="Mostrar evolución en perfil público"
        description="Si está ON, tu perfil público muestra el historial de evaluaciones."
        checked={showTimeline}
        onChange={(v) => { setShowTimeline(v); update("show_public_timeline", v); }}
      />
    </div>
  );
}
