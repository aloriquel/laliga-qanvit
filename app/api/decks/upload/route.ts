import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateAndUploadDeck } from "@/lib/decks/upload-core";

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

    // Verify ownership
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("id, owner_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup || startup.owner_id !== user.id) {
      return NextResponse.json({ error: "Startup not found or not owned by user" }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    const result = await validateAndUploadDeck({
      file,
      startupId,
      serviceClient,
      userClient: supabase,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Update startup consents
    await serviceClient
      .from("startups")
      .update({
        consent_public_profile: consentPublicProfile,
        consent_internal_use: consentInternalUse,
      })
      .eq("id", startupId);

    return NextResponse.json({ deck_id: result.deckId, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
