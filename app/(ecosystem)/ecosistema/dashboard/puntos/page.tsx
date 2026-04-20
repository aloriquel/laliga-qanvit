import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EVENT_LABELS, tierFromPoints, pointsToNextTier, TIER_THRESHOLDS } from "@/lib/ecosystem/points-helpers";
import type { Database } from "@/lib/supabase/types";

type PointsEvent = Database["public"]["Enums"]["points_event_type"];

export default async function PuntosPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!org) redirect("/ecosistema/aplicar");

  const [totalsRes, standingsRes, logRes] = await Promise.all([
    supabase.from("ecosystem_totals").select("total_points, tier").eq("org_id", org.id).maybeSingle(),
    supabase.from("ecosystem_anonymous_standings").select("decile, percentile").eq("org_id", org.id).maybeSingle(),
    supabase.from("ecosystem_points_log")
      .select("id, event_type, points, created_at, reference_startup_id")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const totalPoints = totalsRes.data?.total_points ?? 0;
  const tier = totalsRes.data?.tier ?? "rookie";
  const decile = standingsRes.data?.decile ?? null;
  const percentile = standingsRes.data?.percentile ?? null;
  const log = logRes.data ?? [];
  const { next: nextTier, remaining } = pointsToNextTier(totalPoints);
  const progressPct = nextTier ? Math.min(100, Math.round((totalPoints / TIER_THRESHOLDS[nextTier]) * 100)) : 100;

  // Group by event type for breakdown
  const breakdown: Record<string, number> = {};
  for (const entry of log) {
    const key = entry.event_type as string;
    breakdown[key] = (breakdown[key] ?? 0) + entry.points;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Mis puntos</h1>
        <p className="font-body text-ink-secondary mt-1">Historial y progresión de tier.</p>
      </div>

      {/* Hero */}
      <div className="bg-brand-navy rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-body text-white/60 text-sm uppercase tracking-wide">Total acumulado</p>
            <p className="font-sora text-5xl font-bold mt-1">{totalPoints.toLocaleString("es-ES")}</p>
            <span className="inline-block mt-2 bg-brand-salmon/20 text-brand-salmon text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
              {tier}
            </span>
          </div>
          {decile !== null && (
            <div className="text-right shrink-0">
              <p className="font-body text-white/60 text-xs uppercase tracking-wide">Ranking</p>
              <p className="font-sora text-4xl font-bold text-brand-salmon">
                Top {Math.round((1 - (percentile ?? 0)) * 100)}%
              </p>
              <p className="font-body text-white/40 text-xs">Decil {decile} entre {tier}s</p>
            </div>
          )}
        </div>

        {nextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-xs font-body text-white/50 mb-1">
              <span>Progreso hacia {nextTier}</span>
              <span>{remaining.toLocaleString("es-ES")} pts restantes</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-salmon rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tier roadmap */}
      <div className="grid grid-cols-3 gap-4">
        {(["rookie", "pro", "elite"] as const).map((t) => (
          <div
            key={t}
            className={`rounded-2xl border p-4 text-center ${tier === t ? "border-brand-salmon bg-brand-salmon/10" : "border-border-soft bg-white"}`}
          >
            <p className={`font-sora font-bold text-lg uppercase ${tier === t ? "text-brand-navy" : "text-ink-secondary"}`}>{t}</p>
            <p className="font-body text-xs text-ink-secondary mt-1">{TIER_THRESHOLDS[t].toLocaleString("es-ES")} pts</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <h2 className="font-sora font-semibold text-brand-navy mb-4">Desglose por tipo</h2>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([event, pts]) => (
              <div key={event} className="flex justify-between items-center py-2 border-b border-border-soft last:border-0">
                <span className="font-body text-sm text-ink-secondary">
                  {EVENT_LABELS[event as PointsEvent] ?? event.replace(/_/g, " ")}
                </span>
                <span className="font-sora font-bold text-brand-salmon text-sm">+{pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log */}
      <div className="bg-white rounded-2xl border border-border-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border-soft">
          <h2 className="font-sora font-semibold text-brand-navy">Historial</h2>
        </div>
        {log.length === 0 ? (
          <p className="px-5 py-8 text-center text-ink-secondary font-body text-sm">Aún no hay puntos registrados.</p>
        ) : (
          <ul className="divide-y divide-border-soft">
            {log.map((entry) => (
              <li key={entry.id} className="px-5 py-3 flex justify-between items-center">
                <div>
                  <p className="font-body text-sm text-brand-navy">
                    {EVENT_LABELS[entry.event_type as PointsEvent] ?? entry.event_type.replace(/_/g, " ")}
                  </p>
                  <p className="font-body text-xs text-ink-secondary">
                    {new Date(entry.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="font-sora font-bold text-brand-salmon">+{entry.points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
