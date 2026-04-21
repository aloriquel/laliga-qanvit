import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const admin = createServiceClient();

  const { error } = await admin
    .from("profiles")
    .update({
      consented_at: new Date().toISOString(),
      consent_ip: ip,
      consent_user_agent: userAgent,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }

  // Audit trail — uses user's own profile id as actor
  await admin.from("admin_audit_log").insert({
    admin_id: user.id,
    action_type: "consent_given",
    target_type: "user",
    target_id: user.id,
    notes: `IP: ${ip ?? "unknown"}`,
  });

  return NextResponse.json({ ok: true });
}
