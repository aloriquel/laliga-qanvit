import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fileTypeFromBuffer } from "file-type";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const RATE_LIMIT_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    // --- Auth ---
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Parse multipart ---
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

    // --- Verify startup ownership ---
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("id, owner_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup || startup.owner_id !== user.id) {
      return NextResponse.json({ error: "Startup not found or not owned by user" }, { status: 403 });
    }

    // --- Validate file size ---
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 20 MB limit" }, { status: 400 });
    }

    // --- Validate mime type via magic bytes ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || detected.mime !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // --- Rate limit: 1 deck per 7 days ---
    const cutoff = new Date(Date.now() - RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentDeck } = await supabase
      .from("decks")
      .select("uploaded_at")
      .eq("startup_id", startupId)
      .gte("uploaded_at", cutoff)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDeck) {
      return NextResponse.json(
        { error: "Rate limit: only 1 deck every 7 days. Try again later." },
        { status: 429 }
      );
    }

    // --- Calculate next version ---
    const { data: maxVersionRow } = await supabase
      .from("decks")
      .select("version")
      .eq("startup_id", startupId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (maxVersionRow?.version ?? 0) + 1;

    // --- Generate deck_id and upload to Storage ---
    const { data: deckIdRow } = await supabase.rpc("gen_random_uuid" as never);
    // Use crypto.randomUUID() — standard in Node 18+
    const deckId = crypto.randomUUID();
    const storagePath = `${startupId}/${deckId}.pdf`;

    const serviceClient = createServiceClient();
    const { error: uploadError } = await serviceClient.storage
      .from("decks")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // --- INSERT deck record ---
    const { error: insertError } = await serviceClient
      .from("decks")
      .insert({
        id: deckId,
        startup_id: startupId,
        version: nextVersion,
        storage_path: storagePath,
        file_size_bytes: file.size,
        status: "pending",
      });

    if (insertError) {
      // Cleanup orphaned storage file
      await serviceClient.storage.from("decks").remove([storagePath]);
      console.error("DB insert error:", insertError);
      return NextResponse.json({ error: "Failed to create deck record" }, { status: 500 });
    }

    // --- Update startup consents ---
    await serviceClient
      .from("startups")
      .update({
        consent_public_profile: consentPublicProfile,
        consent_internal_use: consentInternalUse,
      })
      .eq("id", startupId);

    // The pg_net trigger fires automatically on INSERT with status='pending'
    return NextResponse.json({ deck_id: deckId, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
