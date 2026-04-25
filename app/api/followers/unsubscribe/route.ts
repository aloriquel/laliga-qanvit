import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
  const token = req.nextUrl.searchParams.get("token");
  // Propagate from_slug and days_subscribed from the email link to the
  // success page so the analytics tracker can emit them.
  const fromSlug = req.nextUrl.searchParams.get("from_slug") ?? "";
  const days = req.nextUrl.searchParams.get("days") ?? "";

  const successQs = new URLSearchParams();
  if (fromSlug) successQs.set("from_slug", fromSlug);
  if (days) successQs.set("days", days);
  const successUrl = successQs.toString()
    ? `${appUrl}/legal/baja-exitosa?${successQs}`
    : `${appUrl}/legal/baja-exitosa`;

  if (!token) {
    return NextResponse.redirect(successUrl);
  }

  const service = createServiceClient();
  await service
    .from("startup_followers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .is("unsubscribed_at", null);

  return NextResponse.redirect(successUrl);
}

export const GET = handle;
// RFC 8058 one-click List-Unsubscribe-Post requires POST too.
export const POST = handle;
