import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FN_SECRET = Deno.env.get("EVALUATOR_FN_SECRET") ?? "";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== FN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Find exports that have expired (expires_at < now) and have a storage file
  const { data: expired, error: fetchErr } = await supabase
    .from("dataset_exports")
    .select("id, storage_path")
    .lt("expires_at", new Date().toISOString())
    .not("storage_path", "is", null);

  if (fetchErr) {
    console.error("[exports-file-cleanup] fetch error:", fetchErr.message);
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  if (!expired?.length) {
    return new Response(JSON.stringify({ ok: true, deleted: 0 }));
  }

  let deleted = 0;
  const errors: string[] = [];

  for (const exp of expired) {
    // storage_path is stored as "exports/{uuid}.json" — strip the bucket prefix for the remove call
    const storageKey = (exp.storage_path as string).replace(/^exports\//, "");

    const { error: storageErr } = await supabase.storage
      .from("exports")
      .remove([storageKey]);

    if (storageErr) {
      console.error(`[exports-file-cleanup] storage remove ${storageKey}:`, storageErr.message);
      errors.push(storageKey);
      continue;
    }

    await supabase.from("dataset_exports").delete().eq("id", exp.id);
    deleted++;
  }

  console.log(`[exports-file-cleanup] deleted ${deleted}/${expired.length} exports`);
  return new Response(
    JSON.stringify({ ok: errors.length === 0, deleted, errors }),
    { headers: { "Content-Type": "application/json" } },
  );
});
