import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setSetting } from "@/lib/admin/settings";
import { auditAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, value } = await req.json() as { key: string; value: string };
  if (!key || value === undefined) return NextResponse.json({ error: "Missing key or value" }, { status: 400 });

  // Try to parse as number/bool, otherwise keep as string
  let parsed: unknown = value;
  if (!isNaN(Number(value)) && value.trim() !== "") parsed = Number(value);
  else if (value === "true") parsed = true;
  else if (value === "false") parsed = false;

  await setSetting(key, parsed, user.id);
  await auditAction({ adminId: user.id, actionType: "setting_updated", targetType: "admin_settings", payload: { key, value: parsed } });
  return NextResponse.json({ ok: true });
}
