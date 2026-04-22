import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("public_startup_momentum" as never)
    .select("startup_id, momentum_score, up_count, down_count, distinct_voters, last_vote_at")
    .eq("startup_id", params.id)
    .maybeSingle() as { data: Record<string, unknown> | null };

  if (!data) return NextResponse.json(null);
  return NextResponse.json(data);
}
