import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export async function getSetting(key: string): Promise<unknown> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function getAllSettings() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("key, value, description, updated_at")
    .order("key");
  return data ?? [];
}

export async function setSetting(key: string, value: unknown, adminId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("admin_settings")
    .upsert({ key, value: value as Json, updated_by: adminId, updated_at: new Date().toISOString() });
}
