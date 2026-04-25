"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";

import StatusBadge from "./StatusBadge";
import ResultBadge from "./ResultBadge";

export type CatalogRecipient = {
  id: string;
  company_name: string;
  company_description_short: string | null;
  edition_year: number;
  category_type: string;
  category_value: string;
  result: "winner" | "finalist";
  current_status: "active" | "acquired" | "closed" | "pivoted" | "unknown";
  is_spanish_ecosystem?: boolean;
  company_country?: string | null;
};

export type AwardCatalogProps = {
  recipients: CatalogRecipient[];
  /** True when the award has scope='global'; surfaces the international toggle. */
  awardIsGlobal?: boolean;
};

type SortKey = "year_desc" | "year_asc" | "name_asc" | "name_desc";

const STATUS_OPTIONS: Array<{ key: CatalogRecipient["current_status"]; label: string }> = [
  { key: "active", label: "Activa" },
  { key: "acquired", label: "Adquirida" },
  { key: "closed", label: "Cerrada" },
  { key: "pivoted", label: "Pivotó" },
  { key: "unknown", label: "Sin verificar" },
];

const CATEGORY_LABELS: Record<string, string> = {
  regional: "Regional",
  challenge: "Reto",
  accesit: "Accésit",
  trajectory: "Trayectoria",
  special: "Especial",
};

function parseList(qp: string | null): string[] {
  if (!qp) return [];
  return qp.split(",").map((s) => s.trim()).filter(Boolean);
}

function serializeList(values: string[]): string | null {
  if (values.length === 0) return null;
  return values.join(",");
}

