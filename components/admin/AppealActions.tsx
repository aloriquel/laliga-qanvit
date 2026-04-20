"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIVISIONS = ["ideation", "seed", "growth", "elite"] as const;
const VERTICALS = [
  "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech", "agrifood",
  "healthtech_medtech", "industrial_manufacturing", "space_aerospace", "materials_chemistry", "cybersecurity",
] as const;

export default function AppealActions({
  appealId,
  evalId,
  startupName,
}: {
  appealId: string;
  evalId: string;
  startupName: string;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [action, setAction] = useState<"override" | "rerun" | "reject" | null>(null);
  const [division, setDivision] = useState("");
  const [vertical, setVertical] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function open(a: typeof action) { setAction(a); setShow(true); }
  function close() { setShow(false); setAction(null); setNotes(""); }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/admin/evaluation-appeals/${appealId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, division, vertical, notes, evalId }),
    });
    setLoading(false);
    if (res.ok) { close(); router.refresh(); }
    else alert("Error al procesar.");
  }

  return (
    <>
      <div className="flex flex-col gap-2 shrink-0">
        <button onClick={() => open("override")} className="bg-brand-navy text-white font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-navy/90">
          Aceptar con override
        </button>
        <button onClick={() => open("rerun")} className="border border-blue-300 text-blue-600 font-body text-sm px-4 py-2 rounded-lg hover:bg-blue-50">
          Aceptar con re-run
        </button>
        <button onClick={() => open("reject")} className="border border-red-300 text-red-600 font-body text-sm px-4 py-2 rounded-lg hover:bg-red-50">
          Rechazar
        </button>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-sora font-bold text-brand-navy text-lg">
              {action === "override" ? "Aceptar con override" :
               action === "rerun" ? "Aceptar con re-run" :
               "Rechazar impugnación"} — {startupName}
            </h3>

            {action === "override" && (
              <div className="space-y-3">
                <select value={division} onChange={(e) => setDivision(e.target.value)}
                  className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm">
                  <option value="">División</option>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={vertical} onChange={(e) => setVertical(e.target.value)}
                  className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm">
                  <option value="">Vertical</option>
                  {VERTICALS.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            )}

            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de resolución"
              rows={3}
              className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon" />

            <div className="flex gap-2 justify-end">
              <button onClick={close} className="border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30">
                Cancelar
              </button>
              <button onClick={submit}
                disabled={loading || (action === "override" && (!division || !vertical))}
                className={`text-white font-body text-sm px-4 py-2 rounded-lg disabled:opacity-50 ${action === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-brand-navy hover:bg-brand-navy/90"}`}>
                {loading ? "Procesando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
