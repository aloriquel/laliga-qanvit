import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";
import { z } from "zod";
import type { Database } from "@/lib/supabase/types";

type ChallengeStatus = Database["public"]["Enums"]["challenge_status"];

const patchSchema = z.union([
  z.object({
    action: z.enum(["approve_voting", "activate", "cancel", "distribute_prizes"]),
  }),
  z.object({
    status: z.enum(["draft", "voting", "approved", "active", "completed", "cancelled"]),
    admin_notes: z.string().optional(),
    voting_starts_at: z.string().optional(),
    voting_ends_at: z.string().optional(),
    active_starts_at: z.string().optional(),
    active_ends_at: z.string().optional(),
  }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = createServiceClient();
  const challengeId = params.id;
  const now = new Date().toISOString();

  if ("action" in parsed.data) {
    const { action } = parsed.data;

    if (action === "approve_voting") {
      const votingEnds = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      await service.from("challenges").update({
        status: "voting" as ChallengeStatus,
        voting_starts_at: now,
        voting_ends_at: votingEnds,
        updated_at: now,
      }).eq("id", challengeId);
      await auditAction({ adminId: user.id, actionType: "challenge_approved_voting", targetType: "challenges", targetId: challengeId });
      return NextResponse.json({ ok: true });
    }

    if (action === "activate") {
      const { data: ch } = await service.from("challenges").select("duration_days").eq("id", challengeId).single();
      const activeEnds = new Date(Date.now() + (ch?.duration_days ?? 30) * 24 * 3600 * 1000).toISOString();
      await service.from("challenges").update({
        status: "active" as ChallengeStatus,
        active_starts_at: now,
        active_ends_at: activeEnds,
        updated_at: now,
      }).eq("id", challengeId);
      await auditAction({ adminId: user.id, actionType: "challenge_activated", targetType: "challenges", targetId: challengeId });
      return NextResponse.json({ ok: true });
    }

    if (action === "cancel") {
      await service.from("challenges").update({ status: "cancelled" as ChallengeStatus, updated_at: now }).eq("id", challengeId);
      await auditAction({ adminId: user.id, actionType: "challenge_cancelled", targetType: "challenges", targetId: challengeId });
      return NextResponse.json({ ok: true });
    }

    if (action === "distribute_prizes") {
      const { data: ch } = await service.from("challenges").select("prize_structure, status").eq("id", challengeId).single();
      if (!ch || ch.status !== "completed") return NextResponse.json({ error: "Challenge not completed" }, { status: 400 });

      const prizeMap = ch.prize_structure as Record<string, number>;

      const { data: progress } = await service
        .from("challenge_progress")
        .select("org_id, count")
        .eq("challenge_id", challengeId)
        .order("count", { ascending: false });

      const winners = progress ?? [];
      let totalPoints = 0;
      const inserts = winners.slice(0, 3).map((w, i) => {
        const pts = prizeMap[String(i + 1)] ?? 0;
        totalPoints += pts;
        return {
          org_id: w.org_id,
          event_type: "admin_grant" as const,
          points: pts,
          metadata: { challenge_id: challengeId, position: i + 1 } as Record<string, unknown>,
          notes: `Premio reto — posición ${i + 1}`,
          granted_by: user.id,
        };
      }).filter((i) => i.points > 0);

      if (inserts.length > 0) {
        await service.from("ecosystem_points_log").insert(inserts as never);
      }

      await auditAction({
        adminId: user.id,
        actionType: "challenge_prizes_distributed",
        targetType: "challenges",
        targetId: challengeId,
        payload: { winners: inserts.length, total_points: totalPoints },
      });

      return NextResponse.json({ ok: true, winners: inserts.length, totalPoints });
    }
  }

  // legacy direct status patch
  const { error } = await service
    .from("challenges")
    .update({ ...(parsed.data as object), updated_at: now } as never)
    .eq("id", challengeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
