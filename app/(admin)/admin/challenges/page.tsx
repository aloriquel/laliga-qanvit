import { createServiceClient } from "@/lib/supabase/server";
import ChallengeAdminTabs from "@/components/admin/ChallengeAdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  const supabase = createServiceClient();

  const { data: challenges, error: challengesError } = await supabase
    .from("challenges")
    .select("*, votes:challenge_votes(id), progress:challenge_progress(org_id, count)")
    .order("created_at", { ascending: false });

  if (challengesError) console.error("[admin/challenges] query error:", challengesError.message);

  return (
    <div className="space-y-6">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Gestión de retos</h1>
      <ChallengeAdminTabs challenges={challenges ?? []} />
    </div>
  );
}
