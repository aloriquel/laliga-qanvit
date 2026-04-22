import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  // The INSERT trigger (trg_deck_pipeline) doesn't fire on UPDATE, so we must
  // call the edge function directly. Fail fast if the URL isn't configured so
  // the deck is never left in a zombie pending state.
  const fnUrl = process.env.EVALUATOR_FN_URL;
  const fnSecret = process.env.EVALUATOR_FN_SECRET;

  if (!fnUrl || !fnSecret) {
    return NextResponse.json(
      { error: "Pipeline not configured. Set EVALUATOR_FN_URL and EVALUATOR_FN_SECRET in Vercel env." },
      { status: 500 },
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  const { error: updateError } = await serviceClient
    .from("decks")
    .update({ status: "pending", error_message: null, processed_at: null })
    .eq("id", params.id)
    .in("status", ["error", "processing"]);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  try {
    await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fnSecret}`,
      },
      body: JSON.stringify({ deck_id: params.id }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal — deck is pending, admin can recheck logs
  }

  return NextResponse.json({ ok: true });
}
