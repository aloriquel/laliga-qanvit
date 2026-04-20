"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EcoApplicationActions({
  orgId,
  orgName,
  ownerEmail,
}: {
  orgId: string;
  orgName: string;
  ownerEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  async function callAction(action: "approve" | "reject" | "info", reason?: string) {
    setLoading(action);
    const res = await fetch(`/api/admin/ecosystem-applications/${orgId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, ownerEmail, orgName }),
    });
    setLoading(null);
    if (res.ok) {
      setShowRejectModal(false);
      router.refresh();
    } else {
      alert("Error al procesar la acción.");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => callAction("approve")}
          disabled={loading !== null}
          className="bg-brand-navy text-white font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50"
        >
          {loading === "approve" ? "Aprobando…" : "Aprobar"}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading !== null}
          className="border border-red-300 text-red-600 font-body text-sm px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          Rechazar
        </button>
        <button
          onClick={() => callAction("info")}
          disabled={loading !== null}
          className="border border-border-soft text-ink-secondary font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30 disabled:opacity-50"
        >
          {loading === "info" ? "Enviando…" : "Pedir info"}
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-sora font-bold text-brand-navy text-lg">Rechazar solicitud</h3>
            <p className="font-body text-sm text-ink-secondary">{orgName}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Razón del rechazo (se enviará al solicitante)"
              rows={4}
              className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30"
              >
                Cancelar
              </button>
              <button
                onClick={() => callAction("reject", rejectReason)}
                disabled={!rejectReason.trim() || loading !== null}
                className="bg-red-600 text-white font-body text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading === "reject" ? "Rechazando…" : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
