import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EcosystemShell from "@/components/ecosystem/EcosystemShell";

export default async function EcosystemDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!org) redirect("/ecosistema/aplicar");

  const { data: totals } = await supabase
    .from("ecosystem_totals")
    .select("tier")
    .eq("org_id", org.id)
    .maybeSingle();

  const tier = (totals?.tier ?? "rookie") as "rookie" | "pro" | "elite";

  const { count: unreadAlerts } = await supabase
    .from("ecosystem_new_startup_alerts")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("email_sent", false);

  return (
    <EcosystemShell orgName={org.name} tier={tier} unreadAlerts={unreadAlerts ?? 0}>
      {children}
    </EcosystemShell>
  );
}
