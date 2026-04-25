import { hasConsent } from "./consent";
import { identify, resetUser } from "./posthog";
import type { Tier } from "./events";

export type AnalyticsRole = "startup_founder" | "ecosystem_org" | "admin";

export type AnalyticsUser = {
  id: string;
  email?: string | null;
  role: AnalyticsRole;
  tier?: Tier | null;
};

/**
 * Identify the current user in PostHog. No-op if consent is missing.
 *
 * The property set is intentionally narrow: id (required), email (used by
 * PostHog UI as a display alias), role, and tier when present. No name,
 * no avatar, no PII beyond email.
 */
export function identifyUser(user: AnalyticsUser): void {
  if (!hasConsent()) return;
  if (!user.id) return;
  const props: Record<string, unknown> = { role: user.role };
  if (user.email) props.email = user.email;
  if (user.tier) props.tier = user.tier;
  identify(user.id, props);
}

export function resetIdentifiedUser(): void {
  resetUser();
}
