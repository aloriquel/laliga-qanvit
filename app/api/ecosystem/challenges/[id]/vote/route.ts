import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, status")
    .eq("id", params.id)
    .eq("status", "voting")
    .maybeSingle();

  if (!challenge) return NextResponse.json({ error: "Reto no encontrado o no en votación" }, { status: 404 });

  const { data: canVote } = await supabase
    .rpc("check_challenge_vote_rate_limit", { p_org_id: org.id });

  if (!canVote) {
    return NextResponse.json({ error: "Límite de votos alcanzado (3 por semana)" }, { status: 429 });
  }

  const { error } = await supabase
    .from("challenge_votes")
    .insert({ challenge_id: params.id, org_id: org.id });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya has votado este reto" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
