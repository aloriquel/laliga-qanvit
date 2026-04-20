import { createServiceClient } from "@/lib/supabase/server";
import AppealActions from "@/components/admin/AppealActions";

export const dynamic = "force-dynamic";

export default async function EvaluationAppealsPage() {
  const supabase = createServiceClient();

  const { data: appeals } = await supabase
    .from("evaluation_appeals")
    .select("id, reason, requested_division, requested_vertical, status, created_at, evaluation:evaluations(id, score_total, assigned_division, assigned_vertical), startup:startups(name, slug)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Impugnaciones</h1>
        <span className="font-body text-sm text-ink-secondary">{appeals?.length ?? 0} pendientes</span>
      </div>

      {!appeals || appeals.length === 0 ? (
        <p className="font-body text-sm text-ink-secondary bg-white rounded-xl border border-border-soft px-4 py-6 text-center">
          Nada pendiente. Buen trabajo.
        </p>
      ) : (
        <div className="space-y-4">
          {appeals.map((ap) => {
            const startup = ap.startup as { name?: string; slug?: string } | null;
            const ev = ap.evaluation as { id?: string; score_total?: number; assigned_division?: string; assigned_vertical?: string } | null;
            return (
              <div key={ap.id} className="bg-white border border-border-soft rounded-2xl p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="font-sora font-bold text-brand-navy text-lg">{startup?.name ?? "Startup"}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-body">
                      <p><span className="text-ink-secondary">Evaluación actual:</span> {ev?.assigned_division} · {ev?.assigned_vertical?.replace(/_/g, " ")} · {Number(ev?.score_total ?? 0).toFixed(1)} pts</p>
                      <p><span className="text-ink-secondary">Solicita:</span> {ap.requested_division ?? "—"} · {ap.requested_vertical?.replace(/_/g, " ") ?? "—"}</p>
                    </div>
                    <div className="bg-brand-lavender/30 rounded-lg p-3">
                      <p className="font-body text-sm text-brand-navy">{ap.reason}</p>
                    </div>
                    <p className="font-body text-xs text-ink-secondary">
                      {new Date(ap.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <AppealActions
                    appealId={ap.id}
                    evalId={ev?.id ?? ""}
                    startupName={startup?.name ?? ""}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
