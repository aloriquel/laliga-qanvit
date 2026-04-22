import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string; action_type?: string };
}) {
  const supabase = createServiceClient();
  const page = Number(searchParams.page ?? 1);
  const perPage = 50;

  let query = supabase
    .from("admin_audit_log")
    .select("id, admin_id, action_type, target_type, target_id, reason, payload, created_at, admin:profiles!admin_id(email, full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (searchParams.action_type) query = query.eq("action_type", searchParams.action_type as never);

  const { data: logs, count, error: logsError } = await query;
  if (logsError) console.error("[admin/audit-log] query error:", logsError.message);
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Auditoría</h1>
        <a href="/api/admin/audit-log/export" className="font-body text-sm text-brand-salmon hover:underline">
          Exportar CSV
        </a>
      </div>

      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border-soft bg-brand-lavender/50">
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Acción</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Objetivo</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Razón</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden xl:table-cell">Admin</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {(logs ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-secondary">Sin actividad.</td></tr>
            ) : (logs ?? []).map((log) => (
              <tr key={log.id} className="hover:bg-brand-lavender/20">
                <td className="px-4 py-2.5 font-medium text-brand-navy">
                  {log.action_type.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-2.5 text-ink-secondary hidden md:table-cell">
                  {log.target_type} {log.target_id ? `· ${log.target_id.slice(0, 8)}…` : ""}
                </td>
                <td className="px-4 py-2.5 text-ink-secondary hidden lg:table-cell max-w-xs truncate">
                  {log.reason ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-ink-secondary hidden xl:table-cell text-xs">
                  {(() => { const a = log.admin as { email?: string; full_name?: string | null } | null; return a?.full_name ?? a?.email ?? log.admin_id?.slice(0, 8) ?? "—"; })()}
                </td>
                <td className="px-4 py-2.5 text-ink-secondary whitespace-nowrap text-xs">
                  {new Date(log.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}`}
              className={`px-3 py-1.5 rounded-lg font-body text-sm border ${p === page ? "bg-brand-navy text-white border-brand-navy" : "border-border-soft hover:bg-brand-lavender/30"}`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
