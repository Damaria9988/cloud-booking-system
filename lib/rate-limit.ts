// Rate limiting utility for API endpoints
// Prevents abuse and DDoS attacks

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if a request should be rate limited
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No entry or expired entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Entry exists and is valid
  if (entry.count < config.maxRequests) {
    entry.count++
    rateLimitStore.set(identifier, entry)

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit middleware for API routes
 * Usage: const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 })
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string) => {
    return checkRateLimit(identifier, config)
  }
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(request: Request, userId?: number): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from headers (works with proxies)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return `ip:${realIp}`
  }

  // Fallback to a generic identifier
  return "ip:unknown"
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Strict: 10 requests per minute
  STRICT: { windowMs: 60 * 1000, maxRequests: 10 },

  // Moderate: 30 requests per minute
  MODERATE: { windowMs: 60 * 1000, maxRequests: 30 },

  // Lenient: 100 requests per minute
  LENIENT: { windowMs: 60 * 1000, maxRequests: 100 },

  // Auth: 5 login attempts per 15 minutes
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 },

  // Search: 60 requests per minute
  SEARCH: { windowMs: 60 * 1000, maxRequests: 60 },

  // Booking: 20 requests per minute
  BOOKING: { windowMs: 60 * 1000, maxRequests: 20 },

  // Payment: 10 requests per minute
  PAYMENT: { windowMs: 60 * 1000, maxRequests: 10 },
}

/**
 * Rate limit response helper
 * Returns a properly formatted rate limit error response
 */
export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      },
    }
  )
}
