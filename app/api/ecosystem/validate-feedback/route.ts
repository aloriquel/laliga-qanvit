import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  evaluation_id: z.string().uuid(),
  is_positive: z.boolean(),
  comment: z.string().max(500).optional(),
});

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

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  // Upsert — one validation per org per evaluation
  const { error } = await supabase
    .from("feedback_validations")
    .upsert({
      org_id: org.id,
      evaluation_id: parsed.data.evaluation_id,
      is_positive: parsed.data.is_positive,
      comment: parsed.data.comment ?? null,
    }, { onConflict: "org_id,evaluation_id" });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya has validado esta evaluación" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Grant points for validation (service client to bypass RLS)
  const serviceClient = createServiceClient();
  await serviceClient
    .from("ecosystem_points_log")
    .insert({
      org_id: org.id,
      event_type: "feedback_validated",
      points: 25,
      reference_evaluation_id: parsed.data.evaluation_id,
    });

  return NextResponse.json({ ok: true }, { status: 201 });
}
