import { createServiceClient } from "@/lib/supabase/server";
import EcoOrgActions from "@/components/admin/EcoOrgActions";

export const dynamic = "force-dynamic";

export default async function EcosystemOrganizationsPage() {
  const supabase = createServiceClient();

  const { data: orgs, error: orgsError } = await supabase
    .from("ecosystem_organizations")
    .select("id, name, org_type, region, is_verified, referral_code, created_at, verified_at, owner:profiles!owner_id(email)")
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (orgsError) console.error("[ecosystem-organizations] query error:", orgsError.message);

  const { data: totals } = await supabase
    .from("ecosystem_totals")
    .select("org_id, total_points, tier");

  const totalsMap = Object.fromEntries((totals ?? []).map((t) => [t.org_id, t]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Organizaciones verificadas</h1>
        <span className="font-body text-sm text-ink-secondary">{orgs?.length ?? 0} orgs</span>
      </div>

      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border-soft bg-brand-lavender/50">
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Organización</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy">Puntos / Tier</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden lg:table-cell">Referral</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {(orgs ?? []).map((org) => {
              const t = totalsMap[org.id];
              const owner = org.owner as { email?: string } | null;
              return (
                <tr key={org.id} className="hover:bg-brand-lavender/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-navy">{org.name}</p>
                    <p className="text-xs text-ink-secondary">{owner?.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">{org.org_type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-navy">{t?.total_points ?? 0} pts</p>
                    <p className="text-xs text-ink-secondary capitalize">{t?.tier ?? "rookie"}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-secondary hidden lg:table-cell">{org.referral_code}</td>
                  <td className="px-4 py-3">
                    <EcoOrgActions orgId={org.id} orgName={org.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
