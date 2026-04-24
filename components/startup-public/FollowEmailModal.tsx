"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type Props = {
  slug: string;
  startupName: string;
  open: boolean;
  onClose: () => void;
};

type Status = "idle" | "submitting" | "confirmation_sent" | "already_subscribed" | "error";

export default function FollowEmailModal({ slug, startupName, open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !email) return;
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(slug)}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true }),
      });
      const data: { status?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error ?? "No se pudo procesar la suscripción.");
        setStatus("error");
        return;
      }
      if (data.status === "already_subscribed") setStatus("already_subscribed");
      else setStatus("confirmation_sent");
    } catch {
      setErrorMsg("Error de red. Inténtalo de nuevo.");
      setStatus("error");
    }
  }

  const isDone = status === "confirmation_sent" || status === "already_subscribed";

  return (
    <div
      role="dialog"
      aria-label={`Seguir a ${startupName}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
    >
      <div className="bg-white rounded-hero shadow-xl max-w-md w-full p-7 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-ink-secondary hover:text-brand-navy transition-colors"
        >
          <X size={18} />
        </button>

        {!isDone && (
          <>
            <p className="font-body text-xs text-brand-salmon uppercase tracking-widest font-semibold mb-2">
              Gracias por tu voto
            </p>
            <h2 className="font-sora font-bold text-xl text-brand-navy mb-2">
              ¿Seguir las novedades de {startupName}?
            </h2>
            <p className="font-body text-sm text-ink-secondary mb-5">
              Te avisamos cuando actualicen su deck, suban de división o entren en el Top 3 de su vertical.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border-soft bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
              />

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-brand-salmon"
                />
                <span className="font-body text-xs text-ink-secondary leading-relaxed">
                  Acepto recibir emails sobre novedades de {startupName} y la{" "}
                  <Link href="/legal/privacidad" target="_blank" className="text-brand-navy underline">
                    Política de privacidad
                  </Link>{" "}
                  de Qanvit.
                </span>
              </label>

              {errorMsg && (
                <p className="font-body text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={!consent || !email || status === "submitting"}
                className="w-full bg-brand-navy text-white font-body font-semibold text-sm rounded-xl py-3 hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
              >
                {status === "submitting" ? "Enviando…" : "Recibir novedades"}
              </button>
            </form>
          </>
        )}

        {status === "confirmation_sent" && (
          <>
            <h2 className="font-sora font-bold text-xl text-brand-navy mb-2">
              Revisa tu email
            </h2>
            <p className="font-body text-sm text-ink-secondary">
              Te hemos enviado un link para confirmar la suscripción.
              El link expira en 7 días.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full bg-brand-lavender text-brand-navy font-body font-semibold text-sm rounded-xl py-2.5 hover:bg-brand-lavender/80 transition-colors"
            >
              Cerrar
            </button>
          </>
        )}

        {status === "already_subscribed" && (
          <>
            <h2 className="font-sora font-bold text-xl text-brand-navy mb-2">
              Ya estás suscrito
            </h2>
            <p className="font-body text-sm text-ink-secondary">
              Ya sigues las novedades de {startupName}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full bg-brand-lavender text-brand-navy font-body font-semibold text-sm rounded-xl py-2.5 hover:bg-brand-lavender/80 transition-colors"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
