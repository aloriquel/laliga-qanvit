import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Database } from "@/lib/supabase/types";

type ChallengeStatus = Database["public"]["Enums"]["challenge_status"];

const patchSchema = z.object({
  status: z.enum(["draft", "voting", "approved", "active", "completed", "cancelled"]),
  admin_notes: z.string().optional(),
  voting_starts_at: z.string().optional(),
  voting_ends_at: z.string().optional(),
  active_starts_at: z.string().optional(),
  active_ends_at: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("challenges")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
