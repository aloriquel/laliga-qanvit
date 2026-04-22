import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_IDS = 50;

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = req.nextUrl.searchParams.get("startup_ids") ?? "";
  const startupIds = raw.split(",").map((s) => s.trim()).filter(Boolean);

  if (startupIds.length === 0) {
    return NextResponse.json({ votes: {}, momentum: {} });
  }
  if (startupIds.length > MAX_IDS) {
    return NextResponse.json(
      { error: "too_many_ids", message: `Máximo ${MAX_IDS} startup_ids por request.` },
      { status: 400 }
    );
  }

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!org) return NextResponse.json({ votes: {}, momentum: {} });

  const service = createServiceClient();
  const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

  // Votes for this org on the requested startups in the last 90 days
  const { data: rawVotes } = await (service as any)
    .from("startup_votes")
    .select("startup_id, vote_type, created_at, weight")
    .eq("org_id", org.id)
    .in("startup_id", startupIds)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false }) as { data: Array<{ startup_id: string; vote_type: string; created_at: string; weight: number }> | null };

  // Deduplicate: keep latest vote per startup
  const votes: Record<string, { vote_type: "up" | "down"; created_at: string } | null> = {};
  for (const id of startupIds) votes[id] = null;
  for (const v of rawVotes ?? []) {
    if (!votes[v.startup_id]) {
      votes[v.startup_id] = { vote_type: v.vote_type as "up" | "down", created_at: v.created_at };
    }
  }

  // Momentum for the requested startups (public materialized view)
  const { data: rawMomentum } = await (service as any)
    .from("startup_momentum")
    .select("startup_id, momentum_score, up_count, down_count, distinct_voters, last_vote_at")
    .in("startup_id", startupIds) as {
      data: Array<{
        startup_id: string;
        momentum_score: number;
        up_count: number;
        down_count: number;
        distinct_voters: number;
        last_vote_at: string | null;
      }> | null;
    };

  const momentum: Record<string, { momentum_score: number; up_count: number; down_count: number; distinct_voters: number; last_vote_at: string | null } | null> = {};
  for (const id of startupIds) momentum[id] = null;
  for (const m of rawMomentum ?? []) {
    momentum[m.startup_id] = {
      momentum_score: m.momentum_score,
      up_count: m.up_count,
      down_count: m.down_count,
      distinct_voters: m.distinct_voters,
      last_vote_at: m.last_vote_at,
    };
  }

  return NextResponse.json({ votes, momentum });
}
