/**
 * Imports the South Summit (Madrid) dataset from
 * research/scrapers/south-summit/output/south_summit_dataset_v1.json
 * into public.award_recipients (and award_editions).
 *
 * Mirrors scripts/import_4yfn.ts. Idempotent via clean-slate DELETE
 * scoped to this award's editions, then plain INSERT.
 *
 * Pre-requisitos:
 *   - .env.local con NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *   - Dataset south_summit_dataset_v1.json generado por
 *     research/scrapers/south-summit/scrape.py.
 *   - Migration 0059 aplicada (seed del award 'south-summit').
 *
 * Usage:
 *   npx tsx scripts/import_south_summit.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

type RawRecord = {
  edition_year: number;
  edition_number: number | null;
  category_type: string;
  category_value: string;
  result: "winner" | "finalist";
  company_name: string;
  company_name_original?: string;
  normalized_name?: string;
  company_country?: string | null;
  is_spanish_ecosystem?: boolean;
  company_website?: string | null;
  domain_root?: string | null;
  company_description_short?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  scraped_at?: string;
  id: string; // external_id
};

// Must match the public.award_category_type enum exactly. Anything the
// scraper emits outside this set falls through to "special".
const VALID_CATEGORY_TYPES = new Set([
  "regional",
  "challenge",
  "accesit",
  "trajectory",
  "special",
]);

function loadEnv(): { url: string; key: string } {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  const raw = readFileSync(envPath, "utf8");
  const url = raw.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1].trim();
  const key = raw.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1].trim();
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local");
  return { url, key };
}

async function main() {
  const datasetPath = path.resolve(
    __dirname,
    "..",
    "research/scrapers/south-summit/output/south_summit_dataset_v1.json"
  );
  if (!existsSync(datasetPath)) {
    console.error(
      "Dataset not found:", datasetPath,
      "\nRun:  cd research/scrapers && python south-summit/scrape.py --phase=all"
    );
    process.exit(1);
  }

  const { url, key } = loadEnv();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient(url, key, { auth: { persistSession: false } }) as any;

  const data: RawRecord[] = JSON.parse(readFileSync(datasetPath, "utf8"));
  console.log(`Loaded ${data.length} records from dataset`);

  const { data: award } = await sb
    .from("awards")
    .select("id")
    .eq("slug", "south-summit")
    .single();
  if (!award) {
    throw new Error("award 'south-summit' not found — apply migration 0059");
  }

  // ── Editions ─────────────────────────────────────────────────────
  const editionKeySet = new Set<string>();
  for (const r of data) {
    const cat = (r.category_value || "General").trim() || "General";
    const ct = VALID_CATEGORY_TYPES.has(r.category_type)
      ? r.category_type
      : "special";
    editionKeySet.add(`${r.edition_year}|${ct}|${cat}`);
  }
  console.log(`Distinct editions to upsert: ${editionKeySet.size}`);

  const editionRows = [...editionKeySet].map((k) => {
    const [year, ct, cat] = k.split("|");
    return {
      award_id: award.id,
      edition_year: Number(year),
      edition_number: Number(year) - 2012, // 2013 = 1st edition.
      category_type: ct,
      category_value: cat,
      source_url:
        data.find(
          (r) => r.edition_year === Number(year) && r.category_value === cat
        )?.source_url ?? null,
    };
  });

  let editionsInserted = 0;
  for (let i = 0; i < editionRows.length; i += 100) {
    const slice = editionRows.slice(i, i + 100);
    const { error } = await sb
      .from("award_editions")
      .upsert(slice, {
        onConflict: "award_id,edition_year,category_type,category_value",
        ignoreDuplicates: true,
      });
    if (error) {
      console.error("editions insert error:", error.message);
      process.exit(2);
    }
    editionsInserted += slice.length;
  }

  // ── Lookup edition IDs ───────────────────────────────────────────
  const { data: allEditions } = await sb
    .from("award_editions")
    .select("id, edition_year, category_type, category_value")
    .eq("award_id", award.id);
  const editionMap = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (allEditions ?? []) as any[]) {
    editionMap.set(`${e.edition_year}|${e.category_type}|${e.category_value}`, e.id);
  }

  // ── Recipients ───────────────────────────────────────────────────
  const recipientRows = data.map((r) => {
    const cat = (r.category_value || "General").trim() || "General";
    const ct = VALID_CATEGORY_TYPES.has(r.category_type)
      ? r.category_type
      : "special";
    const editionId = editionMap.get(`${r.edition_year}|${ct}|${cat}`);
    if (!editionId) {
      throw new Error(
        `No edition found for year=${r.edition_year} cat=${cat} type=${ct}`
      );
    }
    let desc = r.company_description_short || null;
    if (desc && desc.length > 240) desc = desc.slice(0, 239) + "…";
    return {
      edition_id: editionId,
      result: r.result === "finalist" ? "finalist" : "winner",
      company_name: r.company_name,
      company_name_normalized:
        r.normalized_name || r.company_name.toLowerCase(),
      company_website: r.company_website ?? null,
      company_domain_root: r.domain_root ?? null,
      company_description_short: desc,
      current_status: "unknown",
      current_status_updated_at: r.scraped_at ?? null,
      source_url: r.source_url ?? null,
      source_type: r.source_type ?? "official",
      external_id: r.id,
      is_spanish_ecosystem: r.is_spanish_ecosystem === true,
      company_country: r.company_country ?? null,
    };
  });

  // Clean slate for south-summit: delete existing recipients for this
  // award before insert. (Partial unique index on external_id WHERE NOT
  // NULL doesn't match supabase-js onConflict — same workaround as 4YFN.)
  const editionIds = [...editionMap.values()];
  const { error: delError, count: delCount } = await sb
    .from("award_recipients")
    .delete({ count: "exact" })
    .in("edition_id", editionIds);
  if (delError) {
    console.error("delete error:", delError.message);
    process.exit(3);
  }
  console.log(`Deleted ${delCount ?? 0} prior south-summit recipients (clean slate)`);

  let inserted = 0;
  let errored = 0;
  for (let i = 0; i < recipientRows.length; i += 100) {
    const slice = recipientRows.slice(i, i + 100);
    const { data: result, error } = await sb
      .from("award_recipients")
      .insert(slice)
      .select("id");
    if (error) {
      console.error("recipients chunk error:", error.message);
      errored += slice.length;
      continue;
    }
    inserted += result?.length ?? 0;
  }

  console.log(
    `Editions upserted: ${editionsInserted} · Recipients inserted: ${inserted} · errored: ${errored}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
