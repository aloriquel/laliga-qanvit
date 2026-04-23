import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ConsentGateModal } from "@/components/auth/ConsentGateModal";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import DeckConsentWizard from "@/components/startup/DeckConsentWizard";
import WinnerCelebrationGate from "@/components/batches/WinnerCelebrationGate";
import type { Database } from "@/lib/supabase/types";

type StartupRow = Database["public"]["Tables"]["startups"]["Row"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  const profile = await ensureProfile(user);

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("owner_id", user.id)
    .single() as { data: StartupRow | null };

  if (!startup) redirect("/play");

  const { count: unreadCount } = await supabase
    .from("startup_alerts")
    .select("id", { count: "exact", head: true })
    .eq("startup_id", startup.id)
    .eq("is_read", false);

  const needsConsent = !profile?.consented_at;

  // Conditions for DeckConsentWizard
  const { count: approvedEvalCount } = await supabase
    .from("evaluations")
    .select("id", { count: "exact", head: true })
    .eq("startup_id", startup.id)
    .not("score_total", "is", null);

  const hasApprovedEval = (approvedEvalCount ?? 0) > 0;

  return (
    <DashboardShell unreadAlerts={unreadCount ?? 0} startupName={startup.name}>
      <ConsentGateModal show={needsConsent} />
      <WinnerCelebrationGate />
      <DeckConsentWizard
        userId={user.id}
        startupId={startup.id}
        hasApprovedEval={hasApprovedEval}
        seenWizard={(profile as any)?.seen_deck_consent_wizard ?? false}
        consentPublicProfile={(startup as any).consent_public_profile ?? false}
        consentPublicDeck={(startup as any).consent_public_deck ?? false}
      />
      {children}
    </DashboardShell>
  );
}
