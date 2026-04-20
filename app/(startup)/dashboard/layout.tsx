import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Database } from "@/lib/supabase/types";

type StartupRow = Database["public"]["Tables"]["startups"]["Row"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("owner_id", user.id)
    .single() as { data: StartupRow | null };

  if (!startup) redirect("/play");

  // Unread alert count for notification bell
  const { count: unreadCount } = await supabase
    .from("startup_alerts")
    .select("id", { count: "exact", head: true })
    .eq("startup_id", startup.id)
    .eq("is_read", false);

  return (
    <DashboardShell unreadAlerts={unreadCount ?? 0} startupName={startup.name}>
      {children}
    </DashboardShell>
  );
}
