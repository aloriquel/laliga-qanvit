import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _anonVoteLimiter: Ratelimit | null | undefined;

function isConfigured() {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getAnonVoteLimiter(): Ratelimit | null {
  if (_anonVoteLimiter !== undefined) return _anonVoteLimiter;
  _anonVoteLimiter = isConfigured()
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        }),
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        prefix: "rl:anon-vote:ip",
      })
    : null;
  return _anonVoteLimiter;
}

export async function checkAnonVoteRateLimit(ip: string): Promise<{ success: boolean }> {
  const limiter = getAnonVoteLimiter();
  if (!limiter) return { success: true };
  try {
    const r = await limiter.limit(ip);
    return { success: r.success };
  } catch {
    return { success: true };
  }
}
