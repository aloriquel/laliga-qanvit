import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { getActiveBatch, DECK_UPLOAD_LIMIT_PER_BATCH } from "@/lib/batches";
import ResubirForm from "./ResubirForm";

export const metadata: Metadata = { title: "Re-subir deck — La Liga Qanvit" };

type StartupRow = Database["public"]["Tables"]["startups"]["Row"];

export default async function ResubirPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("owner_id", user.id)
    .single() as { data: StartupRow | null };

  if (!startup) redirect("/play");

  const serviceClient = createServiceClient();
  const activeBatch = await getActiveBatch();

  let deckCount = 0;
  if (activeBatch) {
    const { data: participation } = await serviceClient
      .from("batch_participations")
      .select("deck_uploads_count")
      .eq("batch_id", activeBatch.id)
      .eq("startup_id", startup.id)
      .maybeSingle();
    deckCount = participation?.deck_uploads_count ?? 0;
  }

  const canResubmit = !!activeBatch && deckCount < DECK_UPLOAD_LIMIT_PER_BATCH;
  const batchEndsAt = activeBatch
    ? new Date(activeBatch.ends_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-lg">
        <p className="font-sora text-brand-salmon text-xs font-semibold tracking-widest uppercase mb-2">
          {"{ La Liga Qanvit }"}
        </p>
        <h1 className="font-sora font-bold text-3xl text-brand-navy mb-2">Re-evalúate</h1>
        <p className="font-body text-ink-secondary mb-8">
          Esto archivará tu evaluación actual y lanzará una nueva. Tu posición puede cambiar.
        </p>

        {!activeBatch ? (
          <div className="bg-white rounded-card border border-border-soft p-8 text-center">
            <p className="font-sora font-bold text-brand-navy text-lg mb-2">No hay batch activo</p>
            <p className="font-body text-ink-secondary text-sm">
              Espera al inicio del próximo batch para re-subir tu deck.
            </p>
          </div>
        ) : !canResubmit ? (
          <div className="bg-white rounded-card border border-border-soft p-8 text-center">
            <p className="font-sora font-bold text-brand-navy text-lg mb-2">Límite de subidas alcanzado</p>
            <p className="font-body text-ink-secondary text-sm">
              Has usado las <span className="font-semibold text-brand-navy">{DECK_UPLOAD_LIMIT_PER_BATCH}/{DECK_UPLOAD_LIMIT_PER_BATCH} subidas</span> del batch{" "}
              <span className="font-semibold text-brand-navy">{activeBatch.display_name}</span>.
              {batchEndsAt && (
                <> Podrás re-subir a partir del siguiente batch (finaliza el{" "}
                  <span className="font-semibold text-brand-navy">{batchEndsAt}</span>).</>
              )}
            </p>
            <a
              href="/dashboard"
              className="mt-6 inline-block font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors underline underline-offset-2"
            >
              ← Volver al dashboard
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2">
              <span className="font-mono text-xs bg-brand-navy/10 text-brand-navy px-3 py-1 rounded-full font-semibold">
                {deckCount}/{DECK_UPLOAD_LIMIT_PER_BATCH} subidas usadas · {activeBatch.display_name}
              </span>
            </div>
            <ResubirForm startupId={startup.id} currentOneLiner={startup.one_liner ?? ""} />
          </>
        )}
      </div>
    </div>
  );
}
