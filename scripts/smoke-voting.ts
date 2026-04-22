/**
 * Smoke test for the startup voting API.
 * Run with: APP_URL=http://localhost:3000 npx tsx scripts/smoke-voting.ts
 *
 * Requires: a valid ecosystem org session cookie (COOKIE env var) and a known startup slug.
 */

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const COOKIE = process.env.COOKIE ?? "";
const STARTUP_ID = process.env.STARTUP_ID ?? ""; // UUID of a startup to vote on

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Cookie: COOKIE,
      ...opts.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function run() {
  console.log("=== Smoke: startup voting ===\n");

  if (!STARTUP_ID) {
    console.error("Set STARTUP_ID env var to a valid startup UUID");
    process.exit(1);
  }

  // 1. Check eligibility (GET existing vote)
  console.log("1. GET existing vote for startup...");
  const check = await api(`/api/ecosystem/votes?startup_id=${STARTUP_ID}`);
  console.log(`   Status: ${check.status}`, check.body);

  // 2. Cast up vote
  console.log("\n2. POST up vote...");
  const vote = await api("/api/ecosystem/votes", {
    method: "POST",
    body: JSON.stringify({ startup_id: STARTUP_ID, vote_type: "up" }),
  });
  console.log(`   Status: ${vote.status}`, vote.body);

  // 3. Try to vote again (should get error: already_voted_90d)
  console.log("\n3. POST up vote again (expect 409 already_voted)...");
  const duplicate = await api("/api/ecosystem/votes", {
    method: "POST",
    body: JSON.stringify({ startup_id: STARTUP_ID, vote_type: "up" }),
  });
  console.log(`   Status: ${duplicate.status}`, duplicate.body);
  if (duplicate.status === 409) console.log("   ✓ Duplicate vote correctly blocked");
  else console.log("   ✗ Expected 409");

  // 4. Scouting eye
  console.log("\n4. GET scouting eye...");
  const eye = await api("/api/ecosystem/votes/scouting-eye");
  console.log(`   Status: ${eye.status}`, eye.body);

  // 5. Vote history
  console.log("\n5. GET vote history...");
  const history = await api("/api/ecosystem/votes/history");
  console.log(`   Status: ${history.status}`, { count: Array.isArray(history.body.votes) ? history.body.votes.length : "?" });

  // 6. Public momentum
  console.log("\n6. GET public startup momentum...");
  const momentum = await api(`/api/public/startup-momentum/${STARTUP_ID}`);
  console.log(`   Status: ${momentum.status}`, momentum.body);

  console.log("\n=== Done ===");
}

run().catch(console.error);
