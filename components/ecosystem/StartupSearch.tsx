"use client";

import { useState, useTransition } from "react";
import { Search, Lock, ChevronDown } from "lucide-react";
import { TIER_LIMITS } from "@/lib/ecosystem/points-helpers";
import StartupDetailModal from "@/components/ecosystem/StartupDetailModal";
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
  const [page, setPage] = useState(0);

  const canViewDetails = tier !== "rookie";
  const limit = TIER_LIMITS[tier].startupDetailUnlocks;

  async function search(reset = true) {
    startSearch(async () => {
      const params = new URLSearchParams({
        q: query,
        vertical,
        division,
        offset: String(reset ? 0 : page * 20),
        limit: "20",
      });
      const res = await fetch(`/api/ecosystem/startups?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (reset) {
        setResults(data.results);
        setPage(0);
      } else {
        setResults((prev) => [...prev, ...data.results]);
        setPage((p) => p + 1);
      }
    });
  }

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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {results.map((s) => (
                <tr key={s.startup_id} className="hover:bg-brand-lavender/30 transition-colors">
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
                  <td className="px-4 py-3 text-right text-ink-secondary">#{s.rank_national ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {canViewDetails ? (
                      <button
                        onClick={() => s.startup_id && setSelectedId(s.startup_id)}
                        className="text-brand-salmon text-xs font-semibold hover:underline"
                      >
                        Ver
                      </button>
                    ) : (
                      <Lock size={14} className="text-ink-secondary ml-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border-soft text-center">
            <button
              onClick={() => search(false)}
              disabled={loading}
              className="text-brand-salmon text-sm font-semibold font-body hover:underline disabled:opacity-50"
            >
              Cargar más
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-soft p-12 text-center">
          <p className="font-body text-ink-secondary">Usa la búsqueda para encontrar startups.</p>
        </div>
      )}

      {selectedId && (
        <StartupDetailModal
          startupId={selectedId}
          orgId={orgId}
          tier={tier}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
