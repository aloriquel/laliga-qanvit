import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "startup-logos";

export async function POST(_req: NextRequest) {
  const prefix = "[startup-logo-delete]";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("id, logo_storage_path")
    .eq("owner_id", user.id)
    .single();

  if (!startup) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }

  const service = createServiceClient();

  // Delete from storage if path is known
  const storagePath = startup.logo_storage_path;
  if (storagePath) {
    const { error: rmErr } = await service.storage.from(BUCKET).remove([storagePath]);
    if (rmErr) {
      console.warn(`${prefix} Storage remove failed (continuing):`, rmErr.message);
    }
  }

  const { error: dbErr } = await service
    .from("startups")
    .update({
      logo_url: null,
      logo_storage_path: null,
      logo_updated_at: new Date().toISOString(),
    })
    .eq("id", startup.id);

  if (dbErr) {
    console.error(`${prefix} DB update failed:`, dbErr.message);
    return NextResponse.json({ error: "Error al eliminar el logo." }, { status: 500 });
  }

  // Refresh materialized view so the leaderboard reflects the removed logo immediately
  service.rpc("admin_refresh_league_standings").then(({ error }) => {
    if (error) console.warn(`${prefix} standings refresh failed:`, error.message);
  });

  console.log(`${prefix} Logo removed for startup`, startup.id);
  return NextResponse.json({ success: true });
}
