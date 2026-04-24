import { NextResponse } from "next/server";
import { getEcosystemOrgForCurrentUser } from "@/lib/ecosystem/owner";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getEcosystemOrgForCurrentUser();
  if (!ctx) {
    return NextResponse.json({ org: null }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  return NextResponse.json(
    { org: { orgType: ctx.orgType, orgName: ctx.orgName } },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
