"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Upload, ChevronRight, AlertCircle } from "lucide-react";
import RegionSelector from "@/components/ui/RegionSelector";
import { FundingStageSelector, IsRaisingToggle } from "@/components/ui/FundingStageSelector";
import type { CaId } from "@/lib/spain-regions";
import type { FundingStage } from "@/lib/funding-stage";

type Step = 0 | 1;

type StartupFormData = {
  name: string;
  website: string;
  oneLiner: string;
};

type RegionValue = { ca: CaId | null; province: string | null };

type PlaySource = "home_cta" | "empty_slot" | "promo_card" | "direct" | "other";

function parseSource(raw: string | null): PlaySource {
  if (raw === "home_cta" || raw === "empty_slot" || raw === "promo_card" || raw === "direct" || raw === "other") {
    return raw;
  }
  return raw ? "other" : "direct";
}

export default function PlayPage() {
  const t = useTranslations("play");
  const ta = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedAt = useRef<number>(Date.now());
  const publishedRef = useRef<boolean>(false);
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    const source = parseSource(searchParams?.get("source") ?? null);
    track(EVENTS.PLAY_STARTED, { source });
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (publishedRef.current) return;
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
      track(EVENTS.PLAY_ABANDONED, {
        last_step: `step_${step}`,
        time_spent_seconds: elapsed,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [startupId, setStartupId] = useState<string | null>(null);
  const [isNewStartup, setIsNewStartup] = useState(false);
  const [form, setForm] = useState<StartupFormData>({ name: "", website: "", oneLiner: "" });
  const [region, setRegion] = useState<RegionValue>({ ca: null, province: null });
  const [fundingStage, setFundingStage] = useState<FundingStage | null>(null);
  const [isRaising, setIsRaising] = useState(false);
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
        const email = window.prompt(ta("email_label") + ":");
        if (!email) { setLoading(false); return; }
        const res = await fetch("/api/auth/send-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, next: "/play" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("error_send_link"));
        setError(t("magic_link_sent"));
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
        setIsNewStartup(false);
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
        setIsNewStartup(true);

        // Save region for new startup
        if (region.ca && region.province) {
          await fetch("/api/startup/region", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ region_ca: region.ca, region_province: region.province }),
          });
        }
        // Save funding stage for new startup
        if (fundingStage) {
          await fetch("/api/startup/funding-stage", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ funding_stage: fundingStage, is_raising: isRaising }),
          });
        }
      }

      track(EVENTS.PLAY_STEP_COMPLETED, { step_name: "basics", step_number: 0 });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_send_link"));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Upload deck ─────────────────────────────────────────────────
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !startupId) return;
    if (!consentEval) { setError(t("error_no_consent")); return; }
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
      if (!res.ok) throw new Error(json.error ?? t("upload_hint"));

      track(EVENTS.PLAY_STEP_COMPLETED, { step_name: "deck_upload", step_number: 1 });
      // Mark as published-flow-completed so the unmount cleanup does NOT
      // emit play_abandoned when the router navigates away.
      publishedRef.current = true;
      router.push(`/play/evaluando/${json.deck_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_send_link"));
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") { setFile(dropped); setError(null); }
    else setError(t("error_only_pdf"));
  }

  const STEPS = [t("step_startup"), t("step_deck")];
  const regionComplete = region.ca !== null && region.province !== null;
  const stageComplete = fundingStage !== null;

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

        <div className="bg-white rounded-hero shadow-card border border-border-soft p-5 md:p-8">
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
                <h1 className="font-sora font-bold text-2xl text-brand-navy">{t("title")}</h1>
                <p className="font-body text-ink-secondary text-sm mt-1">{t("basics_subtitle")}</p>
              </div>
              <label className="flex flex-col gap-1">
                <span className="font-body text-sm font-semibold text-brand-navy">{t("name_label")}</span>
                <input
                  required
                  className="rounded-card border border-border-soft px-4 py-2.5 font-body text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t("name_placeholder")}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-sm font-semibold text-brand-navy">{t("website_label")}</span>
                <input
                  type="url"
                  className="rounded-card border border-border-soft px-4 py-2.5 font-body text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder={t("website_placeholder")}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-sm font-semibold text-brand-navy">
                  {t("one_liner_label")} <span className="font-normal text-ink-secondary">{t("one_liner_max")}</span>
                </span>
                <input
                  maxLength={140}
                  className="rounded-card border border-border-soft px-4 py-2.5 font-body text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  value={form.oneLiner}
                  onChange={e => setForm(f => ({ ...f, oneLiner: e.target.value }))}
                  placeholder={t("one_liner_placeholder")}
                />
              </label>

              {/* Region — required for new startups */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-sm font-semibold text-brand-navy">
                    ¿Dónde está tu startup?{" "}
                    <span className="text-red-500">*</span>
                  </span>
                </div>
                <p className="font-body text-xs text-ink-secondary mb-2">
                  Nos ayuda a destacarte en rankings regionales.
                </p>
                <RegionSelector
                  value={region}
                  onChange={setRegion}
                  required={true}
                  showLabels={false}
                />
              </div>

              {/* Fase de financiación — obligatorio */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-body text-sm font-semibold text-brand-navy">
                    ¿En qué fase está tu startup?
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <p className="font-body text-xs text-ink-secondary mb-2">
                  Determina tu división en la liga. Podrás cambiarlo desde el dashboard.
                </p>
                <FundingStageSelector
                  value={fundingStage}
                  onChange={setFundingStage}
                  required={true}
                  showDescriptions={false}
                />
              </div>

              {/* ¿Levantando ronda? */}
              <IsRaisingToggle value={isRaising} onChange={setIsRaising} />

              <button
                type="submit"
                disabled={loading || !form.name.trim() || !regionComplete || !stageComplete}
                className="mt-2 bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 font-body flex items-center justify-center gap-2 hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
              >
                {loading ? t("saving") : t("next")}
                <ChevronRight className="h-4 w-4" />
              </button>
              {(!regionComplete || !stageComplete) && form.name.trim() && (
                <p className="font-body text-xs text-ink-secondary text-center -mt-2">
                  {!regionComplete ? "Selecciona tu CA y provincia" : "Selecciona tu fase de financiación"} para continuar.
                </p>
              )}
            </form>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-5">
              <div>
                <h2 className="font-sora font-bold text-2xl text-brand-navy">{t("deck_title")}</h2>
                <p className="font-body text-ink-secondary text-sm mt-1">{t("deck_subtitle")}</p>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-hero p-6 md:p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
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
                    <p className="font-body text-sm text-brand-navy font-semibold">{t("drag_pdf")}</p>
                    <p className="font-body text-xs text-ink-secondary">{t("click_select")}</p>
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
                <p className="font-body text-sm font-semibold text-brand-navy">{t("permisos")}</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentEval} onChange={e => setConsentEval(e.target.checked)} className="mt-0.5 accent-brand-salmon" />
                  <span className="font-body text-sm text-brand-navy">
                    <strong>{t("consent_eval_label")}</strong> — {t("consent_eval_desc")} <span className="text-red-500">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentPublic} onChange={e => setConsentPublic(e.target.checked)} className="mt-0.5 accent-brand-salmon" />
                  <span className="font-body text-sm text-ink-secondary">
                    {t("consent_public_label")}
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentInternal} onChange={e => setConsentInternal(e.target.checked)} className="mt-0.5 accent-brand-salmon" />
                  <span className="font-body text-sm text-ink-secondary">
                    {t("consent_internal_label")}
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="border border-border-soft rounded-xl px-4 py-3 font-body text-sm text-ink-secondary hover:bg-brand-lavender transition-colors"
                >
                  {t("back")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !file || !consentEval}
                  className="flex-1 bg-brand-salmon text-brand-navy font-semibold rounded-xl px-6 py-3 font-body flex items-center justify-center gap-2 hover:bg-brand-salmon/90 transition-colors disabled:opacity-50"
                >
                  {loading ? t("uploading") : t("evaluate_cta")}
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
