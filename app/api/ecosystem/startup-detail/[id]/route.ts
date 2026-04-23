import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: totals } = await supabase
    .from("ecosystem_totals")
    .select("tier")
    .eq("org_id", org.id)
    .maybeSingle();

  const tier = totals?.tier ?? "rookie";
  if (tier === "rookie") {
    return NextResponse.json({ error: "Upgrade to Pro to view startup details" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: startup } = await (supabase as any)
    .from("startups")
    .select("id, name, logo_url, location_region, region_ca, region_province, founded_year, website")
    .eq("id", params.id)
    .maybeSingle();

  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: standing } = await supabase
    .from("league_standings")
    .select("current_vertical, current_division, current_score, rank_national, rank_division")
    .eq("startup_id", params.id)
    .maybeSingle();

  let feedbackSummary: string | null = null;
  const { data: lastEval } = await supabase
    .from("evaluations")
    .select("summary")
    .eq("startup_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  feedbackSummary = lastEval?.summary ?? null;

  return NextResponse.json({
    id: startup.id,
    name: startup.name,
    logo_url: startup.logo_url ?? null,
    vertical: standing?.current_vertical ?? "",
    division: standing?.current_division ?? "",
    score: standing?.current_score ?? 0,
    rank_national: standing?.rank_national ?? 0,
    rank_division: standing?.rank_division ?? 0,
    region: startup.location_region,
    region_ca: startup.region_ca ?? null,
    region_province: startup.region_province ?? null,
    founded_year: startup.founded_year,
    website: startup.website,
    feedback_summary: feedbackSummary,
  });
}
