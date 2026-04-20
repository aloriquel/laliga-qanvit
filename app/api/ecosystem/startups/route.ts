import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Vertical = Database["public"]["Enums"]["startup_vertical"];
type Division = Database["public"]["Enums"]["league_division"];

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

  const params = req.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const vertical = params.get("vertical") ?? "";
  const division = params.get("division") ?? "";
  const offset = parseInt(params.get("offset") ?? "0");
  const limit = Math.min(parseInt(params.get("limit") ?? "20"), 50);

  let query = supabase
    .from("league_standings")
    .select("startup_id, name, current_vertical, current_division, current_score, rank_national, rank_division")
    .order("rank_national", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike("name", `%${q}%`);
  if (vertical) query = query.eq("current_vertical", vertical as Vertical);
  if (division) query = query.eq("current_division", division as Division);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data ?? [] });
}
