import { createServiceClient } from "@/lib/supabase/server";
import { getPendingCounts } from "@/lib/admin/metrics";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = createServiceClient();
  const pending = await getPendingCounts();

  const [metricsRow, recentAudit] = await Promise.all([
    supabase.from("metrics_summary").select("*").maybeSingle(),
    supabase
      .from("admin_audit_log")
      .select("id, action_type, target_type, target_id, reason, created_at, admin:profiles(email)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const m = metricsRow.data;
  const feed = recentAudit.data ?? [];

  const pendingItems = [
    { label: "Solicitudes de ecosistema", count: pending.applications, href: "/admin/ecosystem-applications" },
    { label: "Deck errors", count: pending.deckErrors, href: "/admin/deck-errors" },
    { label: "Impugnaciones pendientes", count: pending.appeals, href: "/admin/evaluation-appeals" },
    { label: "Retos en draft", count: pending.challengeDrafts, href: "/admin/challenges" },
  ].filter((i) => i.count > 0);

  const errorRate7d = m
    ? ((m.decks_error_7d ?? 0) / Math.max((m.decks_evaluated_7d ?? 0) + (m.decks_error_7d ?? 0), 1)) * 100
    : 0;

  return (
    <div className="space-y-8">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">
        {"{ admin }"} · La Liga Qanvit
      </h1>

      {/* Cola de pendientes */}
      <section>
        <h2 className="font-sora text-lg font-semibold text-brand-navy mb-3">Cola de pendientes</h2>
        {pendingItems.length === 0 ? (
          <p className="font-body text-sm text-ink-secondary bg-white rounded-xl border border-border-soft px-4 py-3">
            Nada pendiente. Buen trabajo.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {pendingItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-border-soft rounded-xl p-4 hover:border-brand-salmon transition-colors"
              >
                <p className="font-sora text-2xl font-bold text-brand-navy">{item.count}</p>
                <p className="font-body text-xs text-ink-secondary mt-1">{item.label}</p>
                <p className="font-body text-xs text-brand-salmon mt-2 font-medium">Revisar →</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Salud de la liga */}
      <section>
        <h2 className="font-sora text-lg font-semibold text-brand-navy mb-3">Salud de la liga</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Startups con score", value: m?.startups_with_score ?? "—" },
            { label: "Orgs verificadas", value: m?.orgs_verified ?? "—" },
            { label: "Decks evaluados (7d)", value: m?.decks_evaluated_7d ?? "—" },
            {
              label: "% éxito pipeline (7d)",
              value: m ? `${m.pipeline_success_rate_7d ?? 0}%` : "—",
              warning: errorRate7d > 10,
            },
            {
              label: "Coste LLM (7d)",
              value: m ? `$${Number(m.cost_usd_7d ?? 0).toFixed(2)}` : "—",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white border rounded-xl p-4 ${stat.warning ? "border-amber-400" : "border-border-soft"}`}
            >
              <p className="font-sora text-xl font-bold text-brand-navy">{String(stat.value)}</p>
              <p className="font-body text-xs text-ink-secondary mt-1">{stat.label}</p>
              {stat.warning && (
                <p className="font-body text-xs text-amber-600 mt-1">⚠ Error rate alto</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Actividad reciente */}
      <section>
        <h2 className="font-sora text-lg font-semibold text-brand-navy mb-3">Actividad reciente</h2>
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          {feed.length === 0 ? (
            <p className="font-body text-sm text-ink-secondary px-4 py-3">Sin actividad aún.</p>
          ) : (
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border-soft bg-brand-lavender/50">
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Acción</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Objetivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Admin</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-navy">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {feed.map((row) => (
                  <tr key={row.id} className="hover:bg-brand-lavender/20">
                    <td className="px-4 py-2.5 text-brand-navy font-medium">{row.action_type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2.5 text-ink-secondary hidden md:table-cell">
                      {row.target_type} {row.target_id ? `· ${row.target_id.slice(0, 8)}…` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-ink-secondary hidden lg:table-cell">
                      {(row.admin as { email?: string } | null)?.email ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-secondary whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
