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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("batch_celebrations" as any)
    .select("batch_id")
    .eq("startup_id", startup.id)
    .is("seen_modal_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const celebRow = celebration as any;
  if (!celebRow?.batch_id) return null;

  const [{ data: batch }, { data: winnersRaw }] = await Promise.all([
    service.from("batches").select("id, slug, display_name").eq("id", celebRow.batch_id).maybeSingle(),
    service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("batch_winners" as any)
      .select("category, segment_key, final_score")
      .eq("batch_id", celebRow.batch_id)
      .eq("startup_id", startup.id),
  ]);

  if (!batch) return null;

  const categories: WinnerCategory[] = ((winnersRaw ?? []) as unknown as WinnerCategory[]).map((w) => ({
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
