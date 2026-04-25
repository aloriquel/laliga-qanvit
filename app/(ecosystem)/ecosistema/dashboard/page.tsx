import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bell, Link2, Star, Target, ExternalLink, ThumbsUp } from "lucide-react";
import { pointsToNextTier, TIER_THRESHOLDS } from "@/lib/ecosystem/points-helpers";
import { computeScoutingEye } from "@/lib/ecosystem/votes-helpers";
import EcosystemBridgeBannerClient from "@/components/ecosystem/EcosystemBridgeBannerClient";
import EcosystemDashboardViewTracker from "@/components/ecosystem/EcosystemDashboardViewTracker";
import type { EcosystemOrgType } from "@/lib/ecosystem/owner";
import type { EcosystemTier } from "@/lib/ecosystem/qanvit-rewards";

const APP_QANVIT_URL = process.env.NEXT_PUBLIC_APP_QANVIT_URL ?? "https://app.qanvit.com";

export default async function EcosystemDashboardHome() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id, name, referral_code, org_type")
    .eq("owner_id", user.id)
    .single();

  if (!org) redirect("/ecosistema/aplicar");

  const [totalsRes, standingsRes, recentAlertsRes, pointsLogRes, scoutingEye] = await Promise.all([
    supabase.from("ecosystem_totals").select("total_points, tier").eq("org_id", org.id).maybeSingle(),
    supabase.from("ecosystem_anonymous_standings").select("decile, percentile, total_points").eq("org_id", org.id).maybeSingle(),
    supabase.from("ecosystem_new_startup_alerts").select("id, startup_id, matched_reason, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("ecosystem_points_log").select("id, event_type, points, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(5),
    computeScoutingEye(org.id),
  ]);

  const totalPoints = totalsRes.data?.total_points ?? 0;
  const tier = totalsRes.data?.tier ?? "rookie";
  const { next: nextTier, remaining } = pointsToNextTier(totalPoints);
  const decile = standingsRes.data?.decile ?? null;
  const percentile = standingsRes.data?.percentile ?? null;
  const recentAlerts = recentAlertsRes.data ?? [];
  const recentPoints = pointsLogRes.data ?? [];

  const progressPct = nextTier
    ? Math.min(100, Math.round((totalPoints / TIER_THRESHOLDS[nextTier]) * 100))
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Dashboard</h1>
        <p className="font-body text-ink-secondary mt-1">Observa el ecosistema de startups españolas.</p>
      </div>

      {/* Puntos hero — Tile 1 */}
      <div className="bg-brand-navy rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="font-body text-white/60 text-sm uppercase tracking-wide">Puntos totales</p>
            <p className="font-sora text-5xl font-bold mt-1">{totalPoints.toLocaleString("es-ES")}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
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
            <div className="text-left md:text-right">
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
              <div className="h-full bg-brand-salmon rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <Link href="/ecosistema/dashboard/puntos" className="inline-flex items-center gap-1 mt-4 text-brand-salmon text-sm font-semibold font-body hover:underline">
          Ver historial <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tile 2: Mi posición vs ecosistema */}
        {decile !== null && (
          <div className="bg-white rounded-2xl border border-border-soft p-5">
            <h2 className="font-sora font-semibold text-brand-navy mb-3">Mi posición vs ecosistema</h2>
            <p className="font-body text-sm text-ink-secondary">
              Estás en el top <strong>{Math.round((1 - (percentile ?? 0)) * 100)}%</strong> de organizaciones.
            </p>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-8 flex-1 rounded-sm ${i + 1 === (10 - (decile ?? 0) + 1) ? "bg-brand-salmon" : "bg-brand-lavender"}`}
                />
              ))}
            </div>
            <Link href="/ecosistema/dashboard/puntos" className="mt-3 inline-block text-brand-salmon font-semibold text-sm font-body hover:underline">
              Ver detalle →
            </Link>
          </div>
        )}

        {/* Tile 3: Scouting Eye */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Target size={16} className="text-brand-salmon" />
              Scouting Eye
            </h2>
            <Link href="/ecosistema/dashboard/votos" className="text-xs font-body text-ink-secondary hover:text-brand-navy">
              Ver detalle →
            </Link>
          </div>
          {scoutingEye.total_votes === 0 ? (
            <div>
              <p className="font-body text-sm text-ink-secondary">Aún no has votado ninguna startup.</p>
              <Link href="/ecosistema/dashboard/startups" className="mt-2 inline-block text-brand-salmon font-semibold text-sm font-body hover:underline">
                Explorar startups →
              </Link>
            </div>
          ) : (
            <div>
              <p className="font-sora text-3xl font-bold text-brand-navy">{scoutingEye.accuracy_rate}%</p>
              <p className="font-body text-sm text-ink-secondary mt-1">
                {scoutingEye.hits} de {scoutingEye.total_votes} startups votadas up han subido.
              </p>
            </div>
          )}
          <Link href="/ecosistema/dashboard/votos" className="mt-3 inline-flex items-center gap-1 text-brand-salmon text-xs font-semibold font-body hover:underline">
            <ThumbsUp size={12} />
            Historial de votos →
          </Link>
        </div>

        {/* Tile 4: Novedades */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Bell size={16} className="text-brand-salmon" />
              Novedades en tus verticales
            </h2>
            <Link href="/ecosistema/dashboard/alertas" className="text-xs font-body text-ink-secondary hover:text-brand-navy">
              Ver todas →
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="text-ink-secondary font-body text-sm">No hay alertas recientes. Configura tus verticales.</p>
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

        {/* Tile 5: Referral */}
        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sora font-semibold text-brand-navy flex items-center gap-2">
              <Link2 size={16} className="text-brand-salmon" />
              Tu enlace de referral
            </h2>
          </div>
          <p className="font-body text-xs text-ink-secondary mb-2">Gana puntos cuando startups se unan con tu código.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-brand-lavender px-3 py-2 rounded-xl text-xs font-mono text-brand-navy truncate">
              {`${process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com"}/play?ref=${org.referral_code}`}
            </code>
            <Link href="/ecosistema/dashboard/referral" className="text-brand-salmon text-xs font-semibold font-body hover:underline whitespace-nowrap">
              Detalles →
            </Link>
          </div>
        </div>

        {/* Tile 6: CTA app.qanvit.com — Lanza retos reales */}
        <a
          href={`${APP_QANVIT_URL}?utm_source=laliga&utm_medium=cta&utm_campaign=tile`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-brand-salmon rounded-2xl p-5 hover:bg-brand-salmon/90 transition-colors col-span-1 md:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sora font-bold text-brand-navy">Lanza retos reales con startups del ecosistema</p>
              <p className="font-body text-brand-navy/70 text-sm mt-1">
                La Liga es tu ventana para observar. Para gestionar innovación abierta, pásate a app.qanvit.com.
              </p>
            </div>
            <ExternalLink size={20} className="text-brand-navy/50 shrink-0 ml-4" />
          </div>
        </a>

        {/* Ecosystem → Qanvit bridge: copy tier-aware con % descuento */}
        <EcosystemBridgeBannerClient
          orgType={org.org_type as EcosystemOrgType}
          orgName={org.name}
          variant="dashboard"
          tier={tier as EcosystemTier}
        />

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
