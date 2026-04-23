import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();

  const { data: batch } = await service
    .from("batches")
    .select("id, slug, status")
    .eq("id", params.id)
    .single();

  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  if (!["active", "closed"].includes(batch.status)) {
    return NextResponse.json(
      { error: `Batch has status '${batch.status}'; only active or closed batches can be processed.` },
      { status: 409 }
    );
  }

  const { error } = await service.rpc("close_batch_and_assign_winners", {
    target_batch_id: params.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, batch_slug: batch.slug });
}
