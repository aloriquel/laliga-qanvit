import { createServiceClient } from "@/lib/supabase/server";
import { getFundingStageLabel } from "@/lib/funding-stage";
import DiscrepancyActions from "@/components/admin/DiscrepancyActions";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["pending", "confirmed_as_declared", "overridden_by_admin", "dismissed"] as const;
const SEVERITY_COLORS: Record<string, string> = {
  high:   "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-blue-100 text-blue-700",
};

export default async function DiscrepanciasAdminPage({
  searchParams,
}: {
  searchParams: { status?: string; severity?: string; page?: string };
}) {
  const supabase = createServiceClient();

  const filterStatus = searchParams.status ?? "pending";
  const page = Number(searchParams.page ?? 1);
  const perPage = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("admin_evaluator_discrepancies")
    .select(
      "id, startup_id, declared_funding_stage, suspected_funding_stage, severity, evaluator_reasoning, status, created_at, startup:startups(name, slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (filterStatus !== "all") query = query.eq("status", filterStatus);
  if (searchParams.severity) query = query.eq("severity", searchParams.severity);

  const { data: rows, count, error } = await query;

  // Count pending for badge display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingCount } = await (supabase as any)
    .from("admin_evaluator_discrepancies")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Discrepancias de fase</h1>
        {(pendingCount ?? 0) > 0 && (
          <span className="bg-red-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      <p className="font-body text-sm text-ink-secondary">
        El evaluador detectó una posible discrepancia entre la fase declarada por la startup y lo que muestra el deck.
        Revisa y decide si la declaración es correcta, si hay que sobreescribir la fase, o si descartar la alerta.
      </p>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={filterStatus}
          className="border border-border-soft rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="severity"
          defaultValue={searchParams.severity ?? ""}
          className="border border-border-soft rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none"
        >
          <option value="">Todas las severidades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <button
          type="submit"
          className="bg-brand-navy text-white font-body text-sm px-4 py-1.5 rounded-lg hover:bg-brand-navy/90"
        >
          Filtrar
        </button>
      </form>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 font-body text-sm text-red-700">
          Error al cargar discrepancias. Verifica que la migration 0037 esté aplicada.
        </div>
      ) : (
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/50">
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Startup</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Declarada</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Sospechada</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Severidad</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {(rows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-body text-ink-secondary text-sm">
                    {filterStatus === "pending"
                      ? "{ ninguna discrepancia pendiente }"
                      : "Sin resultados para los filtros actuales."}
                  </td>
                </tr>
              ) : (
                (rows ?? []).map((row: Record<string, unknown>) => {
                  const startup = row.startup as { name?: string; slug?: string } | null;
                  return (
                    <tr key={row.id as string} className="hover:bg-brand-lavender/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-navy">{startup?.name ?? "—"}</p>
                        <p className="text-xs text-ink-secondary font-mono">{(row.id as string).slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {getFundingStageLabel(row.declared_funding_stage as string) ?? row.declared_funding_stage as string}
                      </td>
                      <td className="px-4 py-3 text-red-600 font-medium">
                        {getFundingStageLabel(row.suspected_funding_stage as string) ?? row.suspected_funding_stage as string}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[row.severity as string] ?? ""}`}>
                          {row.severity as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">
                        {new Date(row.created_at as string).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-ink-secondary">{row.status as string}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(row.status as string) === "pending" && (
                          <DiscrepancyActions
                            discrepancyId={row.id as string}
                            startupId={row.startup_id as string}
                            startupName={startup?.name ?? "—"}
                            declaredStage={getFundingStageLabel(row.declared_funding_stage as string) ?? row.declared_funding_stage as string}
                            suspectedStage={getFundingStageLabel(row.suspected_funding_stage as string) ?? row.suspected_funding_stage as string}
                            severity={row.severity as string}
                            reasoning={row.evaluator_reasoning as string}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}&status=${filterStatus}${searchParams.severity ? `&severity=${searchParams.severity}` : ""}`}
              className={`px-3 py-1.5 rounded-lg font-body text-sm border ${
                p === page ? "bg-brand-navy text-white border-brand-navy" : "border-border-soft hover:bg-brand-lavender/30"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
