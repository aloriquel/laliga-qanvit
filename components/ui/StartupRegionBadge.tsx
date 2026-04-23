import { getCaById, type CaId } from "@/lib/spain-regions";

type Props = {
  regionCa: CaId | null | undefined;
  regionProvince: string | null | undefined;
  variant?: "full" | "compact";
};

export default function StartupRegionBadge({
  regionCa,
  regionProvince,
  variant = "full",
}: Props) {
  if (!regionCa || !regionProvince) return null;

  const ca = getCaById(regionCa);
  if (!ca) return null;

  if (variant === "compact") {
    return (
      <span
        title={ca.name}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-sora font-medium text-xs bg-brand-lavender text-brand-navy border border-border-soft"
      >
        🏛️ {regionProvince}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-sora font-medium text-xs bg-brand-lavender text-brand-navy border border-border-soft">
      🏛️ {regionProvince} · {ca.name}
    </span>
  );
}
