import { fileTypeFromBuffer } from "file-type";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const RATE_LIMIT_DAYS = 7;

type UploadInput = {
  file: File;
  startupId: string;
  serviceClient: SupabaseClient<Database>;
  userClient: SupabaseClient<Database>;
  skipRateLimit?: boolean; // for re-submit after archiving previous deck
};

type UploadResult =
  | { ok: true; deckId: string; storagePath: string; version: number }
  | { ok: false; error: string; status: number };

export async function validateAndUploadDeck(input: UploadInput): Promise<UploadResult> {
  const { file, startupId, serviceClient, userClient, skipRateLimit } = input;

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "File exceeds 20 MB limit", status: 400 };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || detected.mime !== "application/pdf") {
    return { ok: false, error: "Only PDF files are accepted", status: 400 };
  }

  if (!skipRateLimit) {
    const cutoff = new Date(Date.now() - RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentDeck } = await userClient
      .from("decks")
      .select("uploaded_at")
      .eq("startup_id", startupId)
      .neq("status", "archived")
      .gte("uploaded_at", cutoff)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDeck) {
      return { ok: false, error: "Rate limit: only 1 deck every 7 days.", status: 429 };
    }
  }

  const { data: maxVersionRow } = await userClient
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
    return { ok: false, error: "Failed to upload file", status: 500 };
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

export function getRateLimitUnlockDate(uploadedAt: string): Date {
  return new Date(new Date(uploadedAt).getTime() + RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000);
}
