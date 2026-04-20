import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();
  const { data: exportRow } = await service
    .from("dataset_exports")
    .select("storage_path, status")
    .eq("id", params.id)
    .single();

  if (!exportRow || exportRow.status !== "completed" || !exportRow.storage_path) {
    return NextResponse.json({ error: "Export not ready" }, { status: 404 });
  }

  const { data: signedUrl } = await service.storage
    .from("exports")
    .createSignedUrl(exportRow.storage_path.replace("exports/", ""), 86400);

  if (!signedUrl?.signedUrl) return NextResponse.json({ error: "Could not generate URL" }, { status: 500 });

  return NextResponse.redirect(signedUrl.signedUrl);
}
