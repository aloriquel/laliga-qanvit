import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getTierWeight } from "@/lib/ecosystem/votes-helpers";
import type { Database } from "@/lib/supabase/types";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];

export const dynamic = "force-dynamic";

const PostSchema = z.object({
  startup_id: z.string().uuid(),
  vote_type: z.enum(["up", "down"]),
  reason: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = PostSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }
  const { startup_id, vote_type, reason } = body.data;

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "No tienes organización de ecosistema" }, { status: 403 });

  const { data: totals } = await supabase
    .from("ecosystem_totals")
    .select("tier")
    .eq("org_id", org.id)
    .maybeSingle();
  const tier: Tier = (totals?.tier as Tier) ?? "rookie";

  if (vote_type === "down" && (tier === "pro" || tier === "elite")) {
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({
        error: "reason_required_for_down_vote_pro_elite",
        message: "Los votos negativos de orgs Pro o Elite requieren una razón de al menos 10 caracteres.",
      }, { status: 400 });
    }
  }

  const service = createServiceClient();

  // Call eligibility check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eligibility, error: eligErr } = await (service as any).rpc(
    "check_startup_vote_eligibility",
    { p_org_id: org.id, p_startup_id: startup_id }
  ) as { data: Record<string, unknown> | null; error: unknown };

  if (eligErr || !eligibility) {
    return NextResponse.json({ error: "Error comprobando elegibilidad" }, { status: 500 });
  }

  if (!eligibility.eligible) {
    return NextResponse.json({
      error: eligibility.reason,
      previous_vote: eligibility.previous_vote ?? null,
      next_eligible_at: eligibility.next_eligible_at ?? null,
    }, { status: 400 });
  }

  const weight = getTierWeight(tier);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vote, error: insertErr } = await (service as any)
    .from("startup_votes")
    .insert({
      startup_id,
      org_id: org.id,
      user_id: user.id,
      vote_type,
      weight,
      tier_at_vote: tier,
      reason: reason?.trim() ?? null,
    })
    .select()
    .single() as { data: Record<string, unknown> | null; error: unknown };

  if (insertErr || !vote) {
    const msg = (insertErr as { message?: string })?.message ?? "Error al registrar voto";
    if (msg.includes("vote_not_eligible")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: momentum } = await service
    .from("startup_momentum" as never)
    .select("momentum_score, up_count, down_count, distinct_voters")
    .eq("startup_id", startup_id)
    .maybeSingle() as { data: Record<string, unknown> | null };

  return NextResponse.json({ vote, momentum }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "No tienes organización de ecosistema" }, { status: 403 });

  const startup_id = req.nextUrl.searchParams.get("startup_id");
  if (!startup_id) return NextResponse.json({ error: "startup_id requerido" }, { status: 400 });

  const service = createServiceClient();
  const { data: vote } = await service
    .from("startup_votes" as never)
    .select("id, vote_type, created_at, weight, reason")
    .eq("org_id", org.id)
    .eq("startup_id", startup_id)
    .gte("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() as { data: Record<string, unknown> | null };

  return NextResponse.json({ vote: vote ?? null });
}
