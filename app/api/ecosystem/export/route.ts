import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateCsv } from "@/lib/ecosystem/csv-generator";
import { TIER_LIMITS } from "@/lib/ecosystem/points-helpers";
import type { Database } from "@/lib/supabase/types";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const tier = (totals?.tier ?? "rookie") as Tier;
  const maxRows = TIER_LIMITS[tier].csvRowsPerMonth;

  if (maxRows === 0) {
    return NextResponse.json({ error: "Actualiza a Pro para exportar CSV" }, { status: 403 });
  }

  // Check monthly usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: exports } = await supabase
    .from("ecosystem_csv_exports")
    .select("rows_count")
    .eq("org_id", org.id)
    .gte("created_at", startOfMonth.toISOString());

  const usedRows = (exports ?? []).reduce((acc, e) => acc + e.rows_count, 0);
  const remaining = maxRows - usedRows;

  if (remaining <= 0) {
    return NextResponse.json({ error: `Límite mensual de ${maxRows} filas alcanzado` }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const vertical = body.vertical ?? null;
  const division = body.division ?? null;

  let query = supabase
    .from("league_standings")
    .select("name, current_vertical, current_division, current_score, rank_national, rank_division")
    .order("rank_national", { ascending: true })
    .limit(remaining);

  if (vertical) query = query.eq("current_vertical", vertical);
  if (division) query = query.eq("current_division", division);

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = generateCsv(rows ?? []);
  const rowCount = rows?.length ?? 0;

  const serviceClient = createServiceClient();
  await serviceClient.from("ecosystem_csv_exports").insert({
    org_id: org.id,
    rows_count: rowCount,
    tier_at_export: tier,
    filters_json: { vertical, division },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="startups_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
