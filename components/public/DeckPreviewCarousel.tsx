import { createServiceClient } from "@/lib/supabase/server";
import DeckPreviewCarouselClient from "./DeckPreviewCarouselClient";

export type DeckPreview = {
  id: string;
  slide_number: number;
  thumbnail_url: string;
  width: number | null;
  height: number | null;
};

type Props = { startupId: string };

export default async function DeckPreviewCarousel({ startupId }: Props) {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("deck_public_previews")
    .select("id, slide_number, thumbnail_url, width, height")
    .eq("startup_id", startupId)
    .order("slide_number", { ascending: true });

  if (!data || (data as unknown[]).length === 0) return null;

  return <DeckPreviewCarouselClient thumbnails={data as DeckPreview[]} />;
}
