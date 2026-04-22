"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Mail } from "lucide-react";

type State = "idle" | "loading" | "sent" | "error";

export function LoginForm({ authError, next }: { authError?: string; next?: string }) {
  const t = useTranslations("auth.login");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>(authError ? "error" : "idle");
  const [errorMsg, setErrorMsg] = useState(
    authError === "auth" ? t("error_link_expired") : ""
  );
  const [sentEmail, setSentEmail] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");

    const res = await fetch("/api/auth/send-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), ...(next ? { next } : {}) }),
    });
    const json = await res.json();

    if (!res.ok) {
      setErrorMsg(json.error ?? t("error_generic"));
      setState("error");
      return;
    }

    setSentEmail(email.trim());
    setState("sent");
  }

  async function handleGoogle() {
    const supabase = createClient();
    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  if (state === "sent") {
    return (
      <div className="bg-brand-lavender rounded-2xl shadow-xl border border-white/10 p-8 text-center flex flex-col items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-brand-salmon/20 flex items-center justify-center">
          <Mail className="h-7 w-7 text-brand-salmon" />
        </div>
        <h2 className="font-sora font-bold text-2xl text-brand-navy">{t("check_email_title")}</h2>
        <p className="font-body text-ink-secondary text-sm leading-relaxed">
          {t("check_email_body", { email: sentEmail })}
        </p>
        <p className="font-body text-xs text-ink-secondary">{t("check_email_spam")}</p>
        <button
          onClick={() => { setState("idle"); setEmail(""); }}
          className="mt-2 text-sm text-brand-navy underline underline-offset-2 font-medium hover:text-brand-navy/70 transition-colors"
        >
          {t("change_email")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-lavender rounded-2xl shadow-xl border border-white/10 p-8 flex flex-col gap-6">
      {next === "/ecosistema/aplicar" && (
        <div className="bg-brand-navy/10 border border-brand-navy/20 rounded-xl px-4 py-3 text-sm font-body text-brand-navy">
          Para solicitar acceso como ecosistema, primero inicia sesión con tu email institucional. Te enviaremos un magic link.
        </div>
      )}
      <div className="text-center">
        <h1 className="font-sora font-bold text-2xl text-brand-navy">{t("title")}</h1>
        <p className="font-body text-ink-secondary text-sm mt-1">
          {t("subtitle")}
        </p>
      </div>

      {state === "error" && errorMsg && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-semibold text-brand-navy">{t("email_label")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email_placeholder")}
            className="rounded-xl border border-border-soft px-4 py-3 font-body text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon placeholder:text-ink-secondary/50"
          />
        </label>
        <button
          type="submit"
          disabled={state === "loading" || !email.trim()}
          className="w-full bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
        >
          {state === "loading" ? t("sending") : t("cta_magic_link")}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border-soft" />
        <span className="font-body text-xs text-ink-secondary">{t("or_continue_with")}</span>
        <div className="flex-1 h-px bg-border-soft" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 border border-border-soft bg-white rounded-xl px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-lavender transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {t("cta_google")}
      </button>
    </div>
  );
}
