"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OBJECTIVE_LABELS } from "@/lib/ecosystem/challenge-logic";
import type { Database } from "@/lib/supabase/types";

type ObjectiveType = Database["public"]["Enums"]["challenge_objective_type"];

const OBJECTIVES = Object.keys(OBJECTIVE_LABELS) as ObjectiveType[];

export default function NuevoRetoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    objective_type: "referred_in_vertical" as ObjectiveType,
    duration_days: 30,
    prize_1: 500,
    prize_2: 250,
    prize_3: 100,
  });

  function update(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/ecosystem/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        objective_type: form.objective_type,
        objective_params: {},
        duration_days: Number(form.duration_days),
        prize_structure: { "1": Number(form.prize_1), "2": Number(form.prize_2), "3": Number(form.prize_3) },
      }),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/ecosistema/dashboard/retos");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Error al proponer reto");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Proponer reto</h1>
        <p className="font-body text-ink-secondary mt-1">Los retos se someten a votación antes de activarse.</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-border-soft p-6 space-y-5">
        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-1">Título</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ej: 10 startups de mobilidad este mes"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-border-soft font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe el objetivo y las reglas..."
            required
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-border-soft font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-1">Tipo de objetivo</label>
          <select
            value={form.objective_type}
            onChange={(e) => update("objective_type", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border-soft bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          >
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>{OBJECTIVE_LABELS[o]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-1">Duración (días)</label>
          <input
            type="number"
            min={1}
            max={90}
            value={form.duration_days}
            onChange={(e) => update("duration_days", Number(e.target.value))}
            className="w-32 px-4 py-2.5 rounded-xl border border-border-soft font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-2">Premio (puntos)</label>
          <div className="grid grid-cols-3 gap-3">
            {(["prize_1", "prize_2", "prize_3"] as const).map((k, i) => (
              <div key={k}>
                <p className="font-body text-xs text-ink-secondary mb-1">🥇🥈🥉"[{i}]" posición</p>
                <input
                  type="number"
                  min={0}
                  value={form[k]}
                  onChange={(e) => update(k, Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border-soft font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 font-body text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-border-soft font-body text-sm font-semibold text-ink-secondary hover:bg-brand-lavender transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-brand-navy text-white font-body text-sm font-semibold hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Enviando..." : "Proponer reto"}
          </button>
        </div>
      </form>
    </div>
  );
}
