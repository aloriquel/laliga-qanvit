import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const status   = sp.get("status") ?? "pending";
  const severity = sp.get("severity");
  const page     = Math.max(1, Number(sp.get("page") ?? 1));
  const perPage  = Math.min(50, Number(sp.get("per_page") ?? 20));

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (service as any)
    .from("admin_evaluator_discrepancies")
    .select("*, startup:startups(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (status !== "all") query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, per_page: perPage });
}
