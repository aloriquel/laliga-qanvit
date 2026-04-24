"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Search, Lock, ChevronDown } from "lucide-react";
import StartupDetailModal from "@/components/ecosystem/StartupDetailModal";
import StartupVoteControl from "@/components/ecosystem/StartupVoteControl";
import EcosystemMomentumBadge from "@/components/ecosystem/EcosystemMomentumBadge";
import type { Database } from "@/lib/supabase/types";

type Tier = Database["public"]["Enums"]["ecosystem_tier"];
type LeagueStanding = {
  startup_id: string | null;
  name: string | null;
  current_vertical: Database["public"]["Enums"]["startup_vertical"] | null;
  current_division: Database["public"]["Enums"]["league_division"] | null;
  current_score: number | null;
  rank_national: number | null;
  rank_division: number | null;
};

type VoteRecord = { vote_type: "up" | "down"; created_at: string };
type MomentumData = {
  momentum_score: number;
  up_count: number;
  down_count: number;
  distinct_voters: number;
  last_vote_at: string | null;
};

type Props = {
  orgId: string;
  tier: Tier;
};

const VERTICALS = [
  "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech",
  "agrifood", "healthtech_medtech", "industrial_manufacturing",
  "space_aerospace", "materials_chemistry", "cybersecurity",
];

export default function StartupSearch({ orgId, tier }: Props) {
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState("");
  const [division, setDivision] = useState("");
  const [results, setResults] = useState<LeagueStanding[]>([]);
  const [loading, startSearch] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [voteMap, setVoteMap] = useState<Record<string, VoteRecord | null>>({});
  const [momentumMap, setMomentumMap] = useState<Record<string, MomentumData | null>>({});

  const canViewDetails = tier !== "rookie";

  // Fetch votes + momentum for all visible startups in one batch call
  const batchFetchRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const ids = results.map((r) => r.startup_id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    batchFetchRef.current?.abort();
    const ctrl = new AbortController();
    batchFetchRef.current = ctrl;

    fetch(`/api/ecosystem/votes/batch?startup_ids=${ids.join(",")}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { votes?: Record<string, VoteRecord | null>; momentum?: Record<string, MomentumData | null> }) => {
        if (d.votes) setVoteMap((prev) => ({ ...prev, ...d.votes }));
        if (d.momentum) setMomentumMap((prev) => ({ ...prev, ...d.momentum }));
      })
      .catch(() => null);

    return () => ctrl.abort();
  }, [results]);

  async function search(reset = true) {
    startSearch(async () => {
      const nextOffset = reset ? 0 : results.length;
      const params = new URLSearchParams({
        q: query,
        vertical,
        division,
        offset: String(nextOffset),
        limit: "20",
      });
      const res = await fetch(`/api/ecosystem/startups?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const batch: LeagueStanding[] = data.results ?? [];
      setHasMore(batch.length === 20);
      if (reset) {
        setResults(batch);
        return;
      }
      setResults((prev) => {
        const seen = new Set(prev.map((r) => r.startup_id));
        const extras = batch.filter(
          (r) => r.startup_id && !seen.has(r.startup_id)
        );
        return [...prev, ...extras];
      });
    });
  }

  function handleVoteCast(startupId: string, voteType: "up" | "down", momentumScore: number) {
    setVoteMap((prev) => ({
      ...prev,
      [startupId]: { vote_type: voteType, created_at: new Date().toISOString() },
    }));
    setMomentumMap((prev) => ({
      ...prev,
      [startupId]: prev[startupId]
        ? { ...prev[startupId]!, momentum_score: momentumScore }
        : { momentum_score: momentumScore, up_count: voteType === "up" ? 1 : 0, down_count: voteType === "down" ? 1 : 0, distinct_voters: 1, last_vote_at: new Date().toISOString() },
    }));
  }

  const selectedStartup = selectedId ? results.find((r) => r.startup_id === selectedId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Startups</h1>
        <p className="font-body text-ink-secondary mt-1">
          Explora el ranking de startups.{" "}
          {tier === "rookie" && (
            <span className="text-brand-salmon font-semibold">
              Sube a Pro (+1000 pts) para ver detalles completos.
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-soft bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          />
        </div>
        <div className="relative">
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-border-soft bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/30"
          >
            <option value="">Todos los verticales</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary pointer-events-none" />
        </div>
        <button
          onClick={() => search()}
          disabled={loading}
          className="px-5 py-2.5 bg-brand-navy text-white rounded-xl font-body text-sm font-semibold hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border-soft overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/50">
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Startup</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Vertical</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">División</th>
                <th className="text-right px-4 py-3 font-semibold text-brand-navy">Score</th>
                <th className="text-right px-4 py-3 font-semibold text-brand-navy">#Nac</th>
                <th className="text-center px-3 py-3 font-semibold text-brand-navy hidden lg:table-cell">Momentum</th>
                <th className="text-center px-3 py-3 font-semibold text-brand-navy">Voto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {results.map((s) => {
                const sid = s.startup_id ?? "";
                return (
                  <tr key={sid} className="hover:bg-brand-lavender/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-navy">{s.name}</td>
                    <td className="px-4 py-3 text-ink-secondary hidden md:table-cell capitalize">
                      {s.current_vertical?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary hidden md:table-cell capitalize">
                      {s.current_division ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-sora font-bold text-brand-navy">
                      {s.current_score?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-secondary">
                      #{s.rank_national ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell">
                      {sid ? (
                        <EcosystemMomentumBadge
                          startupId={sid}
                          variant="compact"
                          initialMomentum={momentumMap[sid]}
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      {sid ? (
                        <StartupVoteControl
                          startupId={sid}
                          startupName={s.name ?? ""}
                          currentOrgTier={tier}
                          currentVote={voteMap[sid] ?? undefined}
                          onVoteCast={(voteType, momentumScore) =>
                            handleVoteCast(sid, voteType, momentumScore)
                          }
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canViewDetails ? (
                        <button
                          onClick={() => sid && setSelectedId(sid)}
                          className="text-brand-salmon text-xs font-semibold hover:underline whitespace-nowrap"
                        >
                          Ver →
                        </button>
                      ) : (
                        <span title="Sube a Pro para ver el detalle completo">
                          <Lock size={14} className="text-ink-secondary/40 ml-auto" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hasMore && (
            <div className="px-4 py-3 border-t border-border-soft text-center">
              <button
                onClick={() => search(false)}
                disabled={loading}
                className="text-brand-salmon text-sm font-semibold font-body hover:underline disabled:opacity-50"
              >
                Cargar más
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-soft p-12 text-center">
          <p className="font-body text-ink-secondary">Usa la búsqueda para encontrar startups.</p>
        </div>
      )}

      {selectedId && selectedStartup && (
        <StartupDetailModal
          startupId={selectedId}
          startupName={selectedStartup.name ?? ""}
          orgId={orgId}
          tier={tier}
          currentVote={voteMap[selectedId] ?? null}
          onVoteCast={(voteType, momentumScore) =>
            handleVoteCast(selectedId, voteType, momentumScore)
          }
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
