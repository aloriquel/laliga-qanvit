"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Upload, ChevronRight, AlertCircle } from "lucide-react";

type Step = 0 | 1;

type StartupFormData = {
  name: string;
  website: string;
  oneLiner: string;
};

export default function PlayPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [startupId, setStartupId] = useState<string | null>(null);
  const [form, setForm] = useState<StartupFormData>({ name: "", website: "", oneLiner: "" });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [consentEval, setConsentEval] = useState(false);
  const [consentPublic, setConsentPublic] = useState(false);
  const [consentInternal, setConsentInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 0: Startup basics ──────────────────────────────────────────────
  async function handleStep0(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const email = window.prompt("Introduce tu email para acceder:");
        if (!email) { setLoading(false); return; }
        const redirectTo = `${window.location.origin}/auth/callback?next=/play`;
        const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo } });
        if (authError) throw authError;
        setError("Te hemos enviado un enlace mágico. Haz clic en él y volverás aquí autenticado.");
        setLoading(false);
        return;
      }

      const slug = form.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);

      const { data: existing } = await supabase
        .from("startups")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase.from("startups").update({
          name: form.name,
          website: form.website || null,
          one_liner: form.oneLiner || null,
        }).eq("id", existing.id);
        setStartupId(existing.id);
      } else {
        const { data: created, error: createError } = await supabase
          .from("startups")
          .insert({
            owner_id: user.id,
            slug,
            name: form.name,
            website: form.website || null,
            one_liner: form.oneLiner || null,
          })
          .select("id")
          .single();
        if (createError) throw createError;
        setStartupId(created!.id);
      }

      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Upload deck ─────────────────────────────────────────────────
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !startupId) return;
    if (!consentEval) { setError("Debes aceptar que tu deck sea evaluado para continuar."); return; }
    setError(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("startup_id", startupId);
      fd.append("consent_evaluation", String(consentEval));
      fd.append("consent_public_profile", String(consentPublic));
      fd.append("consent_internal_use", String(consentInternal));

      const res = await fetch("/api/decks/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir el deck");

      router.push(`/play/evaluando/${json.deck_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") { setFile(dropped); setError(null); }
    else setError("Solo se aceptan archivos PDF.");
  }

  const STEPS = ["Tu startup", "Tu deck"];

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-xl">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm font-semibold transition-colors",
                i < step ? "bg-brand-navy text-white" : i === step ? "bg-brand-salmon text-brand-navy" : "bg-white border border-border-soft text-ink-secondary"
              )}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn("font-body text-sm hidden sm:block", i === step ? "text-brand-navy font-semibold" : "text-ink-secondary")}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border-soft" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-hero shadow-card border border-border-soft p-8">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 0 ── */}
          {step === 0 && (
            <form onSubmit={handleStep0} className="flex flex-col gap-5">
              <div>
                <h1 className="font-sora font-bold text-2xl text-brand-navy">Ficha tu startup</h1>
                <p className="font-body text-ink-secondary text-sm mt-1">Cuéntanos lo básico. Lo puedes editar más adelante.</p>
              </div>
              <label className="flex flex-col gap-1">
                <span className="font-body text-sm font-semibold text-brand-navy">Nombre de la startup *</span>
                <input
                  required
                  className="rounded-card border border-border-soft px-4 py-2.5 font-body text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Orbea Robotics"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-sm font-semibold text-brand-navy">Website</span>
                <input
                  type="url"
                  className="rounded-card border border-border-soft px-4 py-2.5 font-body text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://tuempresa.com"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-sm font-semibold text-brand-navy">
                  One-liner <span className="font-normal text-ink-secondary">(max 140 chars)</span>
                </span>
                <input
                  maxLength={140}
                  className="rounded-card border border-border-soft px-4 py-2.5 font-body text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  value={form.oneLiner}
                  onChange={e => setForm(f => ({ ...f, oneLiner: e.target.value }))}
                  placeholder="Automatizamos la inspección industrial con visión por computador."
                />
              </label>
              <button
                type="submit"
                disabled={loading || !form.name.trim()}
                className="mt-2 bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 font-body flex items-center justify-center gap-2 hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Siguiente"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-5">
              <div>
                <h2 className="font-sora font-bold text-2xl text-brand-navy">Sube tu deck</h2>
                <p className="font-body text-ink-secondary text-sm mt-1">PDF, máximo 20 MB. Asegúrate de que el PDF tenga texto seleccionable.</p>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-hero p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                  dragging ? "border-brand-salmon bg-brand-salmon/5" : "border-border-soft hover:border-brand-navy/30",
                  file ? "bg-green-50 border-green-400" : ""
                )}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <Upload className={cn("h-10 w-10", file ? "text-green-600" : "text-ink-secondary")} />
                {file ? (
                  <div className="text-center">
                    <p className="font-body font-semibold text-green-700 text-sm">{file.name}</p>
                    <p className="font-body text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-body text-sm text-brand-navy font-semibold">Arrastra tu PDF aquí</p>
                    <p className="font-body text-xs text-ink-secondary">o haz clic para seleccionar</p>
                  </div>
                )}
              </div>
              <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setError(null); }
                }}
              />

              {/* Consents */}
              <div className="flex flex-col gap-3 border-t border-border-soft pt-4">
                <p className="font-body text-sm font-semibold text-brand-navy">Permisos de uso</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentEval} onChange={e => setConsentEval(e.target.checked)} className="mt-0.5 accent-brand-salmon" />
                  <span className="font-body text-sm text-brand-navy">
                    <strong>Acepto que mi deck sea evaluado por IA</strong> — Qanvit procesará el texto para generar feedback. El contenido del deck nunca es visible a terceros. <span className="text-red-500">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentPublic} onChange={e => setConsentPublic(e.target.checked)} className="mt-0.5 accent-brand-salmon" />
                  <span className="font-body text-sm text-ink-secondary">
                    Mi nombre, score y División pueden aparecer en el leaderboard público.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentInternal} onChange={e => setConsentInternal(e.target.checked)} className="mt-0.5 accent-brand-salmon" />
                  <span className="font-body text-sm text-ink-secondary">
                    Qanvit puede usar el feedback anonimizado para mejorar el evaluador.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="border border-border-soft rounded-xl px-4 py-3 font-body text-sm text-ink-secondary hover:bg-brand-lavender transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading || !file || !consentEval}
                  className="flex-1 bg-brand-salmon text-brand-navy font-semibold rounded-xl px-6 py-3 font-body flex items-center justify-center gap-2 hover:bg-brand-salmon/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Subiendo..." : "Evaluar mi startup"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
