import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy initialization — never instantiate at module load time.
// Next.js evaluates route modules during build; instantiating Redis
// at module level causes "failed to collect page data" errors.

let _ipLoginLimiter: Ratelimit | null | undefined;
let _emailLoginLimiter: Ratelimit | null | undefined;
let _signupLimiter: Ratelimit | null | undefined;

function isConfigured() {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function makeRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function getIpLoginLimiter(): Ratelimit | null {
  if (_ipLoginLimiter !== undefined) return _ipLoginLimiter;
  _ipLoginLimiter = isConfigured()
    ? new Ratelimit({
        redis: makeRedis(),
        limiter: Ratelimit.slidingWindow(3, "15 m"),
        prefix: "rl:login:ip",
      })
    : null;
  return _ipLoginLimiter;
}

function getEmailLoginLimiter(): Ratelimit | null {
  if (_emailLoginLimiter !== undefined) return _emailLoginLimiter;
  _emailLoginLimiter = isConfigured()
    ? new Ratelimit({
        redis: makeRedis(),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "rl:login:email",
      })
    : null;
  return _emailLoginLimiter;
}

function getSignupLimiter(): Ratelimit | null {
  if (_signupLimiter !== undefined) return _signupLimiter;
  _signupLimiter = isConfigured()
    ? new Ratelimit({
        redis: makeRedis(),
        limiter: Ratelimit.slidingWindow(10, "24 h"),
        prefix: "rl:signup:ip",
      })
    : null;
  return _signupLimiter;
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  reason?: "ip" | "email";
};

export async function checkLoginRateLimit(
  ip: string,
  email: string
): Promise<RateLimitResult> {
  const ipLimiter = getIpLoginLimiter();
  const emailLimiter = getEmailLoginLimiter();

  if (!ipLimiter || !emailLimiter) {
    return { success: true, remaining: 999, reset: 0 };
  }

  try {
    const [ipResult, emailResult] = await Promise.all([
      ipLimiter.limit(ip),
      emailLimiter.limit(email.toLowerCase()),
    ]);

    if (!ipResult.success) {
      return { success: false, remaining: 0, reset: ipResult.reset, reason: "ip" };
    }
    if (!emailResult.success) {
      return { success: false, remaining: 0, reset: emailResult.reset, reason: "email" };
    }

    return {
      success: true,
      remaining: Math.min(ipResult.remaining, emailResult.remaining),
      reset: Math.max(ipResult.reset, emailResult.reset),
    };
  } catch (err) {
    // Fail open: if Redis is unreachable or credentials are wrong, allow the request.
    console.error("[rate-limit] Upstash error — failing open:", (err as Error).message);
    return { success: true, remaining: 999, reset: 0 };
  }
}

export async function checkSignupRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const limiter = getSignupLimiter();
  if (!limiter) return { success: true, remaining: 999, reset: 0 };

  try {
    const result = await limiter.limit(ip);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      reason: result.success ? undefined : "ip",
    };
  } catch (err) {
    console.error("[rate-limit] Upstash error — failing open:", (err as Error).message);
    return { success: true, remaining: 999, reset: 0 };
  }
}
