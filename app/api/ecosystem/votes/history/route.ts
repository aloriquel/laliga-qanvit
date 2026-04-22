import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  const service = createServiceClient();
  const { data: votes, count } = await service
    .from("startup_votes" as never)
    .select("id, startup_id, vote_type, weight, tier_at_vote, reason, created_at, startups(name, slug, current_score, current_division)", { count: "exact" })
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1) as { data: Record<string, unknown>[] | null; count: number | null };

  const items = (votes ?? []).map((v) => {
    const startup = v.startups as Record<string, unknown> | null;
    return {
      id: v.id,
      vote_type: v.vote_type,
      weight: v.weight,
      tier_at_vote: v.tier_at_vote,
      reason: v.reason,
      created_at: v.created_at,
      startup_id: v.startup_id,
      startup_name: startup?.name ?? null,
      startup_slug: startup?.slug ?? null,
      startup_current_score: startup?.current_score ?? null,
      startup_division: startup?.current_division ?? null,
    };
  });

  return NextResponse.json({ votes: items, total: count ?? 0, page, per_page: limit });
}
