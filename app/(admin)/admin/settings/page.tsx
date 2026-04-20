import { getAllSettings } from "@/lib/admin/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAllSettings();

  return (
    <div className="space-y-6">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Configuración global</h1>
      <div className="bg-white border border-border-soft rounded-2xl p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
