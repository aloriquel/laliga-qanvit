import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type EcosystemOrgType = Database["public"]["Enums"]["ecosystem_org_type"];

export type EcosystemOrgContext = {
  orgId: string;
  orgName: string;
  orgType: EcosystemOrgType;
};

export async function getEcosystemOrgForCurrentUser(): Promise<EcosystemOrgContext | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ecosystem_organizations")
    .select("id, name, org_type")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    orgId: data.id,
    orgName: data.name,
    orgType: data.org_type,
  };
}
