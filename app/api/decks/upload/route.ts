import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateAndUploadDeck } from "@/lib/decks/upload-core";
import { getActiveBatch } from "@/lib/batches";

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
    const startupId = formData.get("startup_id") as string | null;
    const consentEvaluation = formData.get("consent_evaluation") === "true";
    const consentPublicProfile = formData.get("consent_public_profile") === "true";
    const consentInternalUse = formData.get("consent_internal_use") === "true";

    if (!file || !startupId) {
      return NextResponse.json({ error: "file and startup_id are required" }, { status: 400 });
    }
    if (!consentEvaluation) {
      return NextResponse.json({ error: "consent_evaluation is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    // Verify ownership (admins can upload to any startup)
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("id, owner_id, current_score")
      .eq("id", startupId)
      .single();

    if (startupError || !startup || (!isAdmin && startup.owner_id !== user.id)) {
      return NextResponse.json({ error: "Startup not found or not owned by user" }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Fetch active batch (non-blocking for admins who skip the guard)
    const activeBatch = await getActiveBatch();

    const result = await validateAndUploadDeck({
      file,
      startupId,
      serviceClient,
      userClient: supabase,
      skipBatchGuard: isAdmin,
      activeBatch,
    });

    if (!result.ok) {
      const body: Record<string, unknown> = { error: result.error };
      if (result.limitReached) {
        body.limit_reached = true;
        body.deck_count = result.deckCount;
        body.limit = result.limit;
      }
      return NextResponse.json(body, { status: result.status });
    }

    // Update startup consents
    await serviceClient
      .from("startups")
      .update({
        consent_public_profile: consentPublicProfile,
        consent_internal_use: consentInternalUse,
      })
      .eq("id", startupId);

    // UPSERT batch_participations for tracking deck uploads per batch
    if (activeBatch) {
      const { data: existing } = await serviceClient
        .from("batch_participations")
        .select("id, deck_uploads_count")
        .eq("batch_id", activeBatch.id)
        .eq("startup_id", startupId)
        .maybeSingle();

      if (existing) {
        await serviceClient
          .from("batch_participations")
          .update({
            deck_uploads_count: existing.deck_uploads_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await serviceClient.from("batch_participations").insert({
          batch_id: activeBatch.id,
          startup_id: startupId,
          baseline_score: startup.current_score ?? null,
          deck_uploads_count: 1,
          participated_via: "deck_nuevo",
        });
      }
    }

    // Apply referral if cookie present and startup has no referrer yet
    const refCode = req.cookies.get("qvt_ref")?.value;
    const finalResponse = NextResponse.json({ deck_id: result.deckId, status: "pending" }, { status: 201 });
    if (refCode) {
      const { data: refOrg } = await serviceClient
        .from("ecosystem_organizations")
        .select("id, owner_id")
        .eq("referral_code", refCode)
        .maybeSingle();

      if (refOrg && refOrg.owner_id !== user.id) {
        await serviceClient
          .from("startups")
          .update({ referred_by_org_id: refOrg.id })
          .eq("id", startupId)
          .is("referred_by_org_id", null);
      }
      finalResponse.cookies.set("qvt_ref", "", { path: "/", maxAge: 0 });
    }

    return finalResponse;
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
