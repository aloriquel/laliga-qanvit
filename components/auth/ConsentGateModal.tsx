"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

type Variant = "startup" | "ecosystem";

const VARIANT_COPY: Record<Variant, string> = {
  startup:
    "Para usar La Liga Qanvit necesitas aceptar cómo tratamos tus datos. Procesamos tu deck con IA para generar feedback. Tu deck nunca es visible a terceros.",
  ecosystem:
    "Para usar La Liga Qanvit como organización del ecosistema necesitas aceptar cómo tratamos tus datos. Consulta los detalles en nuestra Política de privacidad y Términos de servicio.",
};

export function ConsentGateModal({
  show,
  variant = "startup",
}: {
  show: boolean;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(show);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleAccept() {
    if (!checked) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/consent", { method: "POST" });
      if (!res.ok) throw new Error("Error al guardar el consentimiento.");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-sora text-brand-navy text-xl">
            Antes de entrar
          </DialogTitle>
          <DialogDescription className="text-ink-secondary text-sm leading-relaxed">
            {VARIANT_COPY[variant]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="text-sm text-ink-secondary">
            Consulta los detalles en nuestra{" "}
            <Link
              href="/legal/privacidad"
              target="_blank"
              className="text-brand-navy underline"
            >
              Política de privacidad
            </Link>{" "}
            y{" "}
            <Link
              href="/legal/terminos"
              target="_blank"
              className="text-brand-navy underline"
            >
              Términos de servicio
            </Link>
            .
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 accent-brand-salmon"
            />
            <span className="text-sm text-brand-navy font-medium">
              He leído y acepto la política de privacidad y los términos de
              servicio.
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="w-full bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Acepto y entro"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
