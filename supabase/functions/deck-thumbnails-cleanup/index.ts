import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "deck-thumbnails";
const OPT_OUT_DAYS = 30;

serve(async () => {
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const deletedIds: string[] = [];
  let errors = 0;

  // ── 1. Orphaned previews (deck no longer exists) ──────────────────────────
  const { data: orphaned } = await db
    .from("deck_public_previews")
    .select("id, startup_id, deck_id, slide_number, thumbnail_url")
    .not(
      "deck_id",
      "in",
      `(SELECT id FROM decks)`
    );

  // ── 2. Previews whose startup has consent_public_deck=false for >30 days ─
  // We use generated_at as a proxy (once consent is off, no new rows are added;
  // existing rows become invisible via RLS but remain in DB until cleanup).
  const cutoff = new Date(Date.now() - OPT_OUT_DAYS * 86_400_000).toISOString();
  const { data: revoked } = await db
    .from("deck_public_previews")
    .select("id, startup_id, deck_id, slide_number, thumbnail_url, deck_public_previews_startup:startups!startup_id(consent_public_deck)")
    .lt("generated_at", cutoff);

  const revokedFiltered = (revoked ?? []).filter((row) => {
    const s = row.deck_public_previews_startup as { consent_public_deck: boolean } | null;
    return s?.consent_public_deck === false;
  });

  const toDelete = [...(orphaned ?? []), ...revokedFiltered];

  for (const row of toDelete) {
    const storagePath = `${row.startup_id}/${row.deck_id}/slide-${row.slide_number}.png`;
    const { error: storageErr } = await db.storage.from(BUCKET).remove([storagePath]);
    if (storageErr) {
      console.error(`Storage remove failed for ${storagePath}:`, storageErr.message);
      errors++;
      continue;
    }
    const { error: dbErr } = await db
      .from("deck_public_previews")
      .delete()
      .eq("id", row.id);
    if (dbErr) {
      console.error(`DB delete failed for ${row.id}:`, dbErr.message);
      errors++;
    } else {
      deletedIds.push(row.id);
    }
  }

  // ── Log to admin_cleanup_log ───────────────────────────────────────────────
  if (deletedIds.length > 0 || errors > 0) {
    await db.from("admin_cleanup_log" as any).insert({
      job: "deck-thumbnails-cleanup",
      deleted_count: deletedIds.length,
      error_count: errors,
      ran_at: new Date().toISOString(),
    }).catch(() => {
      // admin_cleanup_log may not exist yet — non-fatal
    });
  }

  console.log(JSON.stringify({
    job: "deck-thumbnails-cleanup",
    deleted: deletedIds.length,
    errors,
    ran_at: new Date().toISOString(),
  }));

  return new Response(
    JSON.stringify({ ok: true, deleted: deletedIds.length, errors }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
