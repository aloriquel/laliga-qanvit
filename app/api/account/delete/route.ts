import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Get all startups owned by user
    const { data: startups } = await serviceClient
      .from("startups")
      .select("id")
      .eq("owner_id", user.id);

    if (startups && startups.length > 0) {
      const startupIds = startups.map((s) => s.id);

      // Get all deck storage paths
      const { data: decks } = await serviceClient
        .from("decks")
        .select("storage_path")
        .in("startup_id", startupIds);

      // Remove files from storage
      if (decks && decks.length > 0) {
        const paths = decks.map((d) => d.storage_path);
        await serviceClient.storage.from("decks").remove(paths);
      }
    }

    // Delete profile (cascades: startups → decks → chunks → evaluations → alerts → views)
    await serviceClient.from("profiles").delete().eq("id", user.id);

    // Delete auth user (requires service role with admin API)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await adminClient.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
