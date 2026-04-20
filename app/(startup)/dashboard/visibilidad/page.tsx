import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import AlertsTab from "./AlertsTab";

export const metadata: Metadata = { title: "Visibilidad — Dashboard" };
export const revalidate = 0;

type EcoViewRow = Database["public"]["Tables"]["startup_ecosystem_views"]["Row"];
type AlertRow = Database["public"]["Tables"]["startup_alerts"]["Row"];
type OrgRow = Database["public"]["Tables"]["ecosystem_organizations"]["Row"];

const ORG_TYPE_LABELS: Record<string, string> = {
  science_park: "Parque científico",
  cluster: "Cluster",
  innovation_association: "Asociación",
  other: "Otro",
};

export default async function VisibilidadPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  const { data: startup } = await supabase
    .from("startups")
    .select("id, notification_email_enabled")
    .eq("owner_id", user.id)
    .single();

  if (!startup) redirect("/play");

  // Views with org details
  const { data: viewRows } = await supabase
    .from("startup_ecosystem_views")
    .select("*")
    .eq("startup_id", startup.id)
    .order("last_viewed_at", { ascending: false }) as { data: EcoViewRow[] | null };

  let orgsMap = new Map<string, OrgRow>();
  if (viewRows && viewRows.length > 0) {
    const orgIds = Array.from(new Set(viewRows.map((v) => v.org_id)));
    const { data: orgs } = await supabase
      .from("ecosystem_organizations")
      .select("*")
      .in("id", orgIds) as { data: OrgRow[] | null };
    orgsMap = new Map(orgs?.map((o) => [o.id, o]) ?? []);
  }

  // Alerts
  const { data: alertRows } = await supabase
    .from("startup_alerts")
    .select("*")
    .eq("startup_id", startup.id)
    .order("created_at", { ascending: false })
    .limit(100) as { data: AlertRow[] | null };

  const views = (viewRows ?? []).map((v) => ({
    ...v,
    org: orgsMap.get(v.org_id) ?? null,
  }));

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="font-sora font-bold text-2xl text-brand-navy mb-8">Visibilidad</h1>

      {/* Tabs — simple CSS toggle using anchors */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-border-soft p-1 w-fit">
        <a
          href="#views"
          className="px-5 py-2 rounded-lg font-body text-sm font-medium text-ink-secondary hover:text-brand-navy transition-colors"
        >
          Quién te ha visto
          {views.length > 0 && (
            <span className="ml-2 bg-brand-lavender text-brand-navy text-xs rounded-full px-2 py-0.5">{views.length}</span>
          )}
        </a>
        <a
          href="#alertas"
          className="px-5 py-2 rounded-lg font-body text-sm font-medium text-ink-secondary hover:text-brand-navy transition-colors"
        >
          Alertas
          {(alertRows ?? []).filter((a) => !a.is_read).length > 0 && (
            <span className="ml-2 bg-brand-salmon text-brand-navy text-xs rounded-full px-2 py-0.5">
              {(alertRows ?? []).filter((a) => !a.is_read).length}
            </span>
          )}
        </a>
      </div>

      {/* Views section */}
      <section id="views" className="mb-10">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-4">Quién te ha visto</h2>
        {views.length === 0 ? (
          <div className="bg-white rounded-card border border-border-soft p-10 text-center">
            <p className="font-mono text-ink-secondary text-sm">{"{ sin views todavía }"}</p>
            <p className="font-body text-ink-secondary text-xs mt-2">El ecosistema aún no te ha visto. Comparte tu carta.</p>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border-soft overflow-hidden shadow-card">
            <div className="bg-brand-navy/5 px-5 py-2.5 grid grid-cols-[auto_1fr_auto_auto] gap-4 text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              <span className="w-8" />
              <span>Organización</span>
              <span className="hidden sm:block">Tipo</span>
              <span>Visitas</span>
            </div>
            {views.map((view) => {
              const org = view.org;
              return (
                <div
                  key={view.id}
                  className="px-5 py-3 grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center border-t border-border-soft"
                >
                  {/* Logo */}
                  <div className="w-8 h-8 rounded-full bg-brand-lavender flex items-center justify-center overflow-hidden">
                    {org?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-sora font-bold text-xs text-brand-navy">
                        {org?.name?.charAt(0) ?? "?"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-brand-navy truncate">
                      {org?.name ?? "Organización desconocida"}
                    </p>
                    <p className="font-mono text-xs text-ink-secondary">
                      Última visita: {new Date(view.last_viewed_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  <span className="hidden sm:block font-body text-xs text-ink-secondary">
                    {ORG_TYPE_LABELS[org?.org_type ?? ""] ?? org?.org_type ?? "—"}
                  </span>

                  <span className="font-mono text-sm font-bold text-brand-navy tabular-nums">
                    {view.views_count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Alerts section */}
      <section id="alertas">
        <AlertsTab
          startupId={startup.id}
          initialAlerts={alertRows ?? []}
          emailEnabled={startup.notification_email_enabled}
        />
      </section>
    </div>
  );
}
