"use client";

import { Sparkles, X } from "lucide-react";
import { useDismissibleBanner } from "@/lib/hooks/useDismissibleBanner";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import type { EcosystemOrgType } from "@/lib/ecosystem/owner";
import { BRIDGE_COPY, buildBridgeCtaUrl, buildTierAwareCopy } from "@/lib/ecosystem/bridge-copy";
import type { EcosystemTier } from "@/lib/ecosystem/qanvit-rewards";

type Variant = "liga" | "dashboard";

type Props = {
  orgType: EcosystemOrgType;
  orgName: string;
  variant?: Variant;
  surface?: string;
  tier?: EcosystemTier | null;
};

const DEFAULT_SURFACE: Record<Variant, string> = {
  liga: "qanvit_bridge_liga",
  dashboard: "qanvit_bridge_dashboard",
};

export default function EcosystemBridgeBannerClient({
  orgType,
  orgName,
  variant = "liga",
  surface,
  tier = null,
}: Props) {
  const bannerKey = surface ?? DEFAULT_SURFACE[variant];
  const { isDismissed, dismiss } = useDismissibleBanner(bannerKey);

  // Bridge view is implicit in the dashboard pageview event; no dedicated event.
  // (Previous viewed_qanvit_bridge event removed in PROMPT_POSTHOG event-catalog cleanup.)

  if (isDismissed) return null;

  // Dashboard variant uses tier-aware discount copy; public /liga stays generic.
  const copy =
    variant === "dashboard" && tier
      ? buildTierAwareCopy(tier)
      : BRIDGE_COPY[orgType] ?? BRIDGE_COPY.other;
  const ctaUrl = buildBridgeCtaUrl(orgType, tier);
  const ctaLabel = variant === "dashboard" && tier ? "Conocer Qanvit →" : "Explorar Qanvit →";

  const handleCtaClick = () => {
    if (tier) {
      track(EVENTS.ECOSYSTEM_QANVIT_CTA_CLICKED, {
        tier,
        cta_location: variant === "dashboard" ? "tile" : "banner",
      });
    }
  };

  const handleDismiss = () => {
    // Dismissal does not have a dedicated event in the V1 catalog.
    dismiss();
  };

  if (variant === "dashboard") {
    return (
      <aside
        role="complementary"
        aria-label="Oferta de Qanvit para tu organización"
        className="relative bg-gradient-to-br from-brand-navy/5 to-brand-salmon/10 rounded-2xl p-6 border border-brand-lavender"
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Ocultar banner"
          className="absolute top-3 right-3 text-brand-navy/40 hover:text-brand-navy transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand-salmon" />
          <span className="font-sora text-xs font-semibold uppercase tracking-wide text-brand-navy/60">
            Qanvit para {orgName}
          </span>
        </div>
        <h3 className="font-sora font-bold text-brand-navy text-base leading-snug">
          {copy.headline}
        </h3>
        <p className="font-body text-sm text-ink-secondary mt-2">{copy.subline}</p>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCtaClick}
          aria-label="Explorar Qanvit en qanvit.com"
          className="mt-4 inline-flex items-center justify-center bg-brand-navy text-white font-semibold rounded-xl px-4 py-2 text-sm font-body hover:bg-brand-navy/90 transition-colors"
        >
          {ctaLabel}
        </a>
      </aside>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label="Oferta de Qanvit para tu organización"
      className="relative bg-gradient-to-r from-brand-lavender via-brand-lavender/60 to-brand-salmon/20 border border-brand-navy/10 rounded-xl p-5 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5 pr-6">
        <div className="shrink-0 w-10 h-10 rounded-full bg-brand-navy/5 flex items-center justify-center">
          <Sparkles size={18} className="text-brand-salmon" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sora font-bold text-brand-navy text-sm md:text-base leading-snug">
            {copy.headline}
          </p>
          <p className="font-body text-xs md:text-sm text-ink-secondary mt-1">
            {copy.subline}
          </p>
        </div>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCtaClick}
          aria-label="Explorar Qanvit en qanvit.com"
          className="shrink-0 inline-flex items-center justify-center bg-brand-navy text-white font-semibold rounded-xl px-5 py-2.5 text-sm font-body hover:bg-brand-navy/90 transition-colors w-full md:w-auto"
        >
          {ctaLabel}
        </a>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Ocultar banner"
        className="absolute top-3 right-3 text-brand-navy/40 hover:text-brand-navy transition-colors"
      >
        <X size={16} />
      </button>
    </aside>
  );
}
