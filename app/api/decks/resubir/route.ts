import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateAndUploadDeck, RATE_LIMIT_DAYS, getRateLimitUnlockDate } from "@/lib/decks/upload-core";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const oneLiner = formData.get("one_liner") as string | null;
    const consentPublicProfile = formData.get("consent_public_profile") === "true";
    const consentInternalUse = formData.get("consent_internal_use") === "true";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    // Get startup owned by this user
    const { data: startup } = await supabase
      .from("startups")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!startup) {
      return NextResponse.json({ error: "No startup found for this user" }, { status: 404 });
    }

    // Rate limit check: look at last non-archived deck
    const cutoff = new Date(Date.now() - RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentDeck } = await supabase
      .from("decks")
      .select("uploaded_at")
      .eq("startup_id", startup.id)
      .neq("status", "archived")
      .gte("uploaded_at", cutoff)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDeck) {
      const unlock = getRateLimitUnlockDate(recentDeck.uploaded_at);
      return NextResponse.json(
        { error: "Rate limit: only 1 deck every 7 days.", unlock_at: unlock.toISOString() },
        { status: 429 }
      );
    }

    const serviceClient = createServiceClient();

    // Archive the current active deck
    await serviceClient
      .from("decks")
      .update({ status: "archived" })
      .eq("startup_id", startup.id)
      .neq("status", "archived");

    // Update one-liner if changed
    if (oneLiner !== null && oneLiner.trim() !== "") {
      await serviceClient
        .from("startups")
        .update({ one_liner: oneLiner.trim() })
        .eq("id", startup.id);
    }

    // Upload new deck (skip rate limit since we already checked)
    const result = await validateAndUploadDeck({
      file,
      startupId: startup.id,
      serviceClient,
      userClient: supabase,
      skipRateLimit: true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Update consents
    await serviceClient
      .from("startups")
      .update({
        consent_public_profile: consentPublicProfile,
        consent_internal_use: consentInternalUse,
      })
      .eq("id", startup.id);

    return NextResponse.json({ deck_id: result.deckId, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("Resubir route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
