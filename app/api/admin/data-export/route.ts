import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { auditAction } from "@/lib/admin/audit";
import type { Json } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { scope, filters } = await req.json() as { scope: string; filters: Record<string, unknown> };

  const service = createServiceClient();

  const { data: exportRow, error } = await service
    .from("dataset_exports")
    .insert({
      admin_id: user.id,
      scope,
      filters: filters as Json,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !exportRow) return NextResponse.json({ error: error?.message ?? "DB error" }, { status: 500 });

  // Trigger edge function async
  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dataset-exporter`;
  const secret = process.env.SUPABASE_EDGE_FN_SECRET ?? "laliga-dev-secret-32chars-local1";

  fetch(fnUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${secret}` },
    body: JSON.stringify({ export_id: exportRow.id }),
  }).catch(() => {});

  await auditAction({
    adminId: user.id,
    actionType: "dataset_exported",
    targetType: "dataset_exports",
    targetId: exportRow.id,
    payload: { scope, filters } as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true, export_id: exportRow.id });
}
