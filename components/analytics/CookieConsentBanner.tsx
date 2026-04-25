"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getConsent, setConsent } from "@/lib/analytics/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  function decide(decision: "accepted" | "rejected") {
    setConsent(decision);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies y analítica"
      className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:max-w-md z-50"
    >
      <div className="bg-brand-navy text-white rounded-card shadow-2xl border border-white/10 p-5">
        <p className="font-sora text-brand-salmon font-semibold text-xs mb-2 uppercase tracking-widest">
          Cookies y analítica
        </p>
        <p className="text-sm text-white/80 leading-relaxed mb-4">
          Usamos PostHog para entender cómo se usa La Liga Qanvit y mejorar la
          experiencia. Capturamos eventos sin identificar tu IP y, si lo aceptas,
          también grabaciones de sesión (sin contenido de formularios). Puedes
          cambiar tu decisión en cualquier momento desde el footer.{" "}
          <Link
            href="/legal/privacidad#cookies"
            className="text-brand-salmon hover:underline"
          >
            Más detalles
          </Link>
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
      </div>
    </div>
  );
}
