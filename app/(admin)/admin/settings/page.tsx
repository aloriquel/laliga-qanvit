import { getAllSettings } from "@/lib/admin/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import TestEmailSection from "@/components/admin/TestEmailSection";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, supabase] = [await getAllSettings(), createClient()];
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("email").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="space-y-8">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Configuración global</h1>

      <div className="bg-white border border-border-soft rounded-2xl p-6">
        <SettingsForm settings={settings} />
      </div>

      <div className="bg-white border border-border-soft rounded-2xl p-6">
        <div className="mb-5">
          <h2 className="font-sora font-semibold text-brand-navy text-lg">Test de emails transaccionales</h2>
          <p className="font-body text-sm text-ink-secondary mt-1">
            Envía un email de prueba con datos mock para verificar que Resend está configurado correctamente.
            Cada test queda registrado en el audit log.
          </p>
        </div>
        <TestEmailSection adminEmail={profile?.email ?? ""} />
      </div>
    </div>
  );
}
