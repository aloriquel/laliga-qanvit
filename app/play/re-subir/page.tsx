import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { getRateLimitUnlockDate } from "@/lib/decks/upload-core";
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

  // Check rate limit
  const { data: lastDeck } = await supabase
    .from("decks")
    .select("uploaded_at")
    .eq("startup_id", startup.id)
    .neq("status", "archived")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const canResubmit = !lastDeck || new Date() >= getRateLimitUnlockDate(lastDeck.uploaded_at);
  const unlockDate = lastDeck ? getRateLimitUnlockDate(lastDeck.uploaded_at) : null;

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

        {!canResubmit && unlockDate ? (
          <div className="bg-white rounded-card border border-border-soft p-8 text-center">
            <p className="font-sora font-bold text-brand-navy text-lg mb-2">Aún no puedes re-subir</p>
            <p className="font-body text-ink-secondary text-sm">
              Podrás re-subir tu deck el{" "}
              <span className="font-semibold text-brand-navy">
                {unlockDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              .
            </p>
            <a
              href="/dashboard"
              className="mt-6 inline-block font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors underline underline-offset-2"
            >
              ← Volver al dashboard
            </a>
          </div>
        ) : (
          <ResubirForm startupId={startup.id} currentOneLiner={startup.one_liner ?? ""} />
        )}
      </div>
    </div>
  );
}
