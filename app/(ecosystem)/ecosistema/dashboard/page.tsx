import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Trophy, Bell, Link2, Star } from "lucide-react";
import { pointsToNextTier, TIER_THRESHOLDS } from "@/lib/ecosystem/points-helpers";
import { isChallengeActive } from "@/lib/ecosystem/challenge-logic";
import type { Database } from "@/lib/supabase/types";

type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];

export default async function EcosystemDashboardHome() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id, name, referral_code, region")
    .eq("owner_id", user.id)
    .single();

  if (!org) redirect("/ecosistema/aplicar");

  const [totalsRes, standingsRes, recentAlertsRes, activeChallengesRes, pointsLogRes] = await Promise.all([
    supabase.from("ecosystem_totals").select("total_points, tier").eq("org_id", org.id).maybeSingle(),
    supabase.from("ecosystem_anonymous_standings").select("decile, percentile, total_points").eq("org_id", org.id).maybeSingle(),
    supabase.from("ecosystem_new_startup_alerts").select("id, startup_id, matched_reason, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("challenges").select("id, title, status, active_ends_at, prize_structure").in("status", ["voting", "active"]).order("created_at", { ascending: false }).limit(3),
    supabase.from("ecosystem_points_log").select("id, event_type, points, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const totalPoints = totalsRes.data?.total_points ?? 0;
  const tier = totalsRes.data?.tier ?? "rookie";
  const { next: nextTier, remaining } = pointsToNextTier(totalPoints);
  const decile = standingsRes.data?.decile ?? null;
  const percentile = standingsRes.data?.percentile ?? null;
  const recentAlerts = recentAlertsRes.data ?? [];
  const activeChallenges = (activeChallengesRes.data ?? []).filter((c) => isChallengeActive(c as ChallengeRow));
  const votingChallenges = (activeChallengesRes.data ?? []).filter((c) => c.status === "voting");
  const recentPoints = pointsLogRes.data ?? [];

  const progressPct = nextTier
    ? Math.min(100, Math.round((totalPoints / TIER_THRESHOLDS[nextTier]) * 100))
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Dashboard</h1>
        <p className="font-body text-ink-secondary mt-1">Bienvenido al panel de ecosistema de La Liga Qanvit.</p>
      </div>

      {/* Puntos hero */}
      <div className="bg-brand-navy rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-body text-white/60 text-sm uppercase tracking-wide">Puntos totales</p>
            <p className="font-sora text-5xl font-bold mt-1">{totalPoints.toLocaleString("es-ES")}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-brand-salmon/20 text-brand-salmon text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                {tier}
              </span>
              {nextTier && (
                <span className="text-white/50 text-xs font-body">
                  {remaining.toLocaleString("es-ES")} pts para {nextTier}
                </span>
              )}
            </div>
          </div>
          {decile !== null && (
            <div className="text-right">
              <p className="font-body text-white/60 text-xs uppercase tracking-wide">Percentil</p>
              <p className="font-sora text-3xl font-bold text-brand-salmon">
                {Math.round((1 - (percentile ?? 0)) * 100)}
              </p>
              <p className="font-body text-white/40 text-xs">top {decile * 10}%</p>
            </div>
          )}
        </div>

        {nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-body text-white/50 mb-1">
              <span>{totalPoints.toLocaleString("es-ES")} pts</span>
              <span>{TIER_THRESHOLDS[nextTier].toLocaleString("es-ES")} pts</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-salmon rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <Link href="/ecosistema/dashboard/puntos" className="inline-flex items-center gap-1 mt-4 text-brand-salmon text-sm font-semibold font-body hover:underline">
          Ver historial <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retos activos */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Trophy size={16} className="text-brand-salmon" />
              Retos
            </h2>
            <Link href="/ecosistema/dashboard/retos" className="text-xs font-body text-ink-secondary hover:text-brand-navy">
              Ver todos →
            </Link>
          </div>
          {activeChallenges.length === 0 && votingChallenges.length === 0 ? (
            <p className="text-ink-secondary font-body text-sm">No hay retos activos ahora.</p>
          ) : (
            <ul className="space-y-3">
              {[...activeChallenges, ...votingChallenges].slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link href={`/ecosistema/dashboard/retos`} className="block group">
                    <p className="font-body text-sm font-medium text-brand-navy group-hover:underline">{c.title}</p>
                    <p className="font-body text-xs text-ink-secondary capitalize">{c.status}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Novedades (alertas recientes) */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Bell size={16} className="text-brand-salmon" />
              Novedades
            </h2>
            <Link href="/ecosistema/dashboard/alertas" className="text-xs font-body text-ink-secondary hover:text-brand-navy">
              Ver todas →
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="text-ink-secondary font-body text-sm">No hay alertas recientes.</p>
          ) : (
            <ul className="space-y-3">
              {recentAlerts.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-brand-salmon shrink-0" />
                  <div>
                    <p className="font-body text-sm text-brand-navy">Nueva startup</p>
                    <p className="font-body text-xs text-ink-secondary">{a.matched_reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Referral tile */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Link2 size={16} className="text-brand-salmon" />
              Tu enlace de referral
            </h2>
          </div>
          <p className="font-body text-xs text-ink-secondary mb-2">Comparte este enlace para ganar puntos cuando startups se unan.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-brand-lavender px-3 py-2 rounded-xl text-xs font-mono text-brand-navy truncate">
              {`${process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com"}/play?ref=${org.referral_code}`}
            </code>
            <Link href="/ecosistema/dashboard/referral" className="text-brand-salmon text-xs font-semibold font-body hover:underline whitespace-nowrap">
              Detalles →
            </Link>
          </div>
        </div>

        {/* Últimos puntos */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Star size={16} className="text-brand-salmon" />
              Últimos puntos
            </h2>
            <Link href="/ecosistema/dashboard/puntos" className="text-xs font-body text-ink-secondary hover:text-brand-navy">
              Ver todos →
            </Link>
          </div>
          {recentPoints.length === 0 ? (
            <p className="text-ink-secondary font-body text-sm">Aún no tienes puntos.</p>
          ) : (
            <ul className="space-y-2">
              {recentPoints.map((p) => (
                <li key={p.id} className="flex justify-between items-center">
                  <span className="font-body text-sm text-ink-secondary capitalize">
                    {p.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="font-sora font-bold text-brand-salmon text-sm">+{p.points}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
