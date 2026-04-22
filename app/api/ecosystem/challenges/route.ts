import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Json } from "@/lib/supabase/types";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  objective_type: z.enum([
    "referred_in_vertical",
    "referred_in_region",
    "referred_top10",
    "validations_in_vertical",
  ] as const),
  objective_params: z.record(z.string(), z.unknown()),
  duration_days: z.number().int().min(1).max(90),
  prize_structure: z.record(z.string(), z.number()),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("challenges")
    .select("id, title, description, objective_type, objective_params, duration_days, prize_structure, status, voting_starts_at, voting_ends_at, active_starts_at, active_ends_at, created_at")
    .in("status", ["voting", "approved", "active"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ challenges: data ?? [] });
}

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

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      objective_type: parsed.data.objective_type,
      objective_params: parsed.data.objective_params as unknown as Json,
      duration_days: parsed.data.duration_days,
      prize_structure: parsed.data.prize_structure as unknown as Json,
      proposed_by_org_id: org.id,
      status: "draft" as const,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
