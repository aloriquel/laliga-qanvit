"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Startup = {
  id: string;
  is_public: boolean;
  consent_public_profile: boolean;
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
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border-soft last:border-0">
      <div>
        <p className="font-body text-sm font-medium text-brand-navy">{label}</p>
        <p className="font-body text-xs text-ink-secondary mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:ring-offset-2 ${
          checked ? "bg-brand-salmon" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function PrivacyToggles({ startup }: { startup: Startup }) {
  const [isPublic, setIsPublic] = useState(startup.is_public);
  const [consentPublic, setConsentPublic] = useState(startup.consent_public_profile);
  const [showTimeline, setShowTimeline] = useState(startup.show_public_timeline);

  async function update(field: string, value: boolean) {
    const supabase = getSupabase();
    await supabase.from("startups").update({ [field]: value }).eq("id", startup.id);
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
        label="Mostrar evolución en perfil público"
        description="Si está ON, tu perfil público muestra el historial de evaluaciones."
        checked={showTimeline}
        onChange={(v) => { setShowTimeline(v); update("show_public_timeline", v); }}
      />
    </div>
  );
}
