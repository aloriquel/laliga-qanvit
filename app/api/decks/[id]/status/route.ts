import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: deck, error } = await supabase
    .from("decks")
    .select("id, startup_id, status, error_message")
    .eq("id", params.id)
    .single();

  if (error || !deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Verify ownership via startup
  const { data: startup } = await supabase
    .from("startups")
    .select("owner_id")
    .eq("id", deck.startup_id)
    .single();

  if (!startup || startup.owner_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Fetch evaluation_id if evaluated
  let evaluationId: string | null = null;
  if (deck.status === "evaluated") {
    const { data: ev } = await supabase
      .from("evaluations")
      .select("id")
      .eq("deck_id", deck.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    evaluationId = ev?.id ?? null;
  }

  return NextResponse.json({
    status: deck.status,
    startup_id: deck.startup_id,
    evaluation_id: evaluationId,
    error_message: deck.error_message,
  });
}
