"use client";

import { useState } from "react";
import RegionSelector from "@/components/ui/RegionSelector";
import type { CaId } from "@/lib/spain-regions";

type Props = {
  initialCa: CaId | null;
  initialProvince: string | null;
};

export default function RegionSection({ initialCa, initialProvince }: Props) {
  const [value, setValue] = useState({ ca: initialCa, province: initialProvince });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/startup/region", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_ca: value.ca, region_province: value.province }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Error al guardar.", false);
        return;
      }
      showToast("Ubicación actualizada.", true);
    } catch {
      showToast("Error de red.", false);
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    value.ca !== initialCa || value.province !== initialProvince;
  const isComplete = value.ca !== null && value.province !== null;

  return (
    <div className="flex flex-col gap-4">
      <RegionSelector value={value} onChange={setValue} showLabels={true} />

      <button
        onClick={handleSave}
        disabled={saving || !isDirty || !isComplete}
        className="self-start font-body text-sm bg-brand-navy text-white rounded-xl px-5 py-2.5 hover:bg-brand-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Guardando…" : "Guardar ubicación"}
      </button>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl font-body text-sm shadow-lg z-50 ${
            toast.ok ? "bg-green-700 text-white" : "bg-red-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
