"use client";

import { useState } from "react";
import { FundingStageSelector, IsRaisingToggle } from "@/components/ui/FundingStageSelector";
import { getFundingStageLabel, type FundingStage } from "@/lib/funding-stage";

type Props = {
  initialFundingStage: FundingStage | null;
  initialIsRaising: boolean;
  initialInferred: boolean;
};

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation",
  seed:     "Seed",
  growth:   "Growth",
  elite:    "Elite",
};

export default function FundingSection({
  initialFundingStage,
  initialIsRaising,
  initialInferred,
}: Props) {
  const [fundingStage, setFundingStage] = useState<FundingStage | null>(initialFundingStage);
  const [isRaising, setIsRaising] = useState(initialIsRaising);
  const [saving, setSaving] = useState(false);
  const [inferredDismissed, setInferredDismissed] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  }

  const isDirty =
    fundingStage !== initialFundingStage || isRaising !== initialIsRaising;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/startup/funding-stage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funding_stage: fundingStage, is_raising: isRaising }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Error al guardar.", false);
        return;
      }
      // Show descriptive toast if division changed
      const divLabel = json.division ? DIVISION_LABELS[json.division] : null;
      const stageLabel = getFundingStageLabel(json.funding_stage);
      if (divLabel && stageLabel) {
        showToast(`Fase actualizada a ${stageLabel}. Tu startup pasa a división ${divLabel}.`, true);
      } else {
        showToast("Fase actualizada.", true);
      }
      setInferredDismissed(true);
    } catch {
      showToast("Error de red.", false);
    } finally {
      setSaving(false);
    }
  }

  const showInferredBanner = initialInferred && !inferredDismissed;

  return (
    <div className="flex flex-col gap-5">
      {showInferredBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="font-body text-sm text-amber-800 font-semibold">
              Esta fase fue estimada automáticamente.
            </p>
            <p className="font-body text-xs text-amber-700 mt-0.5">
              Confírmala o actualízala para que sea precisa. Solo tú sabes en qué fase estás.
            </p>
          </div>
        </div>
      )}

      <FundingStageSelector
        value={fundingStage}
        onChange={setFundingStage}
        showDescriptions={true}
      />

      <div className="border-t border-border-soft pt-4">
        <IsRaisingToggle value={isRaising} onChange={setIsRaising} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !isDirty || fundingStage === null}
        className="self-start font-body text-sm bg-brand-navy text-white rounded-xl px-5 py-2.5 hover:bg-brand-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Guardando…" : "Guardar fase"}
      </button>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl font-body text-sm shadow-lg z-50 max-w-sm text-center ${
            toast.ok ? "bg-green-700 text-white" : "bg-red-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
