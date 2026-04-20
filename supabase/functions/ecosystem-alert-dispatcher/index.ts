import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPECTED_SECRET = Deno.env.get("ECOSYSTEM_ALERT_SECRET") ?? "laliga-dev-secret-32chars-local1";

Deno.serve(async (req) => {
  // Validate bearer token
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${EXPECTED_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { evaluation_id?: string; startup_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { evaluation_id, startup_id } = body;
  if (!evaluation_id || !startup_id) {
    return new Response(JSON.stringify({ error: "evaluation_id and startup_id required" }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Load the startup to get vertical and region
  const { data: startup, error: startupErr } = await supabase
    .from("startups")
    .select("id, current_vertical, location_region")
    .eq("id", startup_id)
    .single();

  if (startupErr || !startup) {
    return new Response(JSON.stringify({ error: "Startup not found" }), { status: 404 });
  }

  // Find ecosystem orgs with matching alert config
  const { data: configs } = await supabase
    .from("ecosystem_alerts_config")
    .select("org_id, verticals, regions");

  if (!configs || configs.length === 0) {
    return new Response(JSON.stringify({ ok: true, notified: 0 }));
  }

  const inserts: Array<{
    org_id: string;
    startup_id: string;
    matched_reason: string;
  }> = [];

  for (const config of configs) {
    const verticalMatch =
      config.verticals.length === 0 ||
      (startup.current_vertical && config.verticals.includes(startup.current_vertical));

    const regionMatch =
      config.regions.length === 0 ||
      (startup.location_region && config.regions.some((r: string) =>
        startup.location_region!.toLowerCase().includes(r.toLowerCase())
      ));

    if (!verticalMatch && !regionMatch) continue;

    const reason = verticalMatch && startup.current_vertical
      ? `vertical:${startup.current_vertical}`
      : `region:${startup.location_region}`;

    inserts.push({ org_id: config.org_id, startup_id: startup.id, matched_reason: reason });
  }

  if (inserts.length > 0) {
    await supabase
      .from("ecosystem_new_startup_alerts")
      .upsert(inserts, { onConflict: "org_id,startup_id", ignoreDuplicates: true });
  }

  return new Response(JSON.stringify({ ok: true, notified: inserts.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
