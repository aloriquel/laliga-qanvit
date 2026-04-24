import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { extractIp, hashIp } from "@/lib/followers/hash";
import { checkAnonVoteRateLimit } from "@/lib/followers/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const secret = process.env.ANON_VOTE_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const ip = extractIp(req);
  const rl = await checkAnonVoteRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const service = createServiceClient();

  const { data: startup } = await service
    .from("startups")
    .select("id, is_public, consent_public_profile")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!startup || !startup.is_public || !startup.consent_public_profile) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }

  const ipHash = hashIp(ip, secret);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { error: insertErr } = await service
    .from("anonymous_startup_votes")
    .insert({
      startup_id: startup.id,
      ip_hash: ipHash,
      user_agent: userAgent,
    });

  let already = false;
  if (insertErr) {
    const code = (insertErr as { code?: string }).code;
    if (code === "23505") {
      already = true;
    } else {
      return NextResponse.json({ error: "Vote failed" }, { status: 500 });
    }
  }

  const { data: countRow } = await service.rpc("get_anon_vote_count", { p_startup_id: startup.id });
  const count = typeof countRow === "number" ? countRow : 0;

  return NextResponse.json({ voted: true, already, count });
}
