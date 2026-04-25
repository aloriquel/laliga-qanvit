type Status = "active" | "acquired" | "closed" | "pivoted" | "unknown";

const LABELS: Record<Status, string> = {
  active: "Activa",
  acquired: "Adquirida",
  closed: "Cerrada",
  pivoted: "Pivotó",
  unknown: "Sin verificar",
};

const STYLES: Record<Status, string> = {
  active:
    "bg-emerald-700/30 text-emerald-100 border border-emerald-500/40",
  acquired:
    "bg-sky-600/30 text-sky-100 border border-sky-400/40",
  closed:
    "bg-white/10 text-white/60 border border-white/15",
  pivoted:
    "bg-orange-700/30 text-orange-100 border border-orange-500/40",
  unknown:
    "bg-white/5 text-white/55 border border-white/10",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium uppercase tracking-wider ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
