import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import StartupAdminActions from "@/components/admin/StartupAdminActions";

export const dynamic = "force-dynamic";

export default async function StartupsAdminPage({
  searchParams,
}: {
  searchParams: { q?: string; division?: string; vertical?: string; page?: string };
}) {
  const supabase = createServiceClient();
  const page = Number(searchParams.page ?? 1);
  const perPage = 25;

  let query = supabase
    .from("startups")
    .select("id, name, slug, location_region, current_division, current_vertical, current_score, is_public, consent_public_profile, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.division) query = query.eq("current_division", searchParams.division as never);
  if (searchParams.vertical) query = query.eq("current_vertical", searchParams.vertical as never);

  const { data: startups, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Startups</h1>
        <span className="font-body text-sm text-ink-secondary">{count ?? 0} total</span>
      </div>

      <form method="GET" className="flex flex-wrap gap-3">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Buscar por nombre…"
          className="border border-border-soft rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon w-48" />
        <button type="submit" className="bg-brand-navy text-white font-body text-sm px-4 py-1.5 rounded-lg hover:bg-brand-navy/90">
          Buscar
        </button>
      </form>

      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border-soft bg-brand-lavender/50">
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Startup</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">División · Vertical</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Score</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Visibilidad</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {(startups ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-brand-lavender/20">
                <td className="px-4 py-3">
                  <p className="font-semibold text-brand-navy">{s.name}</p>
                  <p className="text-xs text-ink-secondary">{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-secondary hidden md:table-cell capitalize">
                  {s.current_division ?? "—"} · {(s.current_vertical ?? "—").replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 font-sora font-bold text-brand-navy">
                  {s.current_score ? Number(s.current_score).toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {s.is_public ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Público</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Oculto</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/startups/${s.id}`} className="text-brand-navy font-body text-xs hover:underline font-semibold">
                      Ver detalle →
                    </Link>
                    <StartupAdminActions startupId={s.id} startupName={s.name} isPublic={s.is_public} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}${searchParams.q ? `&q=${searchParams.q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg font-body text-sm border ${p === page ? "bg-brand-navy text-white border-brand-navy" : "border-border-soft hover:bg-brand-lavender/30"}`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
