import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Target, TrendingUp, History } from "lucide-react";
import { computeScoutingEye } from "@/lib/ecosystem/votes-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VotosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!org) redirect("/ecosistema/aplicar");

  const service = createServiceClient();

  const [scoutingEye, votesRes] = await Promise.all([
    computeScoutingEye(org.id),
    service
      .from("startup_votes" as never)
      .select("id, startup_id, vote_type, weight, tier_at_vote, reason, created_at, startups(name, slug, current_score, current_division)")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(25) as unknown as Promise<{ data: Record<string, unknown>[] | null }>,
  ]);

  const votes = votesRes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Mis votos</h1>
        <p className="font-body text-ink-secondary mt-1">
          Historial de votos + tu métrica de scouting.
        </p>
      </div>

      {/* Scouting Eye Hero */}
      <div className="bg-brand-navy rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-brand-salmon/20 p-3 rounded-xl">
            <Target size={24} className="text-brand-salmon" />
          </div>
          <div className="flex-1">
            <p className="font-body text-white/60 text-sm uppercase tracking-wide">Scouting Eye</p>
            <div className="flex items-end gap-3 mt-1">
              <p className="font-sora text-5xl font-bold">{scoutingEye.accuracy_rate}%</p>
              <p className="font-body text-white/50 text-sm mb-2">tasa de acierto</p>
            </div>
            <p className="font-body text-white/60 text-sm mt-1">
              {scoutingEye.hits} de {scoutingEye.total_votes} startups votadas up han subido ≥20 puntos.
              {scoutingEye.percentile_vs_orgs != null && (
                <span> Percentil ~{scoutingEye.percentile_vs_orgs} del ecosistema.</span>
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-white/10 pt-4">
          <div>
            <p className="font-sora text-2xl font-bold">{scoutingEye.total_votes}</p>
            <p className="font-body text-white/50 text-xs">Votos up emitidos</p>
          </div>
          <div>
            <p className="font-sora text-2xl font-bold">{scoutingEye.hits}</p>
            <p className="font-body text-white/50 text-xs">Predicciones correctas</p>
          </div>
          <div>
            <p className="font-sora text-2xl font-bold">{scoutingEye.accuracy_rate}%</p>
            <p className="font-body text-white/50 text-xs">Tasa de acierto</p>
          </div>
        </div>
      </div>

      {/* Historial de votos */}
      <section>
        <h2 className="font-sora text-lg font-semibold text-brand-navy mb-3 flex items-center gap-2">
          <History size={18} className="text-brand-salmon" />
          Historial de votos
        </h2>

        {votes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border-soft p-8 text-center">
            <p className="font-body text-ink-secondary">Aún no has votado ninguna startup.</p>
            <Link href="/ecosistema/dashboard/startups" className="mt-3 inline-block text-brand-salmon font-semibold text-sm font-body hover:underline">
              Explorar startups →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border-soft overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border-soft bg-brand-lavender/40">
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Startup</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Voto</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Score actual</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Razón</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {votes.map((v) => {
                  const startup = v.startups as Record<string, unknown> | null;
                  return (
                    <tr key={String(v.id)} className="hover:bg-brand-lavender/10">
                      <td className="px-4 py-3">
                        {startup?.slug ? (
                          <Link href={`/startup/${startup.slug}`} className="font-medium text-brand-navy hover:underline">
                            {String(startup.name ?? "—")}
                          </Link>
                        ) : (
                          <span className="font-medium text-brand-navy">{String(startup?.name ?? "—")}</span>
                        )}
                        <p className="text-xs text-ink-secondary capitalize">{String(startup?.current_division ?? "")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          v.vote_type === "up" ? "bg-brand-salmon/20 text-brand-navy" : "bg-gray-100 text-gray-600"
                        }`}>
                          {v.vote_type === "up" ? "👍 Up" : "👎 Down"}
                          {Number(v.weight) > 1 && <span className="opacity-60 text-[10px]">×{String(v.weight)}</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-ink-secondary">
                        {startup?.current_score != null ? Number(startup.current_score).toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-ink-secondary max-w-[200px] truncate">
                        {String(v.reason ?? "—")}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">
                        {new Date(String(v.created_at)).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Portafolio ganador */}
      {scoutingEye.hits > 0 && (
        <section>
          <h2 className="font-sora text-lg font-semibold text-brand-navy mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-salmon" />
            Portafolio ganador
          </h2>
          <p className="font-body text-sm text-ink-secondary mb-4">
            Startups que votaste up y han subido ≥20 puntos desde tu voto.
          </p>
          <div className="bg-brand-lavender rounded-2xl p-4">
            <p className="font-body text-sm text-brand-navy">
              {scoutingEye.hits} startup{scoutingEye.hits !== 1 ? "s" : ""} acertada{scoutingEye.hits !== 1 ? "s" : ""} en los últimos 90 días.
            </p>
            <Link href="/ecosistema/dashboard/startups" className="mt-2 inline-block text-brand-salmon font-semibold text-sm font-body hover:underline">
              Ver startups →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
