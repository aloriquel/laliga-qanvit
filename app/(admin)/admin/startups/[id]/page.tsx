import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import ConsentManager from "@/components/admin/ConsentManager";
import StartupAdminActions from "@/components/admin/StartupAdminActions";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function StartupDetailAdminPage({ params }: Props) {
  const service = createServiceClient();

  const { data: startup } = await service
    .from("startups")
    .select(`
      id, name, slug, website, one_liner,
      current_division, current_vertical, current_score,
      is_public, consent_public_profile, consent_internal_use,
      created_at, location_region
    `)
    .eq("id", params.id)
    .single();

  if (!startup) notFound();

  const { data: standing } = await service
    .from("league_standings")
    .select("rank_national, rank_division, rank_division_vertical")
    .eq("startup_id", params.id)
    .maybeSingle();

  const { data: decks } = await service
    .from("decks")
    .select("id, version, status, uploaded_at, file_size_bytes")
    .eq("startup_id", params.id)
    .order("version", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/startups" className="font-body text-sm text-ink-secondary hover:text-brand-navy">
          ← Startups
        </Link>
        <span className="text-ink-secondary">/</span>
        <span className="font-body text-sm text-brand-navy font-semibold">{startup.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-navy">{startup.name}</h1>
          <p className="font-mono text-xs text-ink-secondary mt-1">{startup.slug}</p>
          {startup.one_liner && (
            <p className="font-body text-sm text-ink-secondary mt-2 max-w-xl">{startup.one_liner}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {startup.current_division && (
              <span className="font-mono text-xs bg-brand-lavender text-brand-navy px-2 py-0.5 rounded-full capitalize">
                {startup.current_division}
              </span>
            )}
            {startup.current_vertical && (
              <span className="font-mono text-xs bg-brand-lavender text-brand-navy px-2 py-0.5 rounded-full">
                {startup.current_vertical.replace(/_/g, " ")}
              </span>
            )}
            {startup.current_score != null && (
              <span className="font-sora font-bold text-sm text-brand-salmon">
                Score {Math.round(Number(startup.current_score))}
              </span>
            )}
          </div>
        </div>
        <StartupAdminActions
          startupId={startup.id}
          startupName={startup.name}
          isPublic={startup.is_public}
        />
      </div>

      {/* Ranking */}
      {standing && (
        <div className="bg-white border border-border-soft rounded-2xl p-6">
          <h2 className="font-sora font-semibold text-brand-navy mb-4">Posición en liga</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Nacional", value: `#${standing.rank_national}` },
              { label: "División", value: `#${standing.rank_division}` },
              { label: "Div · Vertical", value: `#${standing.rank_division_vertical}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-brand-lavender/40 rounded-xl py-3">
                <p className="font-sora font-bold text-2xl text-brand-navy">{value}</p>
                <p className="font-body text-xs text-ink-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consents */}
      <ConsentManager
        startupId={startup.id}
        initial={{
          consent_public_profile: startup.consent_public_profile,
          consent_internal_use: startup.consent_internal_use,
          is_public: startup.is_public,
        }}
      />

      {/* Decks */}
      {decks && decks.length > 0 && (
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-soft bg-brand-lavender/30">
            <h2 className="font-sora font-semibold text-brand-navy">Decks recientes</h2>
          </div>
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/10">
                <th className="text-left px-4 py-2 text-xs font-semibold text-ink-secondary">Versión</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-ink-secondary">Estado</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-ink-secondary">Fecha</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-ink-secondary">Tamaño</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {decks.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2.5 font-mono text-xs">v{d.version}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      d.status === "evaluated" ? "bg-green-100 text-green-700" :
                      d.status === "error" ? "bg-red-100 text-red-600" :
                      d.status === "processing" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary text-xs">
                    {new Date(d.uploaded_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-2.5 text-ink-secondary text-xs">
                    {d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(0)} KB` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
