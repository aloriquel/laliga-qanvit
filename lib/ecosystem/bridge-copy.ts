import type { EcosystemOrgType } from "./owner";
import {
  QANVIT_CONTACT_EMAIL,
  QANVIT_DISCOUNT_BY_TIER,
  QANVIT_WEBSITE_URL,
  type EcosystemTier,
} from "./qanvit-rewards";

export const BRIDGE_COPY: Record<EcosystemOrgType, { headline: string; subline: string }> = {
  science_park: {
    headline: "Qanvit automatiza el matchmaking con startups residentes",
    subline: "Convierte retos de innovación abierta en pilotos ejecutándose con tus startups.",
  },
  cluster: {
    headline: "Qanvit coordina innovación abierta entre socios",
    subline: "Gestiona retos sectoriales y conecta tu clúster con soluciones de startups.",
  },
  innovation_association: {
    headline: "Qanvit automatiza tus programas de innovación abierta",
    subline: "Captación, scoring y seguimiento de startups candidatas, todo en un sitio.",
  },
  other: {
    headline: "Qanvit convierte retos en pilotos con IA",
    subline: "BBDD propietaria de más de 16.000 startups y 4 agentes IA end-to-end.",
  },
};

export function buildTierAwareCopy(tier: EcosystemTier | null): { headline: string; subline: string } {
  const discount = tier ? QANVIT_DISCOUNT_BY_TIER[tier] : null;
  if (tier && discount) {
    return {
      headline: `Tu tier ${tier[0].toUpperCase() + tier.slice(1)} te da un ${discount}% de descuento en Qanvit`,
      subline: `Escribe a ${QANVIT_CONTACT_EMAIL} para aplicarlo antes de contratar.`,
    };
  }
  return {
    headline: "Descubre Qanvit, el motor detrás de La Liga",
    subline: "Corporate venture con IA para parques, clusters y asociaciones.",
  };
}

export function buildBridgeCtaUrl(orgType: EcosystemOrgType, tier?: EcosystemTier | null): string {
  const params = new URLSearchParams({
    utm_source: "laliga",
    utm_medium: "banner",
    utm_campaign: "ecosystem_bridge",
    utm_term: orgType,
  });
  if (tier) params.set("tier", tier);
  return `${QANVIT_WEBSITE_URL}?${params.toString()}`;
}
