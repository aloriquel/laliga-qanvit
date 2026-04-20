import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";

export default async function AlertasPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!org) redirect("/ecosistema/aplicar");

  const { data: alerts } = await supabase
    .from("ecosystem_new_startup_alerts")
    .select("id, startup_id, matched_reason, email_sent, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: config } = await supabase
    .from("ecosystem_alerts_config")
    .select("verticals, regions, frequency, email_enabled")
    .eq("org_id", org.id)
    .maybeSingle();

  // Mark all as email_sent so they clear the badge
  const serviceClient = createServiceClient();
  await serviceClient
    .from("ecosystem_new_startup_alerts")
    .update({ email_sent: true })
    .eq("org_id", org.id)
    .eq("email_sent", false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora text-2xl font-bold text-brand-navy">Alertas de startups</h1>
          <p className="font-body text-ink-secondary mt-1">Nuevas startups que coinciden con tus filtros.</p>
        </div>
        <Link
          href="/ecosistema/dashboard/configuracion"
          className="flex items-center gap-2 px-4 py-2.5 border border-border-soft rounded-xl font-body text-sm text-ink-secondary hover:bg-brand-lavender transition-colors"
        >
          <Settings size={14} />
          Configurar
        </Link>
      </div>

      {/* Config summary */}
      {config && (
        <div className="bg-brand-lavender rounded-2xl p-4">
          <div className="flex flex-wrap gap-3 text-sm font-body">
            <span className="text-ink-secondary">Frecuencia: <strong className="text-brand-navy capitalize">{config.frequency}</strong></span>
            <span className="text-ink-secondary">Email: <strong className="text-brand-navy">{config.email_enabled ? "Sí" : "No"}</strong></span>
            {config.verticals.length > 0 && (
              <span className="text-ink-secondary">Verticales: <strong className="text-brand-navy">{config.verticals.join(", ")}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {!alerts || alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-soft p-12 text-center">
          <Bell size={32} className="text-brand-salmon mx-auto mb-3" />
          <p className="font-body text-ink-secondary">No hay alertas todavía.</p>
          <p className="font-body text-xs text-ink-secondary mt-1">
            Configura tus verticales y regiones para recibir notificaciones.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-soft overflow-hidden">
          <ul className="divide-y divide-border-soft">
            {alerts.map((a) => (
              <li key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-salmon shrink-0" />
                  <div>
                    <p className="font-body text-sm font-medium text-brand-navy">Nueva startup registrada</p>
                    <p className="font-body text-xs text-ink-secondary mt-0.5">{a.matched_reason}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-body text-xs text-ink-secondary">
                    {new Date(a.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                  </p>
                  <Link
                    href={`/ecosistema/dashboard/startups`}
                    className="text-brand-salmon text-xs font-semibold font-body hover:underline"
                  >
                    Ver →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
