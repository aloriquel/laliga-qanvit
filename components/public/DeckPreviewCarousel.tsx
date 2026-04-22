import { createServiceClient } from "@/lib/supabase/server";
import DeckPreviewCarouselClient from "./DeckPreviewCarouselClient";

type Props = { startupId: string };

export default async function DeckPreviewCarousel({ startupId }: Props) {
  const supabase = createServiceClient();

  // Get latest evaluated deck
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

  // Short-lived signed URL for the private decks bucket (1 hour)
  const { data: signed } = await supabase.storage
    .from("decks")
    .createSignedUrl(deck.storage_path as string, 3600);

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
    <DeckPreviewCarouselClient
      pdfUrl={signed.signedUrl}
      watermark={watermark}
    />
  );
}
