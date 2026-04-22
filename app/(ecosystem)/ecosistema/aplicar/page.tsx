import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EcoApplicationForm from "./EcoApplicationForm";

export default async function EcosistemaAplicarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/ecosistema/aplicar");
  }

  // If org already exists for this user, redirect to dashboard
  const { data: existingOrg } = await supabase
    .from("ecosystem_organizations")
    .select("id, is_verified")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingOrg?.is_verified) {
    redirect("/ecosistema/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const userEmail = profile?.email ?? user.email ?? "";

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-lg">
        <div className="mb-8">
          <p className="font-mono text-brand-navy/40 text-sm tracking-widest uppercase mb-3">
            {"{ ecosistema }"}
          </p>
          <h1 className="font-sora font-bold text-3xl text-brand-navy">
            Únete como ecosistema
          </h1>
          <p className="font-body text-ink-secondary mt-2 text-sm">
            Parques, clusters y asociaciones de innovación. Accede al mapa de
            startups españolas contribuyendo al ecosistema.
          </p>
        </div>

        {existingOrg && !existingOrg.is_verified ? (
          <div className="bg-white rounded-card shadow-card border border-border-soft p-8 text-center flex flex-col items-center gap-4">
            <p className="font-sora font-semibold text-brand-navy">Solicitud pendiente de revisión</p>
            <p className="font-body text-sm text-ink-secondary">
              Ya tienes una solicitud enviada. Revisaremos tu caso y te contactaremos en 24-48h en{" "}
              <strong>{userEmail}</strong>.
            </p>
          </div>
        ) : (
          <EcoApplicationForm userEmail={userEmail} />
        )}

        <div className="mt-8 bg-white/60 rounded-card border border-border-soft p-6">
          <h3 className="font-sora font-semibold text-sm text-brand-navy mb-3">
            ¿Qué ocurre después?
          </h3>
          <ol className="flex flex-col gap-2 font-body text-xs text-ink-secondary list-decimal list-inside space-y-1">
            <li>Revisamos tu solicitud (24-48h).</li>
            <li>Te enviamos tu código de referral único y acceso al dashboard.</li>
            <li>
              Empiezas como <strong>Rookie</strong> y subes de tier contribuyendo:
              refiriendo startups, validando feedback.
            </li>
            <li>Cuanto más contribuyes, más datos desbloqueas.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
