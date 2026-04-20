"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/lib/actions/locale";

const LOCALES = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSwitch(locale: string) {
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      // Force reload so the new locale takes effect from server
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-1" aria-label="Cambiar idioma">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleSwitch(l.code)}
          disabled={isPending}
          className={[
            "text-xs font-sora font-semibold px-2 py-1 rounded transition-colors",
            l.code === currentLocale
              ? "text-brand-salmon cursor-default"
              : "text-white/50 hover:text-white",
          ].join(" ")}
          aria-current={l.code === currentLocale ? "true" : undefined}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
