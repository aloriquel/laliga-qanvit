import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StartupSearch from "@/components/ecosystem/StartupSearch";

export default async function EcosystemStartupsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) redirect("/ecosistema/aplicar");

  const { data: totals } = await supabase
    .from("ecosystem_totals")
    .select("tier, total_points")
    .eq("org_id", org.id)
    .maybeSingle();

  const tier = (totals?.tier ?? "rookie") as "rookie" | "pro" | "elite";

  return <StartupSearch orgId={org.id} tier={tier} />;
}
