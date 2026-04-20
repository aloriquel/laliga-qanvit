"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartupAdminActions({
  startupId,
  startupName,
  isPublic,
}: {
  startupId: string;
  startupName: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [action, setAction] = useState<"hide" | "restore" | "rerun" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  function open(a: typeof action) { setAction(a); setShow(true); }
  function close() { setShow(false); setAction(null); setReason(""); }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/admin/startups/${startupId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setLoading(false);
    if (res.ok) { close(); router.refresh(); }
    else alert("Error.");
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <button onClick={() => open("rerun")} className="text-blue-500 font-body text-xs hover:underline text-left">Forzar reclasificación</button>
        {isPublic ? (
          <button onClick={() => open("hide")} className="text-red-500 font-body text-xs hover:underline text-left">Ocultar leaderboard</button>
        ) : (
          <button onClick={() => open("restore")} className="text-green-600 font-body text-xs hover:underline text-left">Restaurar visibilidad</button>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-sora font-bold text-brand-navy text-lg">
              {action === "hide" ? "Ocultar del leaderboard" :
               action === "restore" ? "Restaurar visibilidad" :
               "Forzar reclasificación"} — {startupName}
            </h3>
            {(action === "hide" || action === "rerun") && (
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Razón (obligatorio)"
                rows={3}
                className="w-full border border-border-soft rounded-lg px-3 py-2 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-salmon" />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={close} className="border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30">Cancelar</button>
              <button onClick={submit}
                disabled={loading || ((action === "hide" || action === "rerun") && !reason.trim())}
                className="bg-brand-navy text-white font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50">
                {loading ? "Procesando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
