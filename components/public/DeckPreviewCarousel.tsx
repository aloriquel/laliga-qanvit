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

  // Preview path is keyed by deck_id — naturally invalidated when startup uploads a new deck.
  const previewPath = `${startupId}/${evalRow.deck_id}/preview-${MAX_PAGES}-pages.pdf`;

  // Lightweight existence check — avoids re-processing on every page render.
  const { data: fileList } = await supabase.storage
    .from(PREVIEW_BUCKET)
    .list(`${startupId}/${evalRow.deck_id}`);

  const previewExists = fileList?.some((f) => f.name === `preview-${MAX_PAGES}-pages.pdf`);

  if (!previewExists) {
    // Download original from private decks bucket
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("decks")
      .download(deck.storage_path as string);

    if (dlErr || !fileData) {
      console.error("[DeckPreviewCarousel] PDF download failed:", dlErr?.message);
      return null;
    }

    try {
      const srcBytes = new Uint8Array(await fileData.arrayBuffer());
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
        return null;
      }
    } catch (err) {
      console.error("[DeckPreviewCarousel] PDF trim failed:", err);
      return null;
    }
  }

  // Signed URL from trimmed preview — not from original deck.
  const { data: signed } = await supabase.storage
    .from(PREVIEW_BUCKET)
    .createSignedUrl(previewPath, 3600);

  if (!signed?.signedUrl) return null;

  const watermark = [
    "La Liga Qanvit",
    evalRow.score_total != null ? `${Math.round(evalRow.score_total)}pts` : null,
    evalRow.assigned_division as string | null,
    evalRow.assigned_vertical as string | null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DeckPreviewCarouselClient pdfUrl={signed.signedUrl} watermark={watermark} />
  );
}
