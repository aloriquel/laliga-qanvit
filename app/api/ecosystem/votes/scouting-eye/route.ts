import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeScoutingEye } from "@/lib/ecosystem/votes-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const metrics = await computeScoutingEye(org.id);
  return NextResponse.json(metrics);
}
