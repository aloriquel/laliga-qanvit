"use client";

import { useState, useEffect } from "react";

type ConsentLevel = "none" | "analytics" | "all";

function getConsent(): ConsentLevel | null {
  try {
    const v = localStorage.getItem("cookie_consent");
    if (v === "none" || v === "analytics" || v === "all") return v;
    return null;
  } catch {
    return null;
  }
}

function setConsent(level: ConsentLevel) {
  try {
    localStorage.setItem("cookie_consent", level);
    document.cookie = `cookie_consent=${level}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
  } catch { /* noop */ }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true);
  }, []);

  function accept(level: ConsentLevel) {
    setConsent(level);
    setVisible(false);
    if ((level === "analytics" || level === "all") && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("posthog:consent-granted"));
    }
  }

  function saveCustom() {
    accept(analyticsEnabled ? "analytics" : "none");
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestión de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 md:bottom-4 md:left-4 md:right-auto md:max-w-sm"
    >
      <div className="bg-brand-navy text-white rounded-card shadow-2xl border border-white/10 p-5">
        <p className="font-sora text-brand-salmon font-semibold text-xs mb-3">{"{ cookies }"}</p>

        {!customizing ? (
          <>
            <p className="text-sm text-white/80 leading-relaxed mb-4">
              Usamos cookies técnicas (necesarias) y analíticas (opt-in) para mejorar la plataforma.{" "}
              <a href="/legal/cookies" className="text-brand-salmon hover:underline text-xs">
                Más info
              </a>
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => accept("all")}
                className="bg-brand-salmon text-brand-navy font-sora font-semibold text-sm py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                Aceptar todas
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => accept("none")}
                  className="flex-1 border border-white/20 text-white/70 text-sm py-2 px-4 rounded-lg hover:border-white/40 transition-colors"
                >
                  Solo necesarias
                </button>
                <button
                  onClick={() => setCustomizing(true)}
                  className="flex-1 border border-white/20 text-white/70 text-sm py-2 px-4 rounded-lg hover:border-white/40 transition-colors"
                >
                  Personalizar
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-white/80 mb-4">Elige qué cookies aceptas:</p>
            <div className="space-y-3 mb-4">
              <label className="flex items-start gap-3 cursor-not-allowed opacity-60">
                <input type="checkbox" checked disabled className="mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Técnicas (necesarias)</p>
                  <p className="text-xs text-white/60">Sesión, idioma, referral. No se pueden desactivar.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold">Analíticas (PostHog)</p>
                  <p className="text-xs text-white/60">Eventos de uso anónimos para mejorar la plataforma.</p>
                </div>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveCustom}
                className="flex-1 bg-brand-salmon text-brand-navy font-sora font-semibold text-sm py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                Guardar
              </button>
              <button
                onClick={() => setCustomizing(false)}
                className="border border-white/20 text-white/70 text-sm py-2 px-4 rounded-lg hover:border-white/40 transition-colors"
              >
                Volver
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
