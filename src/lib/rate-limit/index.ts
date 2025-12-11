/**
 * Rate Limiting with Upstash Redis
 *
 * Provides rate limiting for API routes and authentication endpoints.
 * Uses sliding window algorithm for smooth rate limiting.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Redis client (lazy initialization)
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn(
      '[RateLimit] Upstash credentials not configured - rate limiting disabled'
    )
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// Rate limiter configurations
type RateLimitConfig = {
  requests: number
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Standard API rate limit
  api: { requests: 60, window: '1 m' },

  // Auth endpoints (stricter to prevent brute force)
  auth: { requests: 5, window: '1 m' },

  // Webhook endpoints (higher limit for Stripe bursts)
  webhooks: { requests: 100, window: '1 m' },

  // Cron jobs (internal only, minimal limit)
  cron: { requests: 10, window: '1 m' },

  // Public form submissions
  forms: { requests: 10, window: '1 m' },
}

// Cached rate limiters
const rateLimiters: Record<string, Ratelimit> = {}

type RateLimitType = 'api' | 'auth' | 'webhooks' | 'cron' | 'forms'

function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  const existing = rateLimiters[type]
  if (existing) return existing

  const config = RATE_LIMITS[type]
  if (!config) return null

  const newLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `ratelimit:${type}`,
  })
  rateLimiters[type] = newLimiter

  return newLimiter
}

/**
 * Get a unique identifier for the request
 * Uses IP address, falling back to a hash of headers if not available
 */
function getIdentifier(request: NextRequest): string {
  // Try x-forwarded-for first (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]
    if (firstIp) {
      return firstIp.trim()
    }
  }

  // Try x-real-ip
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a combination of headers
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const accept = request.headers.get('accept') || 'unknown'
  return `anonymous:${hashString(`${userAgent}:${accept}`)}`
}

/**
 * Simple string hashing function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Determine which rate limit category applies to a request path
 */
function getRateLimitType(pathname: string): RateLimitType {
  // Auth endpoints
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/client/login') ||
    pathname.startsWith('/login') ||
    pathname.includes('/signin') ||
    pathname.includes('/signup')
  ) {
    return 'auth'
  }

  // Webhook endpoints
  if (pathname.startsWith('/api/webhooks')) {
    return 'webhooks'
  }

  // Cron endpoints
  if (pathname.startsWith('/api/cron')) {
    return 'cron'
  }

  // Form submissions
  if (
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/api/newsletter')
  ) {
    return 'forms'
  }

  // Default API rate limit
  return 'api'
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for a request
 * Returns null if rate limiting is not configured
 */
export async function checkRateLimit(
  request: NextRequest
): Promise<RateLimitResult | null> {
  const pathname = request.nextUrl.pathname

  // Skip rate limiting for static files and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return null
  }

  const type = getRateLimitType(pathname)
  const limiter = getRateLimiter(type)

  if (!limiter) {
    // Rate limiting not configured
    return null
  }

  const identifier = getIdentifier(request)
  const result = await limiter.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return response
}
