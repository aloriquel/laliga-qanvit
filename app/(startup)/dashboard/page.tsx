import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import ClassificationCard from "@/components/league/ClassificationCard";
import DashboardShareButton from "./DashboardShareButton";
import { renderAlertText, alertIcon } from "@/lib/dashboard/alert-text";
import { getRateLimitUnlockDate } from "@/lib/decks/upload-core";
import { formatDistanceToNow } from "./date-utils";

type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"];
type StartupRow = Database["public"]["Tables"]["startups"]["Row"];
type AlertRow = Database["public"]["Tables"]["startup_alerts"]["Row"];

const DIMENSION_LABELS: Record<string, string> = {
  problem: "Problem Severity",
  market: "Market Size & Timing",
  solution: "Solution & Moat",
  team: "Team Strength",
  traction: "Traction & Validation",
  business_model: "Business Model",
  gtm: "Go-to-Market",
};

type DimFeedback = { score: number };

export default async function DashboardHomePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("owner_id", user.id)
    .single() as { data: StartupRow | null };

  if (!startup) redirect("/play");

  // Last two evaluations for delta calculation
  const { data: evalRows } = await supabase
    .from("evaluations")
    .select("*")
    .eq("startup_id", startup.id)
    .order("created_at", { ascending: false })
    .limit(2) as { data: EvaluationRow[] | null };

  const latestEval = evalRows?.[0] ?? null;
  const prevEval = evalRows?.[1] ?? null;

  const { data: standing } = await supabase
    .from("league_standings")
    .select("rank_national, rank_division, rank_division_vertical")
    .eq("startup_id", startup.id)
    .maybeSingle();

  const { data: alerts } = await supabase
    .from("startup_alerts")
    .select("*")
    .eq("startup_id", startup.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: AlertRow[] | null };

  // Last non-archived deck for rate limit check
  const { data: lastDeck } = await supabase
    .from("decks")
    .select("uploaded_at, status")
    .eq("startup_id", startup.id)
    .neq("status", "archived")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const canResubmit = !lastDeck || new Date() >= getRateLimitUnlockDate(lastDeck.uploaded_at);
  const unlockDate = lastDeck ? getRateLimitUnlockDate(lastDeck.uploaded_at) : null;

  const scoreDelta = latestEval && prevEval
    ? Number(latestEval.score_total) - Number(prevEval.score_total)
    : null;

  // 3 lowest scoring dimensions
  const weakDimensions = latestEval
    ? Object.entries(DIMENSION_LABELS)
        .map(([key, label]) => {
          const dim = (latestEval.feedback as Record<string, DimFeedback>)[key];
          return { key, label, score: dim?.score ?? 0 };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
    : [];

  const hasLogo = !!(startup as unknown as { logo_url?: string | null }).logo_url;

  return (
    <div className="pb-20 md:pb-0">
      {/* ── Logo onboarding banner ── */}
      {!hasLogo && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-brand-lavender border border-border-soft rounded-2xl px-5 py-4">
          <p className="font-body text-sm text-brand-navy">
            <span className="font-semibold">Añade el logo de tu startup</span> para que te reconozcan en el leaderboard y en las cartas compartibles.
          </p>
          <a
            href="/dashboard/configuracion#logo"
            className="flex-shrink-0 font-body text-sm font-semibold text-brand-navy bg-white border border-border-soft rounded-xl px-4 py-2 hover:bg-brand-lavender/60 transition-colors"
          >
            Subir logo →
          </a>
        </div>
      )}

      {/* ── Hero card ── */}
      <section className="mb-8">
        {latestEval ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full overflow-x-auto flex justify-center">
              <ClassificationCard startup={startup} ranking={standing} size="lg" />
            </div>

            {/* Delta */}
            <div className="flex items-center gap-3">
              {scoreDelta !== null ? (
                scoreDelta >= 0 ? (
                  <p className="font-body text-sm text-green-600 font-semibold">
                    ↑ {scoreDelta.toFixed(1)} puntos vs evaluación anterior
                  </p>
                ) : (
                  <p className="font-body text-sm text-red-500 font-semibold">
                    ↓ {Math.abs(scoreDelta).toFixed(1)} puntos · revisa el feedback
                  </p>
                )
              ) : (
                <p className="font-body text-sm text-ink-secondary">Primera evaluación. Bienvenido a la liga.</p>
              )}
              <DashboardShareButton startup={startup} ranking={standing} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border-soft p-10 text-center">
            <p className="font-sora font-bold text-brand-navy text-xl mb-2">Aún no tienes evaluaciones</p>
            <p className="font-body text-ink-secondary text-sm mb-6">Sube tu deck para entrar en la liga.</p>
            <Link
              href="/play"
              className="inline-block bg-brand-navy text-white font-semibold rounded-xl px-6 py-3 font-body text-sm hover:bg-brand-navy/90 transition-colors"
            >
              Ficha tu startup
            </Link>
          </div>
        )}
      </section>

      {/* ── Últimas novedades ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sora font-bold text-lg text-brand-navy">Últimas novedades</h2>
          <Link href="/dashboard/visibilidad" className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors">
            Ver todas →
          </Link>
        </div>

        {alerts && alerts.length > 0 ? (
          <div className="bg-white rounded-card border border-border-soft divide-y divide-border-soft">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-5 py-3">
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {alertIcon(alert.alert_type as Parameters<typeof alertIcon>[0])}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm ${alert.is_read ? "text-ink-secondary" : "text-brand-navy font-semibold"}`}>
                    {renderAlertText(
                      alert.alert_type as Parameters<typeof renderAlertText>[0],
                      alert.payload as Parameters<typeof renderAlertText>[1]
                    )}
                  </p>
                  <p className="font-mono text-xs text-ink-secondary/60 mt-0.5">
                    {new Date(alert.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                {!alert.is_read && (
                  <span className="w-2 h-2 rounded-full bg-brand-salmon flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border-soft p-6 text-center">
            <p className="font-mono text-ink-secondary text-sm">{"{ todo tranquilo }"} — seguimos monitorizando tu posición.</p>
          </div>
        )}
      </section>

      {/* ── Re-subir deck ── */}
      <section className="mb-8">
        <div className="bg-white rounded-card border border-border-soft p-6">
          <h2 className="font-sora font-bold text-lg text-brand-navy mb-2">Re-subir deck</h2>
          {canResubmit ? (
            <div className="flex items-center justify-between gap-4">
              <p className="font-body text-sm text-ink-secondary">Tu próximo deck está listo para evaluarse.</p>
              <Link
                href="/play/re-subir"
                className="flex-shrink-0 bg-brand-salmon text-brand-navy font-semibold rounded-xl px-5 py-2.5 font-body text-sm hover:opacity-90 transition-opacity"
              >
                Re-evaluarme
              </Link>
            </div>
          ) : (
            <div>
              <p className="font-body text-sm text-ink-secondary">
                Podrás re-subir tu deck en{" "}
                <span className="font-semibold text-brand-navy">
                  {unlockDate ? formatDistanceToNow(unlockDate) : "unos días"}.
                </span>
              </p>
              <div className="mt-3 h-1.5 bg-brand-lavender rounded-full overflow-hidden">
                {unlockDate && lastDeck && (
                  <div
                    className="h-full bg-brand-salmon rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((Date.now() - new Date(lastDeck.uploaded_at).getTime()) / (7 * 24 * 60 * 60 * 1000)) * 100).toFixed(0)}%`,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Tu próximo salto ── */}
      {weakDimensions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-bold text-lg text-brand-navy">Tu próximo salto</h2>
            <Link href="/dashboard/evaluaciones" className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors">
              Ver feedback completo →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {weakDimensions.map(({ key, label, score }) => (
              <div key={key} className="bg-white rounded-card border border-border-soft p-4">
                <p className="font-body text-xs text-ink-secondary mb-1">{label}</p>
                <p className="font-mono font-bold text-2xl text-brand-navy">{score.toFixed(0)}</p>
                <div className="mt-2 h-1 bg-brand-lavender rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-salmon rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
