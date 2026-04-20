import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
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

  // Reset to pending — the trigger trg_deck_pipeline re-fires on status='pending'
  // but only fires on INSERT, not UPDATE. We need to force the pipeline manually.
  // Strategy: update status to 'pending' and call the edge function directly.
  const serviceClient = createServiceClient();

  const { error: updateError } = await serviceClient
    .from("decks")
    .update({ status: "pending", error_message: null, processed_at: null })
    .eq("id", params.id)
    .in("status", ["error", "processing"]); // safety: only retry error/processing decks

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Invoke the edge function directly (since UPDATE won't fire the INSERT trigger)
  const fnUrl = process.env.EVALUATOR_FN_URL;
  const fnSecret = process.env.EVALUATOR_FN_SECRET;

  if (fnUrl && fnSecret) {
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
      // Non-fatal — the deck is already reset to pending; admin can check logs
    }
  }

  return NextResponse.json({ ok: true });
}
