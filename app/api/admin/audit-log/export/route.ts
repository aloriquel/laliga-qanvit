import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();
  const { data: logs } = await service
    .from("admin_audit_log")
    .select("id, action_type, target_type, target_id, reason, created_at")
    .order("created_at", { ascending: false });

  const header = "id,action_type,target_type,target_id,reason,created_at\n";
  const rows = (logs ?? []).map((l) =>
    [l.id, l.action_type, l.target_type, l.target_id ?? "", (l.reason ?? "").replace(/,/g, ";"), l.created_at].join(",")
  ).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
