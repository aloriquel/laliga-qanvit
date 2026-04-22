import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: startup } = await supabase
    .from("startups")
    .select("id, consent_public_profile")
    .eq("owner_id", user.id)
    .single();

  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  if (!startup.consent_public_profile) {
    return NextResponse.json(
      { error: "Activa primero el perfil público." },
      { status: 422 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("startups")
    .update({ consent_public_deck: true })
    .eq("id", startup.id);

  // Thumbnails are rendered client-side via pdfjs-dist — nothing to generate server-side.
  return NextResponse.json({ success: true });
}
