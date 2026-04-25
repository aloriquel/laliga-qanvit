import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
  const token = req.nextUrl.searchParams.get("token");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!token) {
    return NextResponse.redirect(`${appUrl}/legal/suscripcion-expirada`);
  }

  const service = createServiceClient();

  const { data: follower } = await service
    .from("startup_followers")
    .select("id, startup_id, confirmation_expires_at, created_at")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (!follower) {
    return NextResponse.redirect(`${appUrl}/legal/suscripcion-expirada`);
  }

  const expiresAt = follower.confirmation_expires_at ? new Date(follower.confirmation_expires_at).getTime() : 0;
  if (!expiresAt || expiresAt < Date.now()) {
    return NextResponse.redirect(`${appUrl}/legal/suscripcion-expirada`);
  }

  const { error } = await service
    .from("startup_followers")
    .update({
      email_verified_at: new Date().toISOString(),
      confirmation_token: null,
      confirmation_expires_at: null,
    })
    .eq("id", follower.id);
  if (error) {
    return NextResponse.redirect(`${appUrl}/legal/suscripcion-expirada`);
  }

  let targetSlug = slug;
  if (!targetSlug) {
    const { data: startup } = await service
      .from("startups")
      .select("slug")
      .eq("id", follower.startup_id)
      .maybeSingle();
    targetSlug = startup?.slug ?? null;
  }

  // Hours between when the follower row was created (sign-up) and the
  // moment they clicked the confirmation link. Used by the analytics
  // tracker on the redirect target.
  let hoursToConfirm = 0;
  if (follower.created_at) {
    const createdAtMs = new Date(follower.created_at).getTime();
    if (Number.isFinite(createdAtMs)) {
      hoursToConfirm = Math.max(
        0,
        Math.round((Date.now() - createdAtMs) / 3_600_000)
      );
    }
  }

  const target = targetSlug
    ? `${appUrl}/startup/${targetSlug}?subscribed=1&hours=${hoursToConfirm}`
    : `${appUrl}/liga`;
  return NextResponse.redirect(target);
}
