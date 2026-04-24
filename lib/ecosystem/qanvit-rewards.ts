export const QANVIT_CONTACT_EMAIL = "hola@qanvit.com";
export const QANVIT_WEBSITE_URL = "https://qanvit.com";
export const QANVIT_APP_URL = "https://app.qanvit.com";

export const QANVIT_DISCOUNT_BY_TIER = {
  rookie: 10,
  pro: 20,
  elite: 30,
} as const;

export type EcosystemTier = keyof typeof QANVIT_DISCOUNT_BY_TIER;

export function qanvitDiscountCopy(tier: EcosystemTier): string {
  return `${QANVIT_DISCOUNT_BY_TIER[tier]}% de descuento en Qanvit`;
}

export const QANVIT_CLAIM_INSTRUCTIONS =
  `Escribe a ${QANVIT_CONTACT_EMAIL} indicando tu tier actual y aplicaremos el descuento manualmente.`;

export function buildQanvitUrl(
  path = "",
  params: Record<string, string> = {}
): string {
  const base = `${QANVIT_WEBSITE_URL}${path}`;
  const qs = new URLSearchParams(params).toString();
  return qs ? `${base}?${qs}` : base;
}
