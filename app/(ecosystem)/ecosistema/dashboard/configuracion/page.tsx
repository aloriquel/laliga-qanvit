"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Vertical = Database["public"]["Enums"]["startup_vertical"];

const VERTICALS: Vertical[] = [
  "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech",
  "agrifood", "healthtech_medtech", "industrial_manufacturing",
  "space_aerospace", "materials_chemistry", "cybersecurity",
];

const FREQUENCIES = ["immediate", "daily", "weekly"] as const;

export default function ConfiguracionPage() {
  const supabase = createClient();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [regions, setRegions] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("daily");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase
        .from("ecosystem_organizations")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!org) return;
      setOrgId(org.id);

      const { data: config } = await supabase
        .from("ecosystem_alerts_config")
        .select("*")
        .eq("org_id", org.id)
        .maybeSingle();

      if (config) {
        setVerticals(config.verticals as Vertical[]);
        setRegions(config.regions.join(", "));
        setFrequency(config.frequency);
        setEmailEnabled(config.email_enabled);
      }
      setLoading(false);
    })();
  }, []);

  function toggleVertical(v: Vertical) {
    setVerticals((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  async function save() {
    if (!orgId) return;
    setSaving(true);
    const regionList = regions.split(",").map((r) => r.trim()).filter(Boolean);
    const { error } = await supabase
      .from("ecosystem_alerts_config")
      .upsert({
        org_id: orgId,
        verticals,
        regions: regionList,
        frequency,
        email_enabled: emailEnabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: "org_id" });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-brand-salmon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Configuración</h1>
        <p className="font-body text-ink-secondary mt-1">Personaliza tus alertas de nuevas startups.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border-soft p-6 space-y-6">
        {/* Verticals */}
        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-3">
            Verticales de interés
          </label>
          <div className="flex flex-wrap gap-2">
            {VERTICALS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleVertical(v)}
                className={`px-3 py-1.5 rounded-full text-sm font-body transition-colors ${
                  verticals.includes(v)
                    ? "bg-brand-salmon text-brand-navy font-semibold"
                    : "bg-brand-lavender text-ink-secondary hover:bg-brand-lavender/80"
                }`}
              >
                {v.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-1">
            Regiones (separadas por coma)
          </label>
          <input
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            placeholder="Andalucía, Cataluña, Madrid..."
            className="w-full px-4 py-2.5 rounded-xl border border-border-soft font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block font-body text-sm font-semibold text-brand-navy mb-2">Frecuencia</label>
          <div className="flex gap-3">
            {FREQUENCIES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`flex-1 py-2 rounded-xl text-sm font-body capitalize transition-colors ${
                  frequency === f
                    ? "bg-brand-navy text-white font-semibold"
                    : "bg-brand-lavender text-ink-secondary hover:bg-brand-lavender/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-brand-navy">Notificaciones por email</p>
            <p className="font-body text-xs text-ink-secondary mt-0.5">Recibe un resumen según la frecuencia elegida.</p>
          </div>
          <button
            type="button"
            onClick={() => setEmailEnabled((v) => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? "bg-brand-salmon" : "bg-gray-200"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                emailEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-brand-navy text-white rounded-xl font-body text-sm font-semibold hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
        >
          {saved ? "¡Guardado!" : saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
