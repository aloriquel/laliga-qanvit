"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConsentField = "consent_public_profile" | "consent_internal_use" | "consent_direct_contact" | "is_public";

type ConsentValues = {
  consent_public_profile: boolean;
  consent_internal_use: boolean;
  consent_direct_contact: boolean;
  is_public: boolean;
};

type Props = {
  startupId: string;
  initial: ConsentValues;
};

const FIELDS: { key: ConsentField; label: string; description: string }[] = [
  {
    key: "consent_public_profile",
    label: "Perfil público",
    description: "Permite que nombre, score y división aparezcan en el leaderboard y en la carta compartible.",
  },
  {
    key: "consent_internal_use",
    label: "Uso interno",
    description: "Permite a Qanvit usar el feedback anonimizado para mejorar el evaluador.",
  },
  {
    key: "consent_direct_contact",
    label: "Contacto directo",
    description: "Permite que ecosistemas verificados contacten directamente con la startup.",
  },
  {
    key: "is_public",
    label: "Visible (is_public)",
    description: "Determina si la startup aparece en búsquedas y vistas del ecosistema. No implica consent.",
  },
];

export default function ConsentManager({ startupId, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ConsentValues>(initial);
  const [pending, setPending] = useState<{ field: ConsentField; newValue: boolean } | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function requestChange(field: ConsentField, newValue: boolean) {
    setReason("");
    setError(null);
    setPending({ field, newValue });
  }

  function cancelModal() {
    setPending(null);
    setError(null);
  }

  async function confirmChange() {
    if (!pending) return;
    if (reason.trim().length < 10) {
      setError("La razón debe tener al menos 10 caracteres.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/startups/${startupId}/update-consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_field: pending.field,
          new_value: pending.newValue,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido");
        return;
      }

      setValues((prev) => ({ ...prev, [pending.field]: pending.newValue }));
      setPending(null);
      router.refresh();
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const fieldMeta = FIELDS.find((f) => f.key === pending?.field);

  return (
    <>
      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-soft bg-brand-lavender/30">
          <h2 className="font-sora font-semibold text-brand-navy">Consents y visibilidad</h2>
          <p className="font-body text-xs text-ink-secondary mt-0.5">
            Cualquier cambio queda registrado en el audit log con razón obligatoria.
          </p>
        </div>
        <div className="divide-y divide-border-soft">
          {FIELDS.map(({ key, label, description }) => {
            const current = values[key];
            return (
              <div key={key} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-brand-navy">{label}</p>
                  <p className="font-body text-xs text-ink-secondary mt-0.5">{description}</p>
                </div>
                <button
                  onClick={() => requestChange(key, !current)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:ring-offset-2 ${
                    current ? "bg-brand-navy" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={current}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      current ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="font-sora font-bold text-brand-navy text-lg">Confirmar cambio</h3>
              <p className="font-body text-sm text-ink-secondary mt-1">
                Vas a {pending.newValue ? "activar" : "desactivar"}{" "}
                <strong>{fieldMeta?.label}</strong> en nombre de esta startup.
                Este cambio quedará registrado en el audit log.
              </p>
            </div>

            <div>
              <label className="font-body text-sm font-semibold text-brand-navy block mb-1.5">
                Razón obligatoria <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Startup de prueba creada por el equipo Qanvit para validar el pipeline de evaluación."
                rows={3}
                className="w-full border border-border-soft rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon resize-none"
              />
              <p className="font-mono text-xs text-ink-secondary mt-1">
                {reason.trim().length}/10 mín.
              </p>
            </div>

            {error && (
              <p className="font-body text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelModal}
                disabled={saving}
                className="font-body text-sm px-4 py-2 rounded-xl border border-border-soft hover:bg-brand-lavender/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmChange}
                disabled={saving || reason.trim().length < 10}
                className="font-body text-sm px-4 py-2 rounded-xl bg-brand-navy text-white font-semibold hover:bg-brand-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Guardando…" : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
