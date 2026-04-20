"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIVISIONS = ["ideation", "seed", "growth", "elite"] as const;
const VERTICALS = [
  "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech", "agrifood",
  "healthtech_medtech", "industrial_manufacturing", "space_aerospace", "materials_chemistry", "cybersecurity",
] as const;

export default function EvalAdminActions({ evalId, startupId }: { evalId: string; startupId: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [action, setAction] = useState<"override" | "rerun" | "calibration" | "delete" | null>(null);
  const [division, setDivision] = useState("");
  const [vertical, setVertical] = useState("");
  const [reason, setReason] = useState("");
  const [confirm2, setConfirm2] = useState(false);
  const [loading, setLoading] = useState(false);

  function open(a: typeof action) { setAction(a); setShow(true); setConfirm2(false); }
  function close() { setShow(false); setAction(null); setReason(""); setDivision(""); setVertical(""); setConfirm2(false); }

  async function submit() {
    if (action === "delete" && !confirm2) { setConfirm2(true); return; }
    setLoading(true);
    const res = await fetch(`/api/admin/evaluations/${evalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, division, vertical, reason, startupId }),
    });
    setLoading(false);
    if (res.ok) { close(); router.refresh(); }
    else alert("Error al procesar.");
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <button onClick={() => open("override")} className="text-brand-salmon font-body text-xs hover:underline text-left">Override</button>
        <button onClick={() => open("rerun")} className="text-blue-500 font-body text-xs hover:underline text-left">Re-run</button>
        <button onClick={() => open("calibration")} className="text-amber-600 font-body text-xs hover:underline text-left">Calibración</button>
        <button onClick={() => open("delete")} className="text-red-500 font-body text-xs hover:underline text-left">Eliminar</button>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-sora font-bold text-brand-navy text-lg capitalize">
              {action === "override" ? "Override clasificación" :
               action === "rerun" ? "Re-run pipeline" :
               action === "calibration" ? "Marcar como calibración" :
               "Eliminar evaluación"}
            </h3>
            <p className="font-mono text-xs text-ink-secondary">{evalId}</p>

            {action === "override" && (
              <div className="space-y-3">
                <select value={division} onChange={(e) => setDivision(e.target.value)}
                  className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm">
                  <option value="">Seleccionar división</option>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={vertical} onChange={(e) => setVertical(e.target.value)}
                  className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm">
                  <option value="">Seleccionar vertical</option>
                  {VERTICALS.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            )}

            {(action === "override" || action === "delete" || action === "rerun") && (
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Razón (obligatorio)"
                rows={3}
                className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon" />
            )}

            {action === "delete" && confirm2 && (
              <p className="font-body text-sm text-red-600 font-semibold">¿Confirmar eliminación permanente? No se puede deshacer.</p>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={close}
                className="border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30">
                Cancelar
              </button>
              <button onClick={submit}
                disabled={loading || (action === "override" && (!division || !vertical || !reason.trim())) || ((action === "rerun") && !reason.trim())}
                className={`text-white font-body text-sm px-4 py-2 rounded-lg disabled:opacity-50 ${action === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-brand-navy hover:bg-brand-navy/90"}`}>
                {loading ? "Procesando…" : action === "delete" ? (confirm2 ? "Eliminar definitivamente" : "Confirmar") : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
