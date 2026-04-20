import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  action: z.enum(["accepted", "declined"]),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { token, action } = parsed.data;

  const serviceClient = createServiceClient();
  const { data: request, error } = await serviceClient
    .from("contact_requests")
    .update({ status: action, responded_at: new Date().toISOString() })
    .eq("respond_token", token)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ error: "Token inválido o ya respondido" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
