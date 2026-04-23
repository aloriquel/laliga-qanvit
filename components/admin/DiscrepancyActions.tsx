"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FUNDING_STAGES } from "@/lib/funding-stage";

type Props = {
  discrepancyId: string;
  startupId: string;
  startupName: string;
  declaredStage: string;
  suspectedStage: string;
  severity: string;
  reasoning: string;
};

export default function DiscrepancyActions({
  discrepancyId,
  startupName,
  declaredStage,
  suspectedStage,
  severity,
  reasoning,
}: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [overrideStage, setOverrideStage] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState<"confirm" | "override" | "dismiss" | null>(null);

  function open() { setShow(true); }
  function close() { setShow(false); setActionPending(null); setOverrideStage(""); setAdminNotes(""); }

  async function submit(action: "confirm_as_declared" | "override" | "dismiss") {
    setLoading(true);
    const res = await fetch(`/api/admin/discrepancies/${discrepancyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        override_stage: action === "override" ? overrideStage : undefined,
        admin_notes: adminNotes || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) { close(); router.refresh(); }
    else alert("Error al procesar.");
  }

  const SEVERITY_COLORS: Record<string, string> = {
    high:   "text-red-600 bg-red-50 border-red-200",
    medium: "text-amber-600 bg-amber-50 border-amber-200",
    low:    "text-blue-600 bg-blue-50 border-blue-200",
  };

  return (
    <>
      <button
        onClick={open}
        className="font-body text-xs text-brand-salmon hover:underline"
      >
        Revisar
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <h3 className="font-sora font-bold text-brand-navy text-lg">
                Discrepancia de fase
              </h3>
              <span className={`px-2.5 py-1 rounded-full font-body text-xs font-semibold border ${SEVERITY_COLORS[severity] ?? ""}`}>
                {severity}
              </span>
            </div>

            <p className="font-body text-sm font-semibold text-brand-navy">{startupName}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-lavender rounded-xl p-3">
                <p className="font-body text-xs text-ink-secondary mb-1">Fase declarada</p>
                <p className="font-sora font-bold text-brand-navy text-sm">{declaredStage}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <p className="font-body text-xs text-ink-secondary mb-1">Sospechada</p>
                <p className="font-sora font-bold text-red-700 text-sm">{suspectedStage}</p>
              </div>
            </div>

            <div className="bg-brand-lavender/50 rounded-xl p-3">
              <p className="font-body text-xs text-ink-secondary uppercase tracking-wide mb-1">Razonamiento del evaluador</p>
              <p className="font-body text-sm text-brand-navy">{reasoning}</p>
            </div>

            {actionPending === "override" && (
              <div className="space-y-2">
                <p className="font-body text-sm font-semibold text-brand-navy">Selecciona la fase correcta:</p>
                <select
                  value={overrideStage}
                  onChange={(e) => setOverrideStage(e.target.value)}
                  className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                >
                  <option value="">Seleccionar fase…</option>
                  {FUNDING_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notas del admin (opcional)"
              rows={2}
              className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon"
            />

            <div className="flex flex-col gap-2 pt-2 border-t border-border-soft">
              {actionPending === null ? (
                <>
                  <button
                    onClick={() => setActionPending("confirm")}
                    className="w-full bg-green-700 text-white font-body text-sm px-4 py-2.5 rounded-lg hover:bg-green-800 transition-colors"
                  >
                    Confirmar (fase declarada correcta)
                  </button>
                  <button
                    onClick={() => setActionPending("override")}
                    className="w-full bg-brand-navy text-white font-body text-sm px-4 py-2.5 rounded-lg hover:bg-brand-navy/90 transition-colors"
                  >
                    Sobreescribir (asignar otra fase)
                  </button>
                  <button
                    onClick={() => setActionPending("dismiss")}
                    className="w-full border border-border-soft text-ink-secondary font-body text-sm px-4 py-2.5 rounded-lg hover:bg-brand-lavender/30 transition-colors"
                  >
                    Descartar (no hay discrepancia real)
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setActionPending(null)}
                    className="flex-1 border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => submit(
                      actionPending === "confirm" ? "confirm_as_declared" :
                      actionPending === "override" ? "override" : "dismiss"
                    )}
                    disabled={loading || (actionPending === "override" && !overrideStage)}
                    className="flex-1 bg-brand-navy text-white font-body text-sm px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-brand-navy/90 transition-colors"
                  >
                    {loading ? "Procesando…" : "Confirmar"}
                  </button>
                </div>
              )}
              <button onClick={close} className="font-body text-xs text-ink-secondary hover:text-brand-navy text-center transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
