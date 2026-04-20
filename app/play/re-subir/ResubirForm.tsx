"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  startupId: string;
  currentOneLiner: string;
};

export default function ResubirForm({ startupId, currentOneLiner }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [oneLiner, setOneLiner] = useState(currentOneLiner);
  const [consentPublic, setConsentPublic] = useState(false);
  const [consentInternal, setConsentInternal] = useState(false);
  const [consentEval, setConsentEval] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (f.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("El archivo no puede superar 20 MB.");
      return;
    }
    setFile(f);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecciona un PDF."); return; }
    if (!consentEval) { setError("Debes aceptar el uso para evaluación."); return; }

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("one_liner", oneLiner);
    form.append("consent_public_profile", String(consentPublic));
    form.append("consent_internal_use", String(consentInternal));

    try {
      const res = await fetch("/api/decks/resubir", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al subir el deck.");
        setLoading(false);
        return;
      }

      router.push(`/play/evaluando/${data.deck_id}`);
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* One-liner */}
      <div>
        <label className="font-body text-sm font-medium text-brand-navy block mb-1.5">
          Pitch de una línea <span className="text-ink-secondary font-normal">(opcional, máx. 140 chars)</span>
        </label>
        <input
          type="text"
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value.slice(0, 140))}
          placeholder="Describe tu startup en una frase"
          className="w-full border border-border-soft rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon text-brand-navy"
        />
        <p className="font-mono text-xs text-ink-secondary mt-1">{oneLiner.length}/140</p>
      </div>

      {/* PDF upload */}
      <div>
        <label className="font-body text-sm font-medium text-brand-navy block mb-1.5">Nuevo deck (PDF)</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
            dragging ? "border-brand-salmon bg-brand-salmon/5" : "border-border-soft hover:border-brand-salmon/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {file ? (
            <div>
              <p className="font-mono text-sm text-brand-navy font-semibold">{file.name}</p>
              <p className="font-body text-xs text-ink-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <p className="font-body text-sm text-ink-secondary">Arrastra tu PDF aquí o <span className="text-brand-navy font-semibold underline underline-offset-2">haz click</span></p>
              <p className="font-mono text-xs text-ink-secondary/60 mt-1">PDF · máx. 20 MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Consents */}
      <div className="flex flex-col gap-3">
        {[
          { key: "eval", val: consentEval, set: setConsentEval, required: true,
            label: "Acepto que La Liga Qanvit evalúe mi deck con IA *" },
          { key: "public", val: consentPublic, set: setConsentPublic, required: false,
            label: "Acepto que mi score y clasificación sean públicos en el leaderboard" },
          { key: "internal", val: consentInternal, set: setConsentInternal, required: false,
            label: "Acepto el uso interno de mi deck para mejorar el sistema" },
        ].map(({ key, val, set, label }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => set(e.target.checked)}
              className="mt-0.5 accent-brand-salmon"
            />
            <span className="font-body text-sm text-brand-navy">{label}</span>
          </label>
        ))}
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file || !consentEval}
        className="bg-brand-navy text-white font-semibold rounded-xl py-3 font-body text-sm hover:bg-brand-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Subiendo..." : "Re-evaluarme →"}
      </button>
    </form>
  );
}
