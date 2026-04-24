import type { EcosystemOrgType } from "./owner";

export const BRIDGE_COPY: Record<EcosystemOrgType, { headline: string; subline: string }> = {
  science_park: {
    headline: "¿Gestionas retos de innovación con tus startups residentes?",
    subline: "Qanvit automatiza el matchmaking entre retos corporate y startups de tu parque.",
  },
  cluster: {
    headline: "¿Coordinas innovación abierta entre tus socios?",
    subline: "Qanvit gestiona retos sectoriales y conecta tu clúster con soluciones de startups.",
  },
  innovation_association: {
    headline: "¿Organizas programas de innovación abierta?",
    subline: "Qanvit automatiza la captación, scoring y seguimiento de startups candidatas.",
  },
  other: {
    headline: "¿Gestionas retos de innovación abierta?",
    subline: "Qanvit automatiza la conexión entre retos corporate y startups del ecosistema.",
  },
};

export function buildBridgeCtaUrl(orgType: EcosystemOrgType): string {
  const params = new URLSearchParams({
    utm_source: "laliga",
    utm_medium: "banner",
    utm_campaign: "ecosystem_bridge",
    utm_term: orgType,
  });
  return `https://www.qanvit.com?${params.toString()}`;
}
