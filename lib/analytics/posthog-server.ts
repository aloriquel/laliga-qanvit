import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      flushAt: 20,
      flushInterval: 10000,
    });
  }
  return client;
}

export function trackServer(
  event: string,
  userId: string | null,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({
    distinctId: userId ?? "anonymous",
    event,
    properties,
  });
}

export async function shutdownPostHog() {
  await client?.shutdown();
}
