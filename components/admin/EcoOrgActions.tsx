"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EcoOrgActions({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"revoke" | "points" | null>(null);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/admin/ecosystem-organizations/${orgId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, points: action === "points" ? Number(points) : undefined, reason }),
    });
    setLoading(false);
    if (res.ok) {
      setShowModal(false);
      setAction(null);
      setReason("");
      setPoints("");
      router.refresh();
    } else {
      alert("Error al procesar.");
    }
  }

  return (
    <>
      <button
        onClick={() => { setAction("points"); setShowModal(true); }}
        className="text-brand-salmon font-body text-xs hover:underline mr-3"
      >
        Ajustar puntos
      </button>
      <button
        onClick={() => { setAction("revoke"); setShowModal(true); }}
        className="text-red-500 font-body text-xs hover:underline"
      >
        Revocar
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-sora font-bold text-brand-navy text-lg">
              {action === "revoke" ? "Revocar organización" : "Ajustar puntos"} — {orgName}
            </h3>
            {action === "points" && (
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Puntos (+/-)"
                className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon"
              />
            )}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón (obligatorio)"
              rows={3}
              className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowModal(false); setAction(null); }}
                className="border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!reason.trim() || loading || (action === "points" && !points)}
                className={`text-white font-body text-sm px-4 py-2 rounded-lg disabled:opacity-50 ${action === "revoke" ? "bg-red-600 hover:bg-red-700" : "bg-brand-navy hover:bg-brand-navy/90"}`}
              >
                {loading ? "Procesando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
