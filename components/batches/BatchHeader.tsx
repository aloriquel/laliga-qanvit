import { type Batch, isPreLaunchBatch, getCountdownLabel } from "@/lib/batches";
import BatchCountdown from "./BatchCountdown";

type Props = {
  batch: Batch;
  nextBatch?: Batch | null;
  showCountdown?: boolean;
};

export default function BatchHeader({ batch, nextBatch, showCountdown = true }: Props) {
  const preLaunch = isPreLaunchBatch(batch);
  const { label, sublabel, target } = getCountdownLabel(batch, nextBatch);

  // Pre-launch: amber
  if (preLaunch) {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
              Pre-Lanzamiento · Q3 2026 arranca el 1 de julio
            </span>
            <p className="font-body text-sm text-ink-secondary mt-2">
              Ficha tu startup hoy para aparecer desde el primer día del primer batch oficial.
            </p>
          </div>
          {showCountdown && nextBatch && (
            <div className="flex-shrink-0">
              <BatchCountdown target={target} sublabel={sublabel} variant="hero" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active: lavender/green
  if (batch.status === "active") {
    return (
      <div className="mb-6 bg-brand-lavender/60 border border-brand-navy/15 rounded-xl px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="font-mono text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
            {batch.display_name} · Liga oficial
          </span>
        </div>
        {showCountdown && (
          <BatchCountdown target={target} sublabel={sublabel} variant="hero" />
        )}
      </div>
    );
  }

  // Upcoming non-pre-launch: light blue
  if (batch.status === "upcoming") {
    return (
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="font-mono text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
            {batch.display_name} · próximamente
          </span>
        </div>
        {showCountdown && (
          <BatchCountdown target={target} sublabel={sublabel} variant="hero" />
        )}
      </div>
    );
  }

  // Closed/archived: neutral
  return (
    <div className="mb-6 bg-brand-navy/8 border border-brand-navy/15 rounded-xl px-5 py-3">
      <span className="font-mono text-xs text-brand-navy font-semibold uppercase tracking-wider">
        Batch cerrado
      </span>
      <p className="font-body text-sm text-ink-secondary mt-1">
        {batch.display_name}
        {batch.closed_at && ` · cerrado el ${new Date(batch.closed_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`}
      </p>
      {/* Silence unused var warnings when showCountdown is false for closed batches */}
      <span className="hidden">{label}</span>
    </div>
  );
}
