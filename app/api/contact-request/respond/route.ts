import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendContactRequestAcceptedEmail } from "@/lib/emails/send";

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

  // When accepted: email the org with the startup founder's contact email
  if (action === "accepted") {
    try {
      const { data: cr } = await serviceClient
        .from("contact_requests")
        .select("from_org_id, to_startup_id")
        .eq("id", request.id)
        .single();

      if (cr) {
        const [{ data: org }, { data: startup }] = await Promise.all([
          serviceClient.from("ecosystem_organizations").select("name, owner_id").eq("id", cr.from_org_id).single(),
          serviceClient.from("startups").select("name, owner_id").eq("id", cr.to_startup_id).single(),
        ]);

        if (org && startup) {
          const [{ data: orgOwner }, { data: founderProfile }] = await Promise.all([
            serviceClient.from("profiles").select("email").eq("id", org.owner_id).single(),
            serviceClient.from("profiles").select("email").eq("id", startup.owner_id).single(),
          ]);

          if (orgOwner?.email && founderProfile?.email) {
            await sendContactRequestAcceptedEmail(orgOwner.email, {
              orgName: org.name,
              startupName: startup.name,
              founderEmail: founderProfile.email,
            });
          }
        }
      }
    } catch (err) {
      console.error("[contact-respond] email failed:", (err as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}
