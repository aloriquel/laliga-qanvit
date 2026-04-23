import { fileTypeFromBuffer } from "file-type";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { DECK_UPLOAD_LIMIT_PER_BATCH } from "@/lib/batches";
export { DECK_UPLOAD_LIMIT_PER_BATCH } from "@/lib/batches";

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type UploadInput = {
  file: File;
  startupId: string;
  serviceClient: SupabaseClient<Database>;
  userClient: SupabaseClient<Database>;
  /** Skip batch guard for admins or re-subir flows that check independently. */
  skipBatchGuard?: boolean;
  /** Required unless skipBatchGuard is true. */
  activeBatch?: { id: string; slug: string; starts_at: string; ends_at: string } | null;
};

type UploadResult =
  | { ok: true; deckId: string; storagePath: string; version: number }
  | { ok: false; error: string; status: number; limitReached?: true; deckCount?: number; limit?: number };

export async function validateAndUploadDeck(input: UploadInput): Promise<UploadResult> {
  const { file, startupId, serviceClient, skipBatchGuard, activeBatch } = input;

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "File exceeds 20 MB limit", status: 400 };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || detected.mime !== "application/pdf") {
    return { ok: false, error: "Only PDF files are accepted", status: 400 };
  }

  if (!skipBatchGuard) {
    if (!activeBatch) {
      return {
        ok: false,
        error: "No hay batch activo. Los decks solo pueden subirse durante un batch activo.",
        status: 503,
      };
    }

    // Count deck submissions for this startup in the active batch
    const { data: participation } = await serviceClient
      .from("batch_participations")
      .select("deck_uploads_count")
      .eq("batch_id", activeBatch.id)
      .eq("startup_id", startupId)
      .maybeSingle();

    const deckCount = participation?.deck_uploads_count ?? 0;
    if (deckCount >= DECK_UPLOAD_LIMIT_PER_BATCH) {
      return {
        ok: false,
        error: `Has usado las ${DECK_UPLOAD_LIMIT_PER_BATCH} subidas de este batch (${activeBatch.slug}). Podrás subir de nuevo en el siguiente.`,
        status: 429,
        limitReached: true,
        deckCount,
        limit: DECK_UPLOAD_LIMIT_PER_BATCH,
      };
    }
  }

  const { data: maxVersionRow } = await serviceClient
    .from("decks")
    .select("version")
    .eq("startup_id", startupId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (maxVersionRow?.version ?? 0) + 1;

  const deckId = crypto.randomUUID();
  const storagePath = `${startupId}/${deckId}.pdf`;

  const { error: uploadError } = await serviceClient.storage
    .from("decks")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { ok: false, error: `Failed to upload file: ${uploadError.message}`, status: 500 };
  }

  const { error: insertError } = await serviceClient.from("decks").insert({
    id: deckId,
    startup_id: startupId,
    version: nextVersion,
    storage_path: storagePath,
    file_size_bytes: file.size,
    status: "pending",
  });

  if (insertError) {
    await serviceClient.storage.from("decks").remove([storagePath]);
    return { ok: false, error: "Failed to create deck record", status: 500 };
  }

  return { ok: true, deckId, storagePath, version: nextVersion };
}
