import { createClient, createServiceClient } from "@/lib/supabase/server";
import WinnerCelebrationModal, { type WinnerCategory } from "./WinnerCelebrationModal";

/** Server wrapper: if the current user owns a startup with an unseen
 *  batch_celebration row, render the modal. Otherwise render nothing. */
export default async function WinnerCelebrationGate() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();

  const { data: startup } = await service
    .from("startups")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!startup) return null;

  const { data: celebration } = await service
    .from("batch_celebrations")
    .select("batch_id")
    .eq("startup_id", startup.id)
    .is("seen_modal_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!celebration?.batch_id) return null;

  const [{ data: batch }, { data: winnersRaw }] = await Promise.all([
    service.from("batches").select("id, slug, display_name").eq("id", celebration.batch_id).maybeSingle(),
    service
      .from("batch_winners")
      .select("category, segment_key, final_score")
      .eq("batch_id", celebration.batch_id)
      .eq("startup_id", startup.id),
  ]);

  if (!batch) return null;

  const categories: WinnerCategory[] = (winnersRaw ?? []).map((w) => ({
    category: w.category,
    segment_key: w.segment_key,
    final_score: Number(w.final_score),
  }));

  if (categories.length === 0) return null;

  return (
    <WinnerCelebrationModal
      batchId={batch.id}
      batchSlug={batch.slug}
      batchDisplayName={batch.display_name}
      categories={categories}
      startupSlug={startup.slug}
    />
  );
}
