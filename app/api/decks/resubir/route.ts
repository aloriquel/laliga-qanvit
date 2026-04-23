import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateAndUploadDeck } from "@/lib/decks/upload-core";
import { getActiveBatch, DECK_UPLOAD_LIMIT_PER_BATCH } from "@/lib/batches";

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

    const { data: startup } = await supabase
      .from("startups")
      .select("id, current_score")
      .eq("owner_id", user.id)
      .single();

    if (!startup) {
      return NextResponse.json({ error: "No startup found for this user" }, { status: 404 });
    }

    const serviceClient = createServiceClient();

    // Batch-based rate limit: check submission count for this startup in active batch
    const activeBatch = await getActiveBatch();
    if (!activeBatch) {
      return NextResponse.json(
        { error: "No hay batch activo. Los decks solo pueden subirse durante un batch activo." },
        { status: 503 }
      );
    }

    const { data: participation } = await serviceClient
      .from("batch_participations")
      .select("id, deck_uploads_count")
      .eq("batch_id", activeBatch.id)
      .eq("startup_id", startup.id)
      .maybeSingle();

    const deckCount = participation?.deck_uploads_count ?? 0;
    if (deckCount >= DECK_UPLOAD_LIMIT_PER_BATCH) {
      return NextResponse.json(
        {
          error: `Has usado las ${DECK_UPLOAD_LIMIT_PER_BATCH} subidas de este batch. Podrás re-subir en el siguiente.`,
          limit_reached: true,
          deck_count: deckCount,
          limit: DECK_UPLOAD_LIMIT_PER_BATCH,
          batch_ends_at: activeBatch.ends_at,
        },
        { status: 429 }
      );
    }

    // Archive current active decks
    await serviceClient
      .from("decks")
      .update({ status: "archived" })
      .eq("startup_id", startup.id)
      .neq("status", "archived");

    // Update one-liner if provided
    if (oneLiner !== null && oneLiner.trim() !== "") {
      await serviceClient
        .from("startups")
        .update({ one_liner: oneLiner.trim() })
        .eq("id", startup.id);
    }

    // Upload new deck (guard already checked above)
    const result = await validateAndUploadDeck({
      file,
      startupId: startup.id,
      serviceClient,
      userClient: supabase,
      skipBatchGuard: true,
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

    // Increment batch participation count
    if (participation) {
      await serviceClient
        .from("batch_participations")
        .update({
          deck_uploads_count: participation.deck_uploads_count + 1,
          participated_via: "deck_actualizado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", participation.id);
    } else {
      await serviceClient.from("batch_participations").insert({
        batch_id: activeBatch.id,
        startup_id: startup.id,
        baseline_score: startup.current_score ?? null,
        deck_uploads_count: 1,
        participated_via: "deck_nuevo",
      });
    }

    return NextResponse.json({ deck_id: result.deckId, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("Resubir route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
