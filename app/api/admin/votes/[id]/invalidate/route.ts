import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const voteId = params.id;

  const { error } = await (service as any)
    .from("startup_votes")
    .delete()
    .eq("id", voteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditAction({
    adminId: user.id,
    actionType: "vote_invalidated",
    targetType: "startup_vote",
    targetId: voteId,
  });

  return NextResponse.json({ ok: true });
}
