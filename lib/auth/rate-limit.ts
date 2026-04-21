import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

function makeRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// 3 attempts per IP per 15 min
const ipLoginLimiter = upstashConfigured
  ? new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(3, "15 m"),
      prefix: "rl:login:ip",
    })
  : null;

// 5 attempts per email per hour
const emailLoginLimiter = upstashConfigured
  ? new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "rl:login:email",
    })
  : null;

// 10 signups per IP per day
const signupLimiter = upstashConfigured
  ? new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "rl:signup:ip",
    })
  : null;

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
  if (!ipLoginLimiter || !emailLoginLimiter) {
    return { success: true, remaining: 999, reset: 0 };
  }

  const [ipResult, emailResult] = await Promise.all([
    ipLoginLimiter.limit(ip),
    emailLoginLimiter.limit(email.toLowerCase()),
  ]);

  if (!ipResult.success) {
    return {
      success: false,
      remaining: 0,
      reset: ipResult.reset,
      reason: "ip",
    };
  }
  if (!emailResult.success) {
    return {
      success: false,
      remaining: 0,
      reset: emailResult.reset,
      reason: "email",
    };
  }

  return {
    success: true,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
    reset: Math.max(ipResult.reset, emailResult.reset),
  };
}

export async function checkSignupRateLimit(
  ip: string
): Promise<RateLimitResult> {
  if (!signupLimiter) {
    return { success: true, remaining: 999, reset: 0 };
  }
  const result = await signupLimiter.limit(ip);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    reason: result.success ? undefined : "ip",
  };
}
