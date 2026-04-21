import { createClient } from "@/lib/supabase/server";

export type UserWithRole = {
  user: NonNullable<Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>>["data"]["user"]>;
  profile: {
    id: string;
    email: string | null;
    role: string | null;
    full_name: string | null;
    avatar_url: string | null;
    consented_at: string | null;
  } | null;
};

export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, avatar_url, consented_at")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
