import { CheckCircle2 } from "lucide-react";

type Props = { highlights: string[] };

export default function PublicStrengthsHighlights({ highlights }: Props) {
  if (highlights.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="font-sora font-bold text-lg text-brand-navy mb-1">
        Fortalezas destacadas
      </h2>
      <div className="w-8 h-0.5 bg-brand-salmon rounded-full mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((text, i) => (
          <div
            key={i}
            className="bg-white rounded-card border border-border-soft shadow-card p-5 flex gap-3 items-start"
          >
            <CheckCircle2
              size={18}
              className="text-brand-salmon flex-shrink-0 mt-0.5"
              aria-hidden
            />
            <p className="font-sora font-semibold text-sm text-brand-navy leading-snug">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
