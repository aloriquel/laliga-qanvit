import { createServiceClient } from "@/lib/supabase/server";
import { PDFDocument } from "pdf-lib";
import DeckPreviewCarouselClient from "./DeckPreviewCarouselClient";

const PREVIEW_BUCKET = "deck-thumbnails";
const MAX_PAGES = 5;

type Props = { startupId: string };

export default async function DeckPreviewCarousel({ startupId }: Props) {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: evalRow } = await (supabase as any)
    .from("evaluations")
    .select("deck_id, score_total, assigned_division, assigned_vertical")
    .eq("startup_id", startupId)
    .not("score_total", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evalRow?.deck_id) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deck } = await (supabase as any)
    .from("decks")
    .select("storage_path")
    .eq("id", evalRow.deck_id)
    .single();

  if (!deck?.storage_path) return null;

  const previewPath = `${startupId}/${evalRow.deck_id}/preview-${MAX_PAGES}-pages.pdf`;

  // ── Try to serve the trimmed preview PDF (privacy layer 1) ────────────────
  const previewUrl = await getOrCreatePreviewUrl(
    supabase,
    previewPath,
    deck.storage_path as string
  );

  // ── Fallback: sign the original PDF if trim failed (e.g. bucket not ready) ─
  // Privacy still maintained by: (a) 1h signed URL TTL, (b) private decks bucket,
  // (c) canvas watermark baked in pixels, (d) client renders max 5 pages.
  const pdfUrl =
    previewUrl ??
    (await signOriginalPdf(supabase, deck.storage_path as string));

  if (!pdfUrl) return null;

  if (!previewUrl) {
    console.warn(
      "[DeckPreviewCarousel] Falling back to original PDF — apply migration 0033 to enable 5-page trim.",
      { startupId, deck_id: evalRow.deck_id }
    );
  }

  const watermark = [
    "La Liga Qanvit",
    evalRow.score_total != null ? `${Math.round(evalRow.score_total)}pts` : null,
    evalRow.assigned_division as string | null,
    evalRow.assigned_vertical as string | null,
  ]
    .filter(Boolean)
    .join(" · ");

  return <DeckPreviewCarouselClient pdfUrl={pdfUrl} watermark={watermark} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreatePreviewUrl(supabase: any, previewPath: string, storagePath: string) {
  try {
    // Lightweight check — avoid re-processing on every render.
    const folder = previewPath.split("/").slice(0, -1).join("/");
    const fileName = previewPath.split("/").pop()!;
    const { data: fileList, error: listErr } = await supabase.storage
      .from(PREVIEW_BUCKET)
      .list(folder);

    if (listErr) {
      // Bucket probably doesn't exist yet
      return null;
    }

    const exists = (fileList as Array<{ name: string }>)?.some((f) => f.name === fileName);

    if (!exists) {
      const generated = await generateTrimmedPreview(supabase, previewPath, storagePath);
      if (!generated) return null;
    }

    const { data: signed } = await supabase.storage
      .from(PREVIEW_BUCKET)
      .createSignedUrl(previewPath, 3600);

    return signed?.signedUrl ?? null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateTrimmedPreview(supabase: any, previewPath: string, storagePath: string) {
  try {
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("decks")
      .download(storagePath);

    if (dlErr || !fileData) {
      console.error("[DeckPreviewCarousel] PDF download failed:", dlErr?.message);
      return false;
    }

    const srcBytes = new Uint8Array(await (fileData as Blob).arrayBuffer());
    const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
    const trimDoc = await PDFDocument.create();

    const indices = Array.from(
      { length: Math.min(srcDoc.getPageCount(), MAX_PAGES) },
      (_, i) => i
    );
    const copied = await trimDoc.copyPagesFrom(srcDoc, indices);
    copied.forEach((p) => trimDoc.addPage(p));

    const trimBytes = await trimDoc.save();

    const { error: ulErr } = await supabase.storage
      .from(PREVIEW_BUCKET)
      .upload(previewPath, trimBytes, { contentType: "application/pdf", upsert: true });

    if (ulErr) {
      console.error("[DeckPreviewCarousel] Preview upload failed:", ulErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[DeckPreviewCarousel] PDF trim failed:", err);
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function signOriginalPdf(supabase: any, storagePath: string) {
  const { data: signed } = await supabase.storage
    .from("decks")
    .createSignedUrl(storagePath, 3600);
  return signed?.signedUrl ?? null;
}
