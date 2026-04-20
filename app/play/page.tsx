"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2 } from "lucide-react";

const STEPS = ["Tu startup", "Tu deck", "Consentimiento"] as const;

export default function PlayPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    oneLiner: "",
    file: null as File | null,
    consentEval: false,
    consentPublic: false,
    consentInternal: false,
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="font-mono text-brand-navy/40 text-sm tracking-widest uppercase mb-3">
            {"{ ficha tu startup }"}
          </p>
          <h1 className="font-sora font-bold text-3xl text-brand-navy">
            Únete a La Liga
          </h1>
          <p className="font-body text-ink-secondary mt-2 text-sm">
            3 pasos · menos de 3 minutos
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-sora font-semibold transition-colors ${
                    i < step
                      ? "bg-brand-navy text-brand-salmon"
                      : i === step
                      ? "bg-brand-salmon text-brand-navy"
                      : "bg-white border border-border-soft text-ink-secondary"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`font-body text-xs text-center hidden sm:block ${
                    i === step ? "text-brand-navy font-semibold" : "text-ink-secondary"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5 bg-white" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-card shadow-card border border-border-soft p-8">
          {/* Paso 1: Datos básicos */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-sora font-semibold text-xl text-brand-navy">
                Cuéntanos sobre tu startup
              </h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="font-body text-sm text-ink-primary">
                  Nombre de la startup *
                </Label>
                <Input
                  id="name"
                  placeholder="Ej. Acme Robotics"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  className="font-body border-border-soft focus:ring-brand-salmon"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="website" className="font-body text-sm text-ink-primary">
                  Web
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://tuempresa.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, website: e.target.value }))
                  }
                  className="font-body border-border-soft"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="oneLiner" className="font-body text-sm text-ink-primary">
                  ¿Qué hace tu startup? (una línea)
                </Label>
                <Input
                  id="oneLiner"
                  placeholder="Ej. Automatizamos la inspección industrial con visión artificial"
                  maxLength={140}
                  value={formData.oneLiner}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, oneLiner: e.target.value }))
                  }
                  className="font-body border-border-soft"
                />
                <span className="font-mono text-xs text-ink-secondary text-right">
                  {formData.oneLiner.length}/140
                </span>
              </div>
              <Button
                onClick={() => setStep(1)}
                disabled={!formData.name}
                className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl mt-2"
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Paso 2: Upload deck */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-sora font-semibold text-xl text-brand-navy">
                Sube tu deck
              </h2>
              <p className="font-body text-sm text-ink-secondary">
                PDF · máximo 20 MB. El contenido de tu deck es privado — solo lo
                vemos nosotros para evaluar.
              </p>
              <label
                htmlFor="deck-upload"
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-card p-10 cursor-pointer transition-colors ${
                  formData.file
                    ? "border-brand-navy bg-brand-lavender/50"
                    : "border-border-soft hover:border-brand-navy/40 bg-brand-lavender/20"
                }`}
              >
                <Upload
                  className={`h-8 w-8 ${
                    formData.file ? "text-brand-navy" : "text-ink-secondary"
                  }`}
                />
                {formData.file ? (
                  <div className="text-center">
                    <p className="font-sora font-semibold text-sm text-brand-navy">
                      {formData.file.name}
                    </p>
                    <p className="font-mono text-xs text-ink-secondary mt-1">
                      {(formData.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-body text-sm text-ink-primary">
                      Arrastra tu deck aquí o{" "}
                      <span className="text-brand-navy font-semibold underline underline-offset-2">
                        selecciona el archivo
                      </span>
                    </p>
                    <p className="font-mono text-xs text-ink-secondary mt-1">PDF · máx 20 MB</p>
                  </div>
                )}
                <input
                  id="deck-upload"
                  type="file"
                  accept=".pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setFormData((f) => ({ ...f, file }));
                  }}
                />
              </label>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(0)}
                  className="flex-1 text-ink-secondary"
                >
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.file}
                  className="flex-1 bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Consentimiento */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-sora font-semibold text-xl text-brand-navy">
                Consentimiento
              </h2>
              <p className="font-body text-sm text-ink-secondary">
                Elige qué autorizas. Puedes revocar en cualquier momento desde tu
                perfil.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    id: "consentEval",
                    label: "Autorizo evaluar mi deck con IA",
                    description:
                      "Necesario para participar. El texto de tu deck se procesa para generar feedback.",
                    required: true,
                    key: "consentEval" as const,
                  },
                  {
                    id: "consentPublic",
                    label: "Mostrar mi posición en el leaderboard público",
                    description:
                      "Tu nombre, score y posición serán visibles para cualquier visitante.",
                    required: false,
                    key: "consentPublic" as const,
                  },
                  {
                    id: "consentInternal",
                    label: "Uso interno del deck por Qanvit",
                    description:
                      "Permite a Qanvit usar tu deck para mejorar el evaluador y la plataforma.",
                    required: false,
                    key: "consentInternal" as const,
                  },
                ].map(({ id, label, description, required, key }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border-soft accent-brand-navy"
                      checked={formData[key]}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, [key]: e.target.checked }))
                      }
                    />
                    <div>
                      <p className="font-body text-sm font-medium text-ink-primary">
                        {label}
                        {required && (
                          <span className="text-brand-salmon ml-1 text-xs">
                            (requerido)
                          </span>
                        )}
                      </p>
                      <p className="font-body text-xs text-ink-secondary mt-0.5">
                        {description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 text-ink-secondary"
                >
                  Atrás
                </Button>
                <Button
                  disabled={!formData.consentEval}
                  className="flex-1 bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl"
                  onClick={() => {
                    // TODO (prompt #2): submit form → POST /api/decks/upload
                    alert("Coming soon — prompt #2 implementa el upload real");
                  }}
                >
                  Ficharme en la liga
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <p className="text-center font-body text-xs text-ink-secondary mt-6">
          Tu deck completo nunca se comparte con terceros. Solo el equipo Qanvit
          accede a él.{" "}
          <a href="/legal/privacidad" className="underline hover:text-brand-navy">
            Política de privacidad
          </a>
        </p>
      </div>
    </div>
  );
}
