import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";
import { sendContactRequestToStartupEmail } from "@/lib/emails/send";

const schema = z.object({
  startup_id: z.string().uuid(),
  message: z.string().min(10).max(1000),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: totals } = await supabase
    .from("ecosystem_totals")
    .select("tier")
    .eq("org_id", org.id)
    .maybeSingle();

  if (totals?.tier !== "elite") {
    return NextResponse.json({ error: "Requiere tier Elite" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { startup_id, message } = parsed.data;

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, owner_id, consent_direct_contact")
    .eq("id", startup_id)
    .maybeSingle();

  if (!startup) return NextResponse.json({ error: "Startup no encontrada" }, { status: 404 });
  if (!startup.consent_direct_contact) return NextResponse.json({ error: "Startup no acepta contacto directo" }, { status: 403 });

  // Monthly rate limit
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("contact_requests")
    .select("id", { count: "exact", head: true })
    .eq("from_org_id", org.id)
    .gte("created_at", startOfMonth.toISOString());

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "Límite mensual de solicitudes alcanzado" }, { status: 429 });
  }

  const respondToken = crypto.randomBytes(32).toString("hex");

  const serviceClient = createServiceClient();
  const { data: request, error } = await serviceClient
    .from("contact_requests")
    .insert({ from_org_id: org.id, to_startup_id: startup_id, message, respond_token: respondToken })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email the startup owner about the incoming contact request
  try {
    const { data: orgData } = await serviceClient.from("ecosystem_organizations").select("name").eq("id", org.id).single();
    const { data: ownerProfile } = await serviceClient.from("profiles").select("email").eq("id", startup.owner_id).single();
    if (ownerProfile?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com";
      await sendContactRequestToStartupEmail(ownerProfile.email, {
        startupName: startup.name ?? startup.id,
        orgName: orgData?.name ?? "Un parque/clúster",
        message,
        respondUrl: `${appUrl}/api/contact-request/respond-page?token=${respondToken}`,
      });
    }
  } catch (err) {
    console.error("[contact-request] email failed:", (err as Error).message);
  }

  return NextResponse.json({ id: request.id }, { status: 201 });
}
