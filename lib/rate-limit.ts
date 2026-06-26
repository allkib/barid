import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export type RateLimitTier = "settings-read" | "settings-write" | "test-sms";

const TIER_CONFIG: Record<
  RateLimitTier,
  { requests: number; window: `${number} ${"s" | "m" | "h" | "d"}` }
> = {
  "settings-read": { requests: 60, window: "1 h" },
  "settings-write": { requests: 15, window: "1 h" },
  "test-sms": { requests: 5, window: "1 h" },
};

const limiters = new Map<RateLimitTier, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  let limiter = limiters.get(tier);
  if (!limiter) {
    const { requests, window } = TIER_CONFIG[tier];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `barid:rl:${tier}`,
    });
    limiters.set(tier, limiter);
  }
  return limiter;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function enforceRateLimit(
  request: Request,
  tier: RateLimitTier
): Promise<NextResponse | null> {
  const limiter = getLimiter(tier);
  if (!limiter) return null;

  const { success, limit, remaining, reset } = await limiter.limit(
    getClientIp(request)
  );

  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  return null;
}
