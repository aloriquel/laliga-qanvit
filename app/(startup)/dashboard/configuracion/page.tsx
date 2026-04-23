import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import PrivacyToggles from "./PrivacyToggles";
import NotificationSettings from "./NotificationSettings";
import DeleteAccountSection from "./DeleteAccountSection";
import LogoSection from "./LogoSection";
import RegionSection from "./RegionSection";
import FundingSection from "./FundingSection";
import type { CaId } from "@/lib/spain-regions";
import type { FundingStage } from "@/lib/funding-stage";

export const metadata: Metadata = { title: "Configuración — Dashboard" };
export const revalidate = 0;

export default async function ConfiguracionPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/play");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: startup } = await (supabase as any)
    .from("startups")
    .select("id, name, logo_url, is_public, consent_public_profile, consent_public_deck, show_public_timeline, notification_email_enabled, notification_frequency, region_ca, region_province, funding_stage, funding_stage_inferred, is_raising")
    .eq("owner_id", user.id)
    .single();

  if (!startup) redirect("/play");

  return (
    <div className="pb-20 md:pb-0 max-w-2xl">
      <h1 className="font-sora font-bold text-2xl text-brand-navy mb-8">Configuración</h1>

      {/* Logo de la startup */}
      <section className="mb-8" id="logo">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-1">Logo de la startup</h2>
        <p className="font-body text-sm text-ink-secondary mb-4">
          Aparece en el leaderboard, tu perfil público y las cartas compartibles.
        </p>
        <LogoSection
          initialLogoUrl={startup.logo_url ?? null}
          startupName={startup.name ?? "Startup"}
        />
      </section>

      <div className="border-t border-border-soft my-6" />

      {/* Ubicación */}
      <section className="mb-8" id="region">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-1">Ubicación</h2>
        <p className="font-body text-sm text-ink-secondary mb-4">
          Aparece en tu perfil público. Permite a futuro filtrar y destacar startups por región.
        </p>
        <RegionSection
          initialCa={(startup.region_ca as CaId | null) ?? null}
          initialProvince={(startup.region_province as string | null) ?? null}
        />
      </section>

      <div className="border-t border-border-soft my-6" />

      {/* Fase de financiación */}
      <section className="mb-8" id="funding-stage">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-1">Fase de financiación</h2>
        <p className="font-body text-sm text-ink-secondary mb-4">
          Fuente primaria para asignar tu división en la liga. Solo tú puedes confirmarlo.
        </p>
        <FundingSection
          initialFundingStage={(startup.funding_stage as FundingStage | null) ?? null}
          initialIsRaising={(startup.is_raising as boolean) ?? false}
          initialInferred={(startup.funding_stage_inferred as boolean) ?? false}
        />
      </section>

      <div className="border-t border-border-soft my-6" />

      {/* Privacy */}
      <section className="mb-8">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-1">Perfil público</h2>
        <p className="font-body text-sm text-ink-secondary mb-4">Controla qué ve el ecosistema sobre ti.</p>
        <PrivacyToggles startup={startup} />
      </section>

      <div className="border-t border-border-soft my-6" />

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-1">Notificaciones</h2>
        <p className="font-body text-sm text-ink-secondary mb-4">Alertas de cambios de posición.</p>
        <NotificationSettings startup={startup} />
      </section>

      <div className="border-t border-border-soft my-6" />

      {/* Data & Privacy */}
      <section className="mb-8">
        <h2 className="font-sora font-semibold text-lg text-brand-navy mb-1">Datos y privacidad</h2>
        <div className="flex flex-col gap-3">
          <a
            href="/legal/privacidad"
            className="font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors underline underline-offset-2"
          >
            Política de privacidad →
          </a>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-brand-navy">Descargar mis datos</p>
              <p className="font-body text-xs text-ink-secondary">Incluye startup, evaluaciones y chunks.</p>
            </div>
            <button
              disabled
              title="Disponible próximamente"
              className="bg-brand-lavender text-ink-secondary font-body text-sm rounded-xl px-4 py-2 opacity-60 cursor-not-allowed"
            >
              Próximamente
            </button>
          </div>
        </div>
      </section>

      <div className="border-t border-border-soft my-6" />

      {/* Danger zone */}
      <section>
        <h2 className="font-sora font-semibold text-lg text-red-600 mb-1">Zona de peligro</h2>
        <DeleteAccountSection />
      </section>
    </div>
  );
}
