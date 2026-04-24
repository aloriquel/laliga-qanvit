import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { extractIp, hashIp, isValidEmail } from "@/lib/followers/hash";
import { sendFollowerConfirmationEmail } from "@/lib/emails/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRMATION_TTL_DAYS = 7;

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  let body: { email?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidEmail(body.email) || body.consent !== true) {
    return NextResponse.json({ error: "Missing email or consent" }, { status: 400 });
  }
  const email = (body.email as string).trim();

  // Supabase types have not been regenerated for the new follower tables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any;

  const { data: startup } = await service
    .from("startups")
    .select("id, name, is_public, consent_public_profile")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!startup || !startup.is_public || !startup.consent_public_profile) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
  const ip = extractIp(req);
  const ipHashSecret = process.env.ANON_VOTE_HMAC_SECRET;
  const ipHash = ipHashSecret ? hashIp(ip, ipHashSecret) : null;

  const { data: existing } = await service
    .from("startup_followers")
    .select("id, email_verified_at, unsubscribed_at, unsubscribe_token")
    .eq("startup_id", startup.id)
    .eq("email", email)
    .maybeSingle();

  const newConfirmation = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let followerId: string;
  let unsubscribeToken: string;

  if (!existing) {
    const { data: inserted, error } = await service
      .from("startup_followers")
      .insert({
        startup_id: startup.id,
        email,
        confirmation_token: newConfirmation,
        confirmation_expires_at: expiresAt,
        source: "vote_modal",
        ip_hash: ipHash,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      })
      .select("id, unsubscribe_token")
      .single();
    if (error || !inserted) {
      return NextResponse.json({ error: "Follow failed" }, { status: 500 });
    }
    followerId = inserted.id;
    unsubscribeToken = inserted.unsubscribe_token;
  } else if (existing.email_verified_at && !existing.unsubscribed_at) {
    return NextResponse.json({ status: "already_subscribed" });
  } else {
    // Either (a) pending confirmation or (b) previously unsubscribed — re-issue token.
    const { error } = await service
      .from("startup_followers")
      .update({
        email_verified_at: null,
        unsubscribed_at: null,
        confirmation_token: newConfirmation,
        confirmation_expires_at: expiresAt,
      })
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: "Follow failed" }, { status: 500 });
    }
    followerId = existing.id;
    unsubscribeToken = existing.unsubscribe_token;
  }

  const confirmationUrl = `${appUrl}/api/followers/confirm?token=${encodeURIComponent(newConfirmation)}&slug=${encodeURIComponent(params.slug)}`;
  const unsubscribeUrl = `${appUrl}/api/followers/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

  try {
    await sendFollowerConfirmationEmail(email, {
      startupName: startup.name,
      confirmationUrl,
      unsubscribeUrl,
    });
  } catch (err) {
    console.error("[follow] confirmation email failed:", (err as Error).message);
    // Still return confirmation_sent — the row exists, Arturo can retry.
  }

  void followerId;
  return NextResponse.json({ status: "confirmation_sent" });
}
