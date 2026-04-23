import { getFundingStageLabel, type FundingStage } from "@/lib/funding-stage";

const STAGE_COLORS: Record<string, string> = {
  pre_seed:      "bg-league-ideation text-ink-primary",
  seed:          "bg-league-seed text-ink-primary",
  series_a:      "bg-league-growth text-brand-navy",
  series_b:      "bg-league-elite text-ink-primary",
  series_c:      "bg-league-elite text-ink-primary",
  series_d_plus: "bg-league-elite text-ink-primary",
  bootstrapped:  "bg-brand-lavender text-brand-navy",
};

type Props = {
  stage: FundingStage | string | null | undefined;
  variant?: "full" | "compact";
};

export default function FundingStageBadge({ stage, variant = "full" }: Props) {
  if (!stage) return null;
  const label = getFundingStageLabel(stage);
  if (!label) return null;
  const colorClass = STAGE_COLORS[stage] ?? "bg-brand-lavender text-brand-navy";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full font-sora font-medium border border-border-soft ${
        variant === "compact" ? "text-xs" : "text-xs"
      } ${colorClass}`}
    >
      {label}
    </span>
  );
}
