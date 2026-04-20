"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Challenge = {
  id: string;
  title: string;
  description: string;
  status: string;
  voting_starts_at: string | null;
  voting_ends_at: string | null;
  active_starts_at: string | null;
  active_ends_at: string | null;
  prize_structure: unknown;
  duration_days: number;
  created_at: string;
  votes?: { count: number }[];
  progress?: { org_id: string; count: number }[];
};

const TABS = [
  { key: "draft", label: "Drafts" },
  { key: "voting", label: "En votación" },
  { key: "active", label: "Activos" },
  { key: "completed", label: "Completados" },
  { key: "cancelled", label: "Cancelados" },
] as const;

export default function ChallengeAdminTabs({ challenges }: { challenges: Challenge[] }) {
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("draft");
  const [loading, setLoading] = useState<string | null>(null);
  const [showPrize, setShowPrize] = useState<Challenge | null>(null);
  const router = useRouter();

  const filtered = challenges.filter((c) =>
    tab === "draft" ? c.status === "draft" :
    tab === "voting" ? c.status === "voting" :
    tab === "active" ? c.status === "active" :
    tab === "completed" ? c.status === "completed" :
    c.status === "cancelled"
  );

  async function action(id: string, act: string) {
    setLoading(id + act);
    const res = await fetch(`/api/admin/challenges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else alert("Error.");
  }

  async function distributePrizes(challenge: Challenge) {
    setLoading(challenge.id + "prizes");
    const res = await fetch(`/api/admin/challenges/${challenge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "distribute_prizes" }),
    });
    setLoading(null);
    if (res.ok) { setShowPrize(null); router.refresh(); }
    else alert("Error al distribuir premios.");
  }

  return (
    <>
      <div className="flex gap-1 border-b border-border-soft">
        {TABS.map((t) => {
          const count = challenges.filter((c) =>
            t.key === "draft" ? c.status === "draft" :
            t.key === "voting" ? c.status === "voting" :
            t.key === "active" ? c.status === "active" :
            t.key === "completed" ? c.status === "completed" :
            c.status === "cancelled"
          ).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 font-body text-sm border-b-2 transition-colors ${tab === t.key ? "border-brand-salmon text-brand-navy font-semibold" : "border-transparent text-ink-secondary hover:text-brand-navy"}`}>
              {t.label} {count > 0 && <span className="ml-1 bg-brand-lavender text-brand-navy text-xs rounded-full px-1.5">{count}</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="font-body text-sm text-ink-secondary bg-white rounded-xl border border-border-soft px-4 py-6 text-center">
          Sin retos en este estado.
        </p>
      ) : (
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/50">
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Título</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Estado</th>
                {tab === "voting" && <th className="text-left px-4 py-3 font-semibold text-brand-navy">Votos</th>}
                {tab === "active" && <th className="text-left px-4 py-3 font-semibold text-brand-navy">Progreso</th>}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filtered.map((c) => {
                const voteCount = (c.votes ?? []).reduce((s, v) => s + (v.count ?? 0), 0);
                return (
                  <tr key={c.id} className="hover:bg-brand-lavender/20">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-navy">{c.title}</p>
                      <p className="text-xs text-ink-secondary line-clamp-1">{c.description}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary hidden md:table-cell capitalize">{c.status}</td>
                    {tab === "voting" && <td className="px-4 py-3 font-sora font-bold text-brand-navy">{voteCount}</td>}
                    {tab === "active" && (
                      <td className="px-4 py-3 text-ink-secondary">
                        {(c.progress ?? []).length} orgs participando
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {tab === "draft" && (
                          <button onClick={() => action(c.id, "approve_voting")}
                            disabled={loading === c.id + "approve_voting"}
                            className="bg-brand-navy text-white font-body text-xs px-3 py-1.5 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50">
                            {loading === c.id + "approve_voting" ? "…" : "Aprobar para votación"}
                          </button>
                        )}
                        {tab === "voting" && (
                          <button onClick={() => action(c.id, "activate")}
                            disabled={loading === c.id + "activate"}
                            className="bg-brand-navy text-white font-body text-xs px-3 py-1.5 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50">
                            {loading === c.id + "activate" ? "…" : "Activar"}
                          </button>
                        )}
                        {tab === "active" && (
                          <button onClick={() => action(c.id, "cancel")}
                            disabled={loading === c.id + "cancel"}
                            className="border border-red-300 text-red-600 font-body text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">
                            {loading === c.id + "cancel" ? "…" : "Cancelar"}
                          </button>
                        )}
                        {tab === "completed" && (
                          <button onClick={() => setShowPrize(c)}
                            className="bg-brand-salmon text-white font-body text-xs px-3 py-1.5 rounded-lg hover:bg-brand-salmon/90">
                            Distribuir premios
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPrize && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-sora font-bold text-brand-navy text-lg">Distribuir premios</h3>
            <p className="font-body text-sm text-brand-navy">{showPrize.title}</p>
            <div className="bg-brand-lavender/30 rounded-lg p-3">
              <p className="font-body text-sm font-semibold text-brand-navy mb-1">Estructura de premios:</p>
              <pre className="font-mono text-xs text-ink-secondary">{JSON.stringify(showPrize.prize_structure, null, 2)}</pre>
            </div>
            <p className="font-body text-sm text-ink-secondary">
              Se distribuirán puntos según el progreso de cada organización al momento de confirmar.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPrize(null)}
                className="border border-border-soft font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-lavender/30">
                Cancelar
              </button>
              <button onClick={() => distributePrizes(showPrize)}
                disabled={loading === showPrize.id + "prizes"}
                className="bg-brand-navy text-white font-body text-sm px-4 py-2 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50">
                {loading === showPrize.id + "prizes" ? "Distribuyendo…" : "Confirmar distribución"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
