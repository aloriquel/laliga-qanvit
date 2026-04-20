#!/usr/bin/env npx ts-node --esm
/**
 * Smoke test for the upload + evaluation pipeline.
 * Usage: npm run smoke:pipeline [deck_id]
 *
 * If deck_id is provided, polls its status without re-uploading.
 * Otherwise uploads fixtures/sample-deck.pdf to a test startup.
 *
 * Requires .env.local to be populated with Supabase + app credentials.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const env = readFileSync(resolve(__dir, "../.env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && !key.startsWith("#") && rest.length > 0) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
} catch {
  console.error("⚠️  .env.local not found. Set environment variables manually.");
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FIXTURE_PATH = resolve(__dir, "../fixtures/sample-deck.pdf");

const existingDeckId = process.argv[2];

async function pollStatus(deckId: string, authCookie: string): Promise<void> {
  const maxWait = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 4000;
  const start = Date.now();

  console.log(`\n⏳ Polling status for deck ${deckId}...`);

  while (Date.now() - start < maxWait) {
    const res = await fetch(`${APP_URL}/api/decks/${deckId}/status`, {
      headers: { Cookie: authCookie },
    });

    if (!res.ok) {
      console.error(`  Status endpoint returned ${res.status}`);
      process.exit(1);
    }

    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`  [${elapsed}s] status=${data.status}`);

    if (data.status === "evaluated") {
      console.log(`\n✅ Evaluation complete!`);
      console.log(`   Evaluation ID: ${data.evaluation_id}`);
      console.log(`   Result URL: ${APP_URL}/play/resultado/${deckId}`);
      return;
    }

    if (data.status === "error") {
      console.error(`\n❌ Pipeline error: ${data.error_message}`);
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }

  console.error("\n⏰ Timeout: pipeline did not complete within 5 minutes.");
  process.exit(1);
}

async function main() {
  if (existingDeckId) {
    // Poll existing deck — auth cookie required (pass via SMOKE_AUTH_COOKIE env)
    const cookie = process.env.SMOKE_AUTH_COOKIE ?? "";
    if (!cookie) {
      console.error("Set SMOKE_AUTH_COOKIE=<your-supabase-session-cookie> to poll status");
      process.exit(1);
    }
    await pollStatus(existingDeckId, cookie);
    return;
  }

  // Upload fixture
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = readFileSync(FIXTURE_PATH);
  } catch {
    console.error(`❌ Fixture not found at ${FIXTURE_PATH}`);
    console.error("   Create a PDF at fixtures/sample-deck.pdf and re-run.");
    process.exit(1);
  }

  const cookie = process.env.SMOKE_AUTH_COOKIE ?? "";
  if (!cookie) {
    console.error("Set SMOKE_AUTH_COOKIE=<your-supabase-session-cookie>");
    process.exit(1);
  }

  // Get startup_id from the logged-in user's first startup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${cookie}` },
  });
  if (!userRes.ok) { console.error("Could not get user from Supabase"); process.exit(1); }
  const userData = await userRes.json();

  const startupRes = await fetch(`${supabaseUrl}/rest/v1/startups?owner_id=eq.${userData.id}&select=id,name&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${cookie}` },
  });
  const startups = await startupRes.json();
  if (!startups?.[0]) { console.error("No startup found for this user"); process.exit(1); }

  const startup = startups[0];
  console.log(`\n📤 Uploading sample-deck.pdf for startup: ${startup.name} (${startup.id})`);

  const fd = new FormData();
  fd.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "sample-deck.pdf");
  fd.append("startup_id", startup.id);
  fd.append("consent_evaluation", "true");
  fd.append("consent_public_profile", "true");
  fd.append("consent_internal_use", "true");

  const uploadRes = await fetch(`${APP_URL}/api/decks/upload`, {
    method: "POST",
    headers: { Cookie: `sb-access-token=${cookie}` },
    body: fd,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    console.error(`❌ Upload failed: ${uploadData.error}`);
    process.exit(1);
  }

  console.log(`✅ Uploaded. Deck ID: ${uploadData.deck_id}`);
  await pollStatus(uploadData.deck_id, `sb-access-token=${cookie}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
