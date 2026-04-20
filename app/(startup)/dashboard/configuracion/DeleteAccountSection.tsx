"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CONFIRMATION_PHRASE = "eliminar mi cuenta";

export default function DeleteAccountSection() {
  const [step, setStep] = useState<"idle" | "confirm1" | "confirm2" | "deleting" | "done">("idle");
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (phrase !== CONFIRMATION_PHRASE) {
      setError(`Escribe exactamente: "${CONFIRMATION_PHRASE}"`);
      return;
    }
    setStep("deleting");
    setError(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Error al eliminar cuenta");
        setStep("confirm2");
        return;
      }
      setStep("done");
      // Redirect to home after brief pause
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
      setStep("confirm2");
    }
  }

  if (step === "done") {
    return (
      <div className="bg-white rounded-card border border-border-soft p-6 text-center">
        <p className="font-body text-sm text-ink-secondary">Cuenta eliminada. Redirigiendo...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-card border border-red-100 p-5">
        <p className="font-body text-sm text-ink-secondary mb-4">
          Eliminar tu cuenta borrará permanentemente tu startup, todos tus decks y evaluaciones. Esta acción es irreversible.
        </p>
        <Button
          variant="destructive"
          onClick={() => setStep("confirm1")}
          className="font-body text-sm"
        >
          Eliminar mi cuenta
        </Button>
      </div>

      {/* Step 1: Warning */}
      <Dialog open={step === "confirm1"} onOpenChange={(o) => !o && setStep("idle")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sora text-red-600">¿Eliminar tu cuenta?</DialogTitle>
            <DialogDescription className="font-body text-sm text-ink-secondary mt-2">
              Esto eliminará de forma permanente:
            </DialogDescription>
          </DialogHeader>
          <ul className="font-body text-sm text-brand-navy flex flex-col gap-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-red-400">•</span>Tu perfil de startup y todos sus datos</li>
            <li className="flex items-start gap-2"><span className="text-red-400">•</span>Todos tus decks subidos (archivos PDF)</li>
            <li className="flex items-start gap-2"><span className="text-red-400">•</span>Todas tus evaluaciones e historial</li>
            <li className="flex items-start gap-2"><span className="text-red-400">•</span>Tu cuenta de usuario</li>
          </ul>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("idle")} className="flex-1">Cancelar</Button>
            <Button variant="destructive" onClick={() => setStep("confirm2")} className="flex-1">Sí, continuar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2: Type confirmation */}
      <Dialog open={step === "confirm2" || step === "deleting"} onOpenChange={(o) => !o && step !== "deleting" && setStep("idle")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sora text-red-600">Confirmación final</DialogTitle>
            <DialogDescription className="font-body text-sm text-ink-secondary mt-2">
              Escribe <span className="font-mono font-semibold text-brand-navy">{CONFIRMATION_PHRASE}</span> para confirmar.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={phrase}
            onChange={(e) => { setPhrase(e.target.value); setError(null); }}
            placeholder={CONFIRMATION_PHRASE}
            className="w-full border border-border-soft rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-2"
          />
          {error && <p className="font-body text-xs text-red-500 mb-2">{error}</p>}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setStep("idle"); setPhrase(""); setError(null); }}
              disabled={step === "deleting"}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={step === "deleting" || phrase !== CONFIRMATION_PHRASE}
              className="flex-1"
            >
              {step === "deleting" ? "Eliminando..." : "Eliminar cuenta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
