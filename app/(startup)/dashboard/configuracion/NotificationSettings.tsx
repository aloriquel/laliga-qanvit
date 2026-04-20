"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Startup = {
  id: string;
  notification_email_enabled: boolean;
  notification_frequency: string;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function NotificationSettings({ startup }: { startup: Startup }) {
  const [emailOn, setEmailOn] = useState(startup.notification_email_enabled);
  const [frequency, setFrequency] = useState(startup.notification_frequency);

  async function update(field: string, value: unknown) {
    const supabase = getSupabase();
    await supabase.from("startups").update({ [field]: value }).eq("id", startup.id);
  }

  return (
    <div className="bg-white rounded-card border border-border-soft px-5">
      <div className="flex items-start justify-between gap-6 py-4 border-b border-border-soft">
        <div>
          <p className="font-body text-sm font-medium text-brand-navy">Alertas por email</p>
          <p className="font-body text-xs text-ink-secondary mt-0.5">Recibe notificaciones de cambios de posición.</p>
        </div>
        <button
          role="switch"
          aria-checked={emailOn}
          onClick={() => { setEmailOn(!emailOn); update("notification_email_enabled", !emailOn); }}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:ring-offset-2 ${
            emailOn ? "bg-brand-salmon" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              emailOn ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="flex items-start justify-between gap-6 py-4">
        <div>
          <p className="font-body text-sm font-medium text-brand-navy">Frecuencia</p>
          <p className="font-body text-xs text-ink-secondary mt-0.5">¿Con qué frecuencia recibes los emails?</p>
        </div>
        <select
          value={frequency}
          disabled={!emailOn}
          onChange={(e) => { setFrequency(e.target.value); update("notification_frequency", e.target.value); }}
          className="font-body text-sm border border-border-soft rounded-xl px-3 py-2 text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon disabled:opacity-50"
        >
          <option value="immediate">Inmediato</option>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
        </select>
      </div>
    </div>
  );
}
