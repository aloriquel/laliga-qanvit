import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: startup } = await supabase
    .from("startups")
    .select("id, consent_public_profile, current_division, current_vertical")
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

  // Get latest deck to generate thumbnails
  const { data: deck } = await supabase
    .from("decks")
    .select("id, startup_id")
    .eq("startup_id", startup.id)
    .eq("status", "evaluated")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (deck) {
    // Get latest evaluation for score info
    const { data: evalRow } = await supabase
      .from("evaluations")
      .select("score_total, assigned_division, assigned_vertical")
      .eq("startup_id", startup.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const vercelUrl = process.env.VERCEL_API_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const secret = process.env.INTERNAL_WEBHOOK_SECRET ?? "";

    fetch(`${vercelUrl}/api/internal/generate-deck-thumbnails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret,
      },
      body: JSON.stringify({
        deck_id: deck.id,
        startup_id: startup.id,
        overall_score: evalRow?.score_total ?? null,
        division: evalRow?.assigned_division ?? startup.current_division ?? null,
        vertical: evalRow?.assigned_vertical ?? startup.current_vertical ?? null,
      }),
    }).catch((err) => console.error("Thumbnail webhook error:", err));
  }

  return NextResponse.json({
    generating: true,
    expected_at: new Date(Date.now() + 45_000).toISOString(),
  });
}
