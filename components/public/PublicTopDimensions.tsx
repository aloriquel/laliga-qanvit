import type { Dimension } from "@/lib/public/profile-utils";

// TODO: extend if new dimensions are added to the rubric
const DIMENSION_LABELS: Record<string, string> = {
  problem: "Severidad del problema",
  market: "Tamaño de mercado",
  solution: "Solución y diferenciación",
  team: "Fortaleza del equipo",
  traction: "Tracción y validación",
  business_model: "Modelo de negocio",
  gtm: "Go-to-market",
};

function getDimensionLabel(key: string): string {
  return DIMENSION_LABELS[key] ?? key;
}

function getBarColor(score: number, maxScore: number): string {
  // If top dimensions are all below 50, use salmon to avoid negative framing
  if (maxScore < 50) return "bg-brand-salmon";
  if (score > 70) return "bg-brand-salmon";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function getTextColor(score: number, maxScore: number): string {
  if (maxScore < 50) return "text-brand-navy";
  if (score > 70) return "text-brand-navy";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

type Props = { dimensions: Dimension[] };

export default function PublicTopDimensions({ dimensions }: Props) {
  if (dimensions.length === 0) return null;

  const maxScore = Math.max(...dimensions.map((d) => d.score));

  return (
    <div className="bg-white rounded-card border border-border-soft shadow-card p-6 mb-6">
      <h2 className="font-sora font-bold text-lg text-brand-navy mb-1">
        Puntos fuertes del scoring
      </h2>
      <div className="w-8 h-0.5 bg-brand-salmon rounded-full mb-5" />
      <div className="flex flex-col gap-5">
        {dimensions.map((dim) => {
          const barColor = getBarColor(dim.score, maxScore);
          const textColor = getTextColor(dim.score, maxScore);
          const barWidthPct = Math.min(100, Math.max(4, dim.score));
          return (
            <div key={dim.key}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-sora font-semibold text-sm text-brand-navy">
                  {getDimensionLabel(dim.key)}
                </span>
                <span className={`font-sora font-bold text-base ${textColor}`}>
                  {Math.round(dim.score)}
                </span>
              </div>
              <div className="h-2 bg-brand-lavender rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full`}
                  style={{ width: `${barWidthPct}%` }}
                  role="progressbar"
                  aria-valuenow={dim.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={getDimensionLabel(dim.key)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
