"use client";

import { useEffect, useState } from "react";

import {
  getConsent,
  setConsent,
  type ConsentDecision,
} from "@/lib/analytics/consent";
import { disablePostHog } from "@/lib/analytics/posthog";

/**
 * Small footer link that opens an inline dialog so the user can change
 * the analytics consent decision at any time. PROMPT_POSTHOG FASE 4.12.
 */
export function AnalyticsConsentLink({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ConsentDecision | null>(null);

  useEffect(() => {
    if (open) setCurrent(getConsent());
  }, [open]);

  function decide(next: ConsentDecision) {
    const previous = getConsent();
    setConsent(next);

    if (previous === "accepted" && next === "rejected") {
      disablePostHog();
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("ph_") || k.includes("posthog"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        /* noop */
      }
      setCurrent("rejected");
      setOpen(false);
      return;
    }

    if (previous !== "accepted" && next === "accepted") {
      // Simpler than warm-init: refresh and let PostHogProvider mount with consent.
      window.location.reload();
      return;
    }

    setCurrent(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:text-white transition-colors"
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Cambiar consentimiento de analítica"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        >
          <div className="bg-brand-navy text-white rounded-card shadow-2xl border border-white/10 p-6 max-w-md w-full">
            <p className="font-sora text-brand-salmon font-semibold text-xs uppercase tracking-widest mb-2">
              Cookies y analítica
            </p>
            <p className="text-sm text-white/80 leading-relaxed mb-4">
              Estado actual:{" "}
              <strong className="text-white">
                {current === "accepted"
                  ? "Aceptado"
                  : current === "rejected"
                    ? "Rechazado"
                    : "No decidido"}
              </strong>
              .
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="flex-1 bg-brand-salmon text-brand-navy font-sora font-semibold text-sm py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                Aceptar
              </button>
              <button
                type="button"
                onClick={() => decide("rejected")}
                className="flex-1 border border-white/20 text-white/80 text-sm py-2 px-4 rounded-lg hover:border-white/40 transition-colors"
              >
                Rechazar
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full text-xs text-white/50 hover:text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
