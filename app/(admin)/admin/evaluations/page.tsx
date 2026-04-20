import { createServiceClient } from "@/lib/supabase/server";
import EvalAdminActions from "@/components/admin/EvalAdminActions";

export const dynamic = "force-dynamic";

const DIVISIONS = ["ideation", "seed", "growth", "elite"] as const;
const VERTICALS = [
  "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech", "agrifood",
  "healthtech_medtech", "industrial_manufacturing", "space_aerospace", "materials_chemistry", "cybersecurity",
] as const;

export default async function EvaluationsAdminPage({
  searchParams,
}: {
  searchParams: { division?: string; vertical?: string; calibration?: string; page?: string };
}) {
  const supabase = createServiceClient();
  const page = Number(searchParams.page ?? 1);
  const perPage = 20;

  let query = supabase
    .from("evaluations")
    .select("id, assigned_division, assigned_vertical, score_total, is_calibration_sample, created_at, evaluator_model, cost_estimate_usd, latency_ms, startup:startups(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (searchParams.division) query = query.eq("assigned_division", searchParams.division as never);
  if (searchParams.vertical) query = query.eq("assigned_vertical", searchParams.vertical as never);
  if (searchParams.calibration === "1") query = query.eq("is_calibration_sample", true);

  const { data: evals, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Evaluaciones</h1>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select name="division" defaultValue={searchParams.division ?? ""}
          className="border border-border-soft rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none">
          <option value="">Todas las divisiones</option>
          {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select name="vertical" defaultValue={searchParams.vertical ?? ""}
          className="border border-border-soft rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none">
          <option value="">Todas las verticales</option>
          {VERTICALS.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
        </select>
        <label className="flex items-center gap-2 font-body text-sm">
          <input type="checkbox" name="calibration" value="1" defaultChecked={searchParams.calibration === "1"} />
          Solo calibración
        </label>
        <button type="submit" className="bg-brand-navy text-white font-body text-sm px-4 py-1.5 rounded-lg hover:bg-brand-navy/90">
          Filtrar
        </button>
      </form>

      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border-soft bg-brand-lavender/50">
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Startup</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">División · Vertical</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Score</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Coste</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden xl:table-cell">Latencia</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {(evals ?? []).map((ev) => {
              const startup = ev.startup as { name?: string; slug?: string } | null;
              return (
                <tr key={ev.id} className="hover:bg-brand-lavender/20">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-brand-navy">{startup?.name ?? "—"}</p>
                    <p className="text-xs text-ink-secondary font-mono">{ev.id.slice(0, 8)}…</p>
                    {ev.is_calibration_sample && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">calibración</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary capitalize">
                    {ev.assigned_division} · {(ev.assigned_vertical ?? "").replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-2.5 font-sora font-bold text-brand-navy">
                    {Number(ev.score_total).toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary hidden lg:table-cell">
                    ${Number(ev.cost_estimate_usd ?? 0).toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary hidden xl:table-cell">
                    {ev.latency_ms ? `${(ev.latency_ms / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <EvalAdminActions evalId={ev.id} startupId={(ev.startup as { id?: string } | null)?.id ?? ""} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}${searchParams.division ? `&division=${searchParams.division}` : ""}${searchParams.vertical ? `&vertical=${searchParams.vertical}` : ""}`}
              className={`px-3 py-1.5 rounded-lg font-body text-sm border ${p === page ? "bg-brand-navy text-white border-brand-navy" : "border-border-soft hover:bg-brand-lavender/30"}`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
