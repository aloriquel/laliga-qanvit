import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBatchWinnerEmail } from "@/lib/emails/send";
import { getCaById, type CaId } from "@/lib/spain-regions";

export const runtime = "nodejs";
export const maxDuration = 60;

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation", seed: "Seed", growth: "Growth", elite: "Elite",
};
const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI", robotics_automation: "Robotics & Automation",
  mobility: "Mobility", energy_cleantech: "Energy & Cleantech", agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech", industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace", materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

function categoryLabel(category: string, segmentKey: string | null): string {
  switch (category) {
    case "national_top1": return "🏆 Campeón Nacional";
    case "national_top2": return "🥈 Subcampeón Nacional";
    case "national_top3": return "🥉 Tercero Nacional";
    case "division_top1":
      return `🏆 Campeón División ${segmentKey ? DIVISION_LABELS[segmentKey] ?? segmentKey : ""}`;
    case "region_ca_top1":
      return `🏆 Campeón ${segmentKey ? getCaById(segmentKey as CaId)?.name ?? segmentKey : ""}`;
    case "vertical_top1":
      return `🏆 Campeón ${segmentKey ? VERTICAL_LABELS[segmentKey] ?? segmentKey : ""}`;
    default: return "🏆 Ganador";
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Fetch pending celebrations (no email_sent_at yet)
  const { data: pending, error: fetchErr } = await service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("batch_celebrations" as any)
    .select("id, startup_id, batch_id")
    .is("email_sent_at", null)
    .limit(50);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (pending ?? []) as any[];
  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, errors: 0, message: "No pending emails" });
  }

  let sent = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const [{ data: startup }, { data: batch }, { data: winners }] = await Promise.all([
        service
          .from("startups")
          .select("id, name, slug, owner_id")
          .eq("id", row.startup_id)
          .maybeSingle(),
        service
          .from("batches")
          .select("id, slug, display_name")
          .eq("id", row.batch_id)
          .maybeSingle(),
        service
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("batch_winners" as any)
          .select("category, segment_key, final_score")
          .eq("batch_id", row.batch_id)
          .eq("startup_id", row.startup_id),
      ]);

      if (!startup || !batch || !winners || (winners as unknown[]).length === 0) {
        throw new Error("Missing startup/batch/winners");
      }

      // Lookup owner email via auth.users → profiles
      const { data: authUser } = await service.auth.admin.getUserById(startup.owner_id as string);
      const to = authUser?.user?.email;
      if (!to) throw new Error("Owner email not found");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wArr = winners as any[];
      const categories = wArr.map((w) => categoryLabel(w.category, w.segment_key));
      const maxScore = Math.max(...wArr.map((w) => Number(w.final_score)), 0);

      await sendBatchWinnerEmail(to, {
        startupName: startup.name,
        startupSlug: startup.slug,
        batchDisplayName: batch.display_name,
        batchSlug: batch.slug,
        categories,
        finalScore: maxScore,
      });

      await service
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("batch_celebrations" as any)
        .update({ email_sent_at: new Date().toISOString(), email_error: null })
        .eq("id", row.id);
      sent += 1;
    } catch (e) {
      errors += 1;
      const msg = e instanceof Error ? e.message : String(e);
      await service
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("batch_celebrations" as any)
        .update({ email_error: msg })
        .eq("id", row.id);
    }
  }

  return NextResponse.json({ sent, errors, total: rows.length });
}
