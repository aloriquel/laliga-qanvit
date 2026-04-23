"use client";

import { FUNDING_STAGES, type FundingStage } from "@/lib/funding-stage";
import { cn } from "@/lib/utils";

// ── FundingStageSelector ────────────────────────────────────────────────────

type SelectorProps = {
  value: FundingStage | null;
  onChange: (value: FundingStage | null) => void;
  required?: boolean;
  disabled?: boolean;
  showDescriptions?: boolean;
};

export function FundingStageSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  showDescriptions = true,
}: SelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {required && !value && (
        <p className="font-body text-xs text-red-500">Selecciona tu fase de financiación <span aria-hidden>*</span></p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FUNDING_STAGES.map((stage) => {
          const selected = value === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(stage.id)}
              className={cn(
                "text-left px-4 py-3 rounded-xl border transition-colors",
                selected
                  ? "border-brand-navy bg-brand-lavender ring-2 ring-brand-navy/20"
                  : "border-border-soft bg-white hover:bg-brand-lavender/40",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-sora font-semibold text-sm text-brand-navy">
                  {stage.label}
                </span>
                {selected && (
                  <span className="w-4 h-4 rounded-full bg-brand-navy flex-shrink-0 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                )}
              </div>
              {showDescriptions && (
                <p className="font-body text-xs text-ink-secondary mt-1 leading-relaxed">
                  {stage.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── IsRaisingToggle ─────────────────────────────────────────────────────────

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function IsRaisingToggle({ value, onChange, disabled = false }: ToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-3 cursor-pointer group">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={cn(
            "flex-shrink-0 mt-0.5 w-10 h-6 rounded-full border-2 transition-colors relative",
            value ? "bg-brand-navy border-brand-navy" : "bg-white border-border-soft",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              value ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>
        <div>
          <p className="font-body text-sm font-semibold text-brand-navy">
            ¿Estás levantando ronda ahora mismo?
          </p>
          <p className="font-body text-xs text-ink-secondary mt-0.5 leading-relaxed">
            Si activas esta opción, aparecerá un badge &ldquo;Levantando ronda&rdquo; en tu perfil público (solo si Perfil público está activado).
          </p>
        </div>
      </label>
    </div>
  );
}
