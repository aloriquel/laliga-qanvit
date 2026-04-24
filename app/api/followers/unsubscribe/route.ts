import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl}/legal/baja-exitosa`);
  }

  const service = createServiceClient();
  await service
    .from("startup_followers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .is("unsubscribed_at", null);

  return NextResponse.redirect(`${appUrl}/legal/baja-exitosa`);
}

export const GET = handle;
// RFC 8058 one-click List-Unsubscribe-Post requires POST too.
export const POST = handle;
