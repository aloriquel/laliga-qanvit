"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Setting = { key: string; value: unknown; description: string | null; updated_at: string };

export default function SettingsForm({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, String(s.value)]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save(key: string) {
    setSaving(key);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    });
    setSaving(null);
    if (res.ok) {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
      router.refresh();
    } else {
      alert("Error al guardar.");
    }
  }

  return (
    <div className="space-y-4">
      {settings.map((s) => (
        <div key={s.key} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border-soft last:border-0">
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-brand-navy text-sm font-mono">{s.key}</p>
            {s.description && <p className="font-body text-xs text-ink-secondary mt-0.5">{s.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={values[s.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [s.key]: e.target.value }))}
              className="border border-border-soft rounded-lg px-3 py-1.5 font-mono text-sm w-32 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
            />
            <button
              onClick={() => save(s.key)}
              disabled={saving === s.key}
              className="bg-brand-navy text-white font-body text-xs px-3 py-1.5 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50 min-w-16"
            >
              {saving === s.key ? "…" : saved === s.key ? "✓" : "Guardar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
