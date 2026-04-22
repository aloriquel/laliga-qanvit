import { createServiceClient } from "@/lib/supabase/server";
import VoteInvalidateButton from "./VoteInvalidateButton";

export const dynamic = "force-dynamic";

export default async function AdminVotesPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string };
}) {
  const supabase = createServiceClient();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const voteType = searchParams.type ?? "all";

  let query = (supabase as any)
    .from("startup_votes")
    .select(
      "id, vote_type, weight, tier_at_vote, reason, created_at, " +
      "startup:startups!startup_id(name, slug), " +
      "org:ecosystem_organizations!org_id(name)"
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (voteType !== "all") {
    query = query.eq("vote_type", voteType);
  }

  const { data: votes, count } = await query;
  const rows = (votes ?? []) as Record<string, unknown>[];

  const totalPages = Math.ceil((count ?? rows.length) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Votos del ecosistema</h1>
        <p className="font-body text-sm text-ink-secondary">
          Mostrando {rows.length} votos · página {page}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 font-body text-sm">
        {["all", "up", "down"].map((t) => (
          <a
            key={t}
            href={`/admin/votes${t !== "all" ? `?type=${t}` : ""}`}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              voteType === t
                ? "bg-brand-navy text-white border-brand-navy"
                : "bg-white text-ink-secondary border-border-soft hover:border-brand-navy"
            }`}
          >
            {t === "all" ? "Todos" : t === "up" ? "👍 Up" : "👎 Down"}
          </a>
        ))}
      </div>

      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="font-body text-sm text-ink-secondary px-6 py-8 text-center">
            No hay votos registrados aún.
          </p>
        ) : (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/40">
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Startup</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Org</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Voto</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Tier</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Razón</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {rows.map((v) => {
                const startup = v.startup as Record<string, unknown> | null;
                const org = v.org as Record<string, unknown> | null;
                return (
                  <tr key={String(v.id)} className="hover:bg-brand-lavender/10">
                    <td className="px-4 py-2.5 font-medium text-brand-navy">
                      {String(startup?.name ?? "—")}
                      {startup?.slug ? (
                        <span className="text-xs text-ink-secondary ml-1 font-normal">/{String(startup.slug)}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-ink-secondary">
                      {String(org?.name ?? "—")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        v.vote_type === "up"
                          ? "bg-brand-salmon/20 text-brand-navy"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {v.vote_type === "up" ? "👍 Up" : "👎 Down"}
                        {Number(v.weight) > 1 && (
                          <span className="opacity-60 text-[10px]">×{String(v.weight)}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-secondary hidden md:table-cell capitalize">
                      {String(v.tier_at_vote ?? "—")}
                    </td>
                    <td className="px-4 py-2.5 text-ink-secondary hidden lg:table-cell max-w-[200px] truncate">
                      {String(v.reason ?? "—")}
                    </td>
                    <td className="px-4 py-2.5 text-ink-secondary whitespace-nowrap">
                      {new Date(String(v.created_at)).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <VoteInvalidateButton voteId={String(v.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center font-body text-sm">
          {page > 1 && (
            <a href={`/admin/votes?type=${voteType}&page=${page - 1}`}
              className="px-3 py-1.5 rounded-lg border border-border-soft bg-white hover:border-brand-navy">
              ← Anterior
            </a>
          )}
          <span className="px-3 py-1.5 text-ink-secondary">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/admin/votes?type=${voteType}&page=${page + 1}`}
              className="px-3 py-1.5 rounded-lg border border-border-soft bg-white hover:border-brand-navy">
              Siguiente →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
