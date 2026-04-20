import { createServiceClient } from "@/lib/supabase/server";
import DataExportForm from "@/components/admin/DataExportForm";

export const dynamic = "force-dynamic";

export default async function DataExportPage() {
  const supabase = createServiceClient();

  const { data: exports } = await supabase
    .from("dataset_exports")
    .select("id, scope, filters, record_count, file_size_bytes, status, created_at, completed_at, storage_path")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Export de datos</h1>

      <div className="bg-white border border-border-soft rounded-2xl p-6">
        <h2 className="font-sora font-semibold text-brand-navy mb-4">Generar nuevo export</h2>
        <DataExportForm />
      </div>

      <div>
        <h2 className="font-sora font-semibold text-brand-navy mb-3">Exports previos</h2>
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/50">
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Scope</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Registros</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Tamaño</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {(exports ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-secondary font-body text-sm">Sin exports aún.</td></tr>
              ) : (exports ?? []).map((ex) => (
                <tr key={ex.id} className="hover:bg-brand-lavender/20">
                  <td className="px-4 py-2.5 font-semibold text-brand-navy capitalize">{ex.scope}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                      ex.status === "completed" ? "bg-green-100 text-green-700" :
                      ex.status === "generating" ? "bg-blue-100 text-blue-700" :
                      ex.status === "error" ? "bg-red-100 text-red-600" :
                      "bg-brand-lavender text-ink-secondary"
                    }`}>{ex.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary hidden md:table-cell">{ex.record_count ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-secondary hidden lg:table-cell">
                    {ex.file_size_bytes ? `${(ex.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary whitespace-nowrap">
                    {new Date(ex.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-2.5">
                    {ex.status === "completed" && ex.storage_path && (
                      <a href={`/api/admin/data-export/${ex.id}/download`}
                        className="font-body text-xs text-brand-salmon hover:underline">
                        Descargar
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