export default function AwardCatalog({
  recipients,
  awardIsGlobal = false,
}: AwardCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // For global awards, default to Spanish-only. The toggle lets the user
  // include the international cohort. URL key: ?intl=1.
  const [showIntl, setShowIntl] = useState<boolean>(false);

  // ── Catalog meta ─────────────────────────────────────────────────
  const allYears = useMemo(
    () => Array.from(new Set(recipients.map((r) => r.edition_year))).sort((a, b) => b - a),
    [recipients]
  );
  const allCategories = useMemo(() => {
    const present = new Set(recipients.map((r) => r.category_type));
    return ["regional", "challenge", "accesit", "trajectory", "special"].filter((c) =>
      present.has(c)
    );
  }, [recipients]);

  // ── State (synced to URL) ────────────────────────────────────────
  const [years, setYears] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("year_desc");

  useEffect(() => {
    setYears(parseList(searchParams?.get("year") ?? null));
    setCats(parseList(searchParams?.get("cat") ?? null));
    setResults(parseList(searchParams?.get("result") ?? null));
    setStatuses(parseList(searchParams?.get("status") ?? null));
    setShowIntl(searchParams?.get("intl") === "1");
    const s = searchParams?.get("sort");
    if (s === "year_asc" || s === "name_asc" || s === "name_desc" || s === "year_desc") {
      setSort(s);
    }
  }, [searchParams]);

  const updateUrl = useCallback(
    (next: { years?: string[]; cats?: string[]; results?: string[]; statuses?: string[]; sort?: SortKey; intl?: boolean }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      const set = (k: string, v: string | null) => {
        if (v == null) params.delete(k);
        else params.set(k, v);
      };
      if (next.years !== undefined) set("year", serializeList(next.years));
      if (next.cats !== undefined) set("cat", serializeList(next.cats));
      if (next.results !== undefined) set("result", serializeList(next.results));
      if (next.statuses !== undefined) set("status", serializeList(next.statuses));
      if (next.sort !== undefined) set("sort", next.sort === "year_desc" ? null : next.sort);
      if (next.intl !== undefined) set("intl", next.intl ? "1" : null);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function clearAll() {
    setYears([]); setCats([]); setResults([]); setStatuses([]);
    updateUrl({ years: [], cats: [], results: [], statuses: [], sort: "year_desc" });
  }

  // ── Filter + sort ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return recipients.filter((r) => {
      if (awardIsGlobal && !showIntl && r.is_spanish_ecosystem === false) {
        return false;
      }
      if (years.length && !years.includes(String(r.edition_year))) return false;
      if (cats.length && !cats.includes(r.category_type)) return false;
      if (results.length && !results.includes(r.result)) return false;
      if (statuses.length && !statuses.includes(r.current_status)) return false;
      return true;
    });
  }, [recipients, years, cats, results, statuses, awardIsGlobal, showIntl]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort) {
        case "year_asc":
          if (a.edition_year !== b.edition_year) return a.edition_year - b.edition_year;
          return a.company_name.localeCompare(b.company_name, "es");
        case "name_asc":
          return a.company_name.localeCompare(b.company_name, "es");
        case "name_desc":
          return b.company_name.localeCompare(a.company_name, "es");
        case "year_desc":
        default:
          if (a.edition_year !== b.edition_year) return b.edition_year - a.edition_year;
          if (a.result !== b.result) return a.result === "winner" ? -1 : 1;
          return a.company_name.localeCompare(b.company_name, "es");
      }
    });
    return arr;
  }, [filtered, sort]);

  const groupedByYear = useMemo(() => {
    if (sort !== "year_desc" && sort !== "year_asc") return null;
    const grouped: Record<number, CatalogRecipient[]> = {};
    for (const r of sorted) {
      grouped[r.edition_year] = grouped[r.edition_year] ?? [];
      grouped[r.edition_year].push(r);
    }
    const orderedYears = Object.keys(grouped).map(Number);
    orderedYears.sort((a, b) => (sort === "year_desc" ? b - a : a - b));
    return { grouped, orderedYears };
  }, [sorted, sort]);

  const hasFilters = years.length + cats.length + results.length + statuses.length > 0;

  // Smooth-scroll a hash #YYYY al cargar (con offset por header sticky).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash) return;
    const h = window.location.hash.slice(1);
    if (!/^\d{4}$/.test(h)) return;
    const target = document.getElementById(h);
    if (!target) return;
    const offset = 80;
    const y = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  return (
    <>
      {/* Filters bar */}
      <div className="sticky top-16 z-30 -mx-4 md:mx-0 px-4 md:px-0 py-4 mb-6 backdrop-blur-md" style={{ background: "rgba(26,31,58,0.85)" }}>
        <FilterRow label="Año" aria="Filtro por año">
          {allYears.map((y) => (
            <Chip
              key={y}
              active={years.includes(String(y))}
              onClick={() => {
                const next = toggle(years, String(y));
                setYears(next); updateUrl({ years: next });
              }}
            >
              {y}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Categoría" aria="Filtro por categoría">
          {allCategories.map((c) => (
            <Chip
              key={c}
              active={cats.includes(c)}
              onClick={() => {
                const next = toggle(cats, c);
                setCats(next); updateUrl({ cats: next });
              }}
            >
              {CATEGORY_LABELS[c] ?? c}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Resultado" aria="Filtro por resultado">
          <Chip active={results.includes("winner")} onClick={() => { const n = toggle(results, "winner"); setResults(n); updateUrl({ results: n }); }}>Ganadora</Chip>
          <Chip active={results.includes("finalist")} onClick={() => { const n = toggle(results, "finalist"); setResults(n); updateUrl({ results: n }); }}>Finalista</Chip>
        </FilterRow>
        <FilterRow label="Estado" aria="Filtro por estado actual">
          {STATUS_OPTIONS.map((o) => (
            <Chip
              key={o.key}
              active={statuses.includes(o.key)}
              onClick={() => {
                const next = toggle(statuses, o.key);
                setStatuses(next); updateUrl({ statuses: next });
              }}
            >
              {o.label}
            </Chip>
          ))}
        </FilterRow>

        {awardIsGlobal && (
          <FilterRow label="Alcance" aria="Filtro por origen geográfico">
            <Chip
              active={!showIntl}
              onClick={() => { setShowIntl(false); updateUrl({ intl: false }); }}
            >
              Solo ES/PT
            </Chip>
            <Chip
              active={showIntl}
              onClick={() => { setShowIntl(true); updateUrl({ intl: true }); }}
            >
              + Internacionales
            </Chip>
          </FilterRow>
        )}

        <div className="flex items-center justify-between mt-2 px-1">
          <p className="font-mono text-xs text-white/55">
            Mostrando <span className="text-white/85">{sorted.length}</span> de {recipients.length}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-white/55 hover:text-white"
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {groupedByYear ? (
          groupedByYear.orderedYears.map((y) => (
            <YearGroupMobile
              key={y}
              year={y}
              count={groupedByYear.grouped[y].length}
              items={groupedByYear.grouped[y]}
            />
          ))
        ) : (
          sorted.map((r) => <MobileCard key={r.id} r={r} />)
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">
            Catálogo de premiadas y finalistas filtrable por año, categoría, resultado y estado.
          </caption>
          <thead>
            <tr className="border-b border-white/15 text-[11px] font-mono uppercase tracking-widest text-white/55">
              <SortableTh label="Empresa" current={sort} keyAsc="name_asc" keyDesc="name_desc" onSort={(s) => { setSort(s); updateUrl({ sort: s }); }} />
              <SortableTh label="Año" current={sort} keyAsc="year_asc" keyDesc="year_desc" onSort={(s) => { setSort(s); updateUrl({ sort: s }); }} className="w-24" />
              <th className="py-3 px-3 font-normal">Categoría</th>
              <th className="py-3 px-3 font-normal w-32">Resultado</th>
              <th className="py-3 px-3 font-normal w-32">Estado</th>
              <th className="py-3 px-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {groupedByYear
              ? groupedByYear.orderedYears.map((y) => (
                  <YearGroupDesktop
                    key={y}
                    year={y}
                    count={groupedByYear.grouped[y].length}
                    items={groupedByYear.grouped[y]}
                  />
                ))
              : sorted.map((r) => <DesktopRow key={r.id} r={r} />)}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/65 font-body">
          Ningún registro coincide con los filtros actuales.
        </div>
      )}
    </>
  );
}

function FilterRow({
  label,
  aria,
  children,
}: { label: string; aria: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 -mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto scrollbar-hide" aria-label={aria}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/45 shrink-0 w-20 md:w-24">
        {label}
      </span>
      <div className="flex gap-1.5 flex-nowrap md:flex-wrap">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
        active
          ? "border-transparent text-[#1a1f3a]"
          : "border-white/15 text-white/65 hover:text-white hover:border-white/35"
      }`}
      style={active ? { background: "#c9a96e" } : undefined}
    >
      {children}
    </button>
  );
}

function SortableTh({
  label,
  current,
  keyAsc,
  keyDesc,
  onSort,
  className = "",
}: {
  label: string;
  current: SortKey;
  keyAsc: SortKey;
  keyDesc: SortKey;
  onSort: (s: SortKey) => void;
  className?: string;
}) {
  const isActive = current === keyAsc || current === keyDesc;
  const next = current === keyDesc ? keyAsc : keyDesc;
  return (
    <th className={`py-3 px-3 font-normal ${className}`}>
      <button
        type="button"
        onClick={() => onSort(next)}
        className={`inline-flex items-center gap-1 ${isActive ? "text-white/85" : "text-white/55 hover:text-white/80"}`}
      >
        {label}
        {isActive ? (
          current === keyDesc ? <ChevronDown size={12} /> : <ChevronUp size={12} />
        ) : null}
      </button>
    </th>
  );
}

function DesktopRow({ r }: { r: CatalogRecipient }) {
  return (
    <tr
      className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer"
      onClick={() => { window.location.href = `/premios/recipient/${r.id}`; }}
    >
      <td className="py-3 px-3">
        <p className="font-sora font-semibold text-sm" style={{ color: "#e8d9b8" }}>
          {r.company_name}
        </p>
        {r.company_description_short && (
          <p className="font-body text-xs text-white/55 mt-0.5 line-clamp-1 max-w-md">
            {r.company_description_short}
          </p>
        )}
      </td>
      <td className="py-3 px-3 font-mono text-sm text-white/70">{r.edition_year}</td>
      <td className="py-3 px-3 font-body text-xs text-white/65">{r.category_value}</td>
      <td className="py-3 px-3"><ResultBadge result={r.result} /></td>
      <td className="py-3 px-3"><StatusBadge status={r.current_status} /></td>
      <td className="py-3 px-3 text-right">
        <Link
          href={`/premios/recipient/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Ver detalle de ${r.company_name}`}
        >
          <ChevronRight size={16} className="text-white/40" />
        </Link>
      </td>
    </tr>
  );
}

function MobileCard({ r }: { r: CatalogRecipient }) {
  return (
    <Link
      href={`/premios/recipient/${r.id}`}
      className="block rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="font-sora font-bold text-base" style={{ color: "#e8d9b8" }}>
          {r.company_name}
        </h3>
        <ResultBadge result={r.result} />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50 mt-1.5">
        {r.category_value} · {r.edition_year}
      </p>
      <div className="mt-3"><StatusBadge status={r.current_status} /></div>
    </Link>
  );
}

function CoverageBadge({ count }: { count: number }) {
  if (count >= 10) return null;
  const isPartial = count >= 5;
  const label = isPartial ? "ⓘ Cobertura parcial" : "⚠ Solo winners";
  const title = isPartial
    ? "Esta edición tiene cobertura parcial: faltan algunos finalistas en las fuentes públicas."
    : "Solo se han documentado las empresas ganadoras de esta edición; los finalistas no están disponibles en las fuentes públicas.";
  return (
    <span
      title={title}
      className="shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest"
      style={
        isPartial
          ? { borderColor: "rgba(201,169,110,0.5)", color: "#c9a96e" }
          : { borderColor: "rgba(244,169,170,0.55)", color: "#f4a9aa" }
      }
    >
      {label}
    </span>
  );
}

function YearSeparator({ year, count }: { year: number; count: number }) {
  return (
    <div
      id={String(year)}
      className="flex items-center gap-3 my-6 scroll-mt-24"
    >
      <span aria-hidden className="h-px flex-1" style={{ background: "rgba(201,169,110,0.4)" }} />
      <span className="font-sora font-bold text-2xl md:text-3xl" style={{ color: "#c9a96e" }}>
        {year}
      </span>
      <span aria-hidden className="h-px flex-1" style={{ background: "rgba(201,169,110,0.4)" }} />
      <CoverageBadge count={count} />
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/45 shrink-0">
        {count}
      </span>
    </div>
  );
}

function YearGroupDesktop({ year, count, items }: { year: number; count: number; items: CatalogRecipient[] }) {
  return (
    <>
      <tr>
        <td colSpan={6} className="pt-6 pb-2">
          <YearSeparator year={year} count={count} />
        </td>
      </tr>
      {items.map((r) => <DesktopRow key={r.id} r={r} />)}
    </>
  );
}

function YearGroupMobile({ year, count, items }: { year: number; count: number; items: CatalogRecipient[] }) {
  return (
    <>
      <YearSeparator year={year} count={count} />
      {items.map((r) => <MobileCard key={r.id} r={r} />)}
    </>
  );
}
