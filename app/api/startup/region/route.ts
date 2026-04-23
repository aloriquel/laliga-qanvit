import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProvinceForCa, CA_ID_SET, type CaId } from "@/lib/spain-regions";

export async function PATCH(req: NextRequest) {
  const prefix = "[startup-region]";
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { region_ca, region_province } = body as {
    region_ca?: string | null;
    region_province?: string | null;
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const ca = region_ca ?? null;
  const province = region_province ?? null;

  if (ca === null && province !== null) {
    return NextResponse.json(
      { error: "Debes seleccionar CA y provincia." },
      { status: 422 }
    );
  }
  if (ca !== null && province === null) {
    return NextResponse.json(
      { error: "Debes seleccionar CA y provincia." },
      { status: 422 }
    );
  }
  if (ca !== null && !CA_ID_SET.has(ca)) {
    return NextResponse.json(
      { error: "Comunidad Autónoma no válida." },
      { status: 422 }
    );
  }
  if (ca !== null && province !== null && !isValidProvinceForCa(province, ca as CaId)) {
    return NextResponse.json(
      { error: "Provincia no válida para la CA seleccionada." },
      { status: 422 }
    );
  }

  // ── Ownership check ───────────────────────────────────────────────────────
  const { data: startup } = await supabase
    .from("startups")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!startup) return NextResponse.json({ error: "Startup not found" }, { status: 404 });

  // ── Update ────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from("startups")
    .update({ region_ca: ca, region_province: province })
    .eq("id", startup.id);

  if (dbErr) {
    console.error(`${prefix} DB update failed:`, dbErr.message);
    return NextResponse.json({ error: "Error al guardar la región." }, { status: 500 });
  }

  console.log(`${prefix} Region updated for startup ${startup.id}: ${ca} / ${province}`);
  return NextResponse.json({ region_ca: ca, region_province: province });
}
