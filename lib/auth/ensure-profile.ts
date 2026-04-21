import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function ensureProfile(user: User) {
  const supabase = createClient();

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        role: "startup",
      })
      .select()
      .maybeSingle();

    const retry = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    profile = retry.data;
  }

  return profile;
}
