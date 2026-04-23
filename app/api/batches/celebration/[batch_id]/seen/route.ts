import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: Request,
  { params }: { params: { batch_id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: startup } = await service
    .from("startups")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!startup) return NextResponse.json({ error: "No startup" }, { status: 404 });

  const { error } = await service
    .from("batch_celebrations")
    .update({ seen_modal_at: new Date().toISOString() })
    .eq("batch_id", params.batch_id)
    .eq("startup_id", startup.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
