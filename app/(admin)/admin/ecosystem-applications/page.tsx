import { createServiceClient } from "@/lib/supabase/server";
import EcoApplicationActions from "@/components/admin/EcoApplicationActions";

export const dynamic = "force-dynamic";

export default async function EcosystemApplicationsPage() {
  const supabase = createServiceClient();

  const { data: orgs, error: orgsError } = await supabase
    .from("ecosystem_organizations")
    .select("id, name, org_type, website, about, region, referral_code, created_at, owner:profiles!owner_id(email, full_name)")
    .eq("is_verified", false)
    .order("created_at", { ascending: true });

  if (orgsError) console.error("[ecosystem-applications] query error:", orgsError.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Solicitudes de ecosistema</h1>
        <span className="font-body text-sm text-ink-secondary">{orgs?.length ?? 0} pendientes</span>
      </div>

      {!orgs || orgs.length === 0 ? (
        <p className="font-body text-sm text-ink-secondary bg-white rounded-xl border border-border-soft px-4 py-6 text-center">
          Nada pendiente. Buen trabajo.
        </p>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => {
            const owner = org.owner as { email?: string; full_name?: string } | null;
            return (
              <div key={org.id} className="bg-white border border-border-soft rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-sora font-bold text-brand-navy text-lg">{org.name}</p>
                    <p className="font-body text-sm text-ink-secondary">
                      {org.org_type.replace(/_/g, " ")} · {org.region ?? "sin región"}
                    </p>
                    {org.website && (
                      <a href={org.website} target="_blank" rel="noopener noreferrer"
                        className="font-body text-sm text-brand-salmon hover:underline block truncate">
                        {org.website}
                      </a>
                    )}
                    {org.about && (
                      <p className="font-body text-sm text-ink-secondary mt-2 line-clamp-3">{org.about}</p>
                    )}
                    <p className="font-body text-xs text-ink-secondary mt-2">
                      Owner: {owner?.full_name ?? "—"} · {owner?.email ?? "—"}
                    </p>
                    <p className="font-body text-xs text-ink-secondary">
                      Solicitud: {new Date(org.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <EcoApplicationActions orgId={org.id} orgName={org.name} ownerEmail={owner?.email ?? ""} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
