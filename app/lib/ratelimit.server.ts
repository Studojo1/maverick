import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL?.trim();
const redisPassword = process.env.REDIS_PASSWORD?.trim();

// Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client lazily
async function getRedisClient() {
  if (!redisUrl) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = createClient({
        url: redisUrl,
        password: redisPassword || undefined,
      });
      redisClient.on("error", (err) => {
        console.error("[ratelimit] Redis client error:", err);
      });
      await redisClient.connect();
    } catch (err) {
      console.error("[ratelimit] Failed to connect to Redis:", err);
      redisClient = null;
      return null;
    }
  }

  return redisClient;
}

export interface RateLimitConfig {
  requests: number; // Number of requests allowed
  window: number; // Time window in seconds
}

// Default rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { requests: 5, window: 60 }, // 5 requests per minute for auth
  payment: { requests: 10, window: 60 }, // 10 requests per minute for payments
  admin: { requests: 30, window: 60 }, // 30 requests per minute for admin
  default: { requests: 100, window: 60 }, // 100 requests per minute for general endpoints
};

/**
 * Get endpoint type from request path
 */
function getEndpointType(path: string): string {
  if (path.includes("/auth") || path.includes("/login") || path.includes("/signin") || path.includes("/signup")) {
    return "auth";
  }
  if (path.includes("/payment") || path.includes("/pay") || path.includes("/order")) {
    return "payment";
  }
  if (path.includes("/admin")) {
    return "admin";
  }
  return "default";
}

/**
 * Get identifier from request (user ID if available, otherwise IP)
 */
function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  // Extract IP from request
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * Check rate limit and return whether request should be allowed
 * @returns { allowed: boolean, remaining: number, reset: number } or null if rate limiting is disabled
 */
export async function checkRateLimit(
  request: Request,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; reset: number } | null> {
  const client = await getRedisClient();
  if (!client) {
    // Rate limiting disabled, allow request
    return null;
  }

  // Skip rate limiting for health/ready endpoints
  const path = new URL(request.url).pathname;
  if (path === "/health" || path === "/ready") {
    return null;
  }

  const endpointType = getEndpointType(path);
  const config = RATE_LIMITS[endpointType];
  const identifier = getIdentifier(request, userId);

  // Create Redis key
  const key = `ratelimit:${endpointType}:${identifier}`;

  try {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.window;

    // Remove old entries
    await client.zRemRangeByScore(key, "0", windowStart.toString());

    // Count current requests in window
    const count = await client.zCard(key);

    if (count >= config.requests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        reset: now + config.window,
      };
    }

    // Add current request to the set
    const member = now.toString();
    await client.zAdd(key, {
      score: now,
      value: member,
    });
    await client.expire(key, config.window + 1);

    const remaining = config.requests - count - 1;
    return {
      allowed: true,
      remaining: remaining >= 0 ? remaining : 0,
      reset: now + config.window,
    };
  } catch (error) {
    console.error("[ratelimit] Error checking rate limit:", error);
    // On error, allow request but log warning
    return null;
  }
}

/**
 * Rate limit middleware wrapper for route handlers
 * Returns a 429 response if rate limit is exceeded
 */
export async function withRateLimit<T>(
  request: Request,
  handler: () => Promise<T>,
  userId?: string
): Promise<T | Response> {
  const result = await checkRateLimit(request, userId);
  if (result === null) {
    // Rate limiting disabled, proceed
    return handler();
  }

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: {
          code: "rate_limit_exceeded",
          message: "Rate limit exceeded. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": RATE_LIMITS[getEndpointType(new URL(request.url).pathname)].requests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": RATE_LIMITS[getEndpointType(new URL(request.url).pathname)].window.toString(),
        },
      }
    );
  }

  // Rate limit not exceeded, proceed with handler
  const response = await handler();
  
  // If response is a Response object, add rate limit headers
  if (response instanceof Response) {
    const headers = new Headers(response.headers);
    headers.set("X-RateLimit-Limit", RATE_LIMITS[getEndpointType(new URL(request.url).pathname)].requests.toString());
    headers.set("X-RateLimit-Remaining", result.remaining.toString());
    headers.set("X-RateLimit-Reset", result.reset.toString());
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}

