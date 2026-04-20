"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VERTICALS = [
  "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech", "agrifood",
  "healthtech_medtech", "industrial_manufacturing", "space_aerospace", "materials_chemistry", "cybersecurity",
] as const;

export default function DataExportForm() {
  const router = useRouter();
  const [scope, setScope] = useState<"full" | "vertical" | "date_range">("full");
  const [vertical, setVertical] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/data-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        filters: {
          ...(scope === "vertical" && vertical ? { vertical } : {}),
          ...(scope === "date_range" ? { date_from: dateFrom, date_to: dateTo } : {}),
        },
      }),
    });
    setLoading(false);
    if (res.ok) {
      setResult("Export iniciado. Se generará en background y recibirás notificación.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setResult(`Error: ${data.error ?? "desconocido"}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="font-body text-sm font-semibold text-brand-navy block mb-1">Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}
            className="border border-border-soft rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon">
            <option value="full">Full dump (consent_internal_use = true)</option>
            <option value="vertical">Por vertical</option>
            <option value="date_range">Por rango de fechas</option>
          </select>
        </div>

        {scope === "vertical" && (
          <div>
            <label className="font-body text-sm font-semibold text-brand-navy block mb-1">Vertical</label>
            <select value={vertical} onChange={(e) => setVertical(e.target.value)}
              required
              className="border border-border-soft rounded-lg px-3 py-2 font-body text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              {VERTICALS.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        )}

        {scope === "date_range" && (
          <>
            <div>
              <label className="font-body text-sm font-semibold text-brand-navy block mb-1">Desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} required
                className="border border-border-soft rounded-lg px-3 py-2 font-body text-sm focus:outline-none" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-brand-navy block mb-1">Hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} required
                className="border border-border-soft rounded-lg px-3 py-2 font-body text-sm focus:outline-none" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}
          className="bg-brand-navy text-white font-body text-sm px-5 py-2 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50">
          {loading ? "Iniciando…" : "Generar export JSON"}
        </button>
      </div>

      {result && (
        <p className={`font-body text-sm px-4 py-3 rounded-lg ${result.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
          {result}
        </p>
      )}
    </form>
  );
}
