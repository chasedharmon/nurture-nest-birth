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

/**
 * Check rate limit for an API key
 * Uses the API key's configured rate limit (requests per minute)
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  requestsPerMinute: number
): Promise<RateLimitResult | null> {
  const redisClient = getRedis()
  if (!redisClient) return null

  // Create a rate limiter for this specific API key's limit
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(requestsPerMinute, '1 m'),
    analytics: true,
    prefix: `ratelimit:apikey`,
  })

  const result = await limiter.limit(apiKeyId)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Record API key usage for analytics
 */
export async function recordApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  success: boolean
): Promise<void> {
  const redisClient = getRedis()
  if (!redisClient) return

  const now = new Date()
  const hourKey = `apikey:usage:${apiKeyId}:${now.toISOString().slice(0, 13)}`
  const dayKey = `apikey:usage:${apiKeyId}:${now.toISOString().slice(0, 10)}`

  try {
    // Increment hourly and daily counters
    await Promise.all([
      redisClient.hincrby(hourKey, success ? 'success' : 'failure', 1),
      redisClient.hincrby(hourKey, 'total', 1),
      redisClient.hincrby(hourKey, `endpoint:${endpoint}`, 1),
      redisClient.expire(hourKey, 86400), // 24 hours
      redisClient.hincrby(dayKey, success ? 'success' : 'failure', 1),
      redisClient.hincrby(dayKey, 'total', 1),
      redisClient.expire(dayKey, 604800), // 7 days
    ])
  } catch (error) {
    console.error('[RateLimit] Error recording API key usage:', error)
  }
}

/**
 * Get API key usage stats
 */
export async function getApiKeyUsageStats(
  apiKeyId: string,
  hours: number = 24
): Promise<{
  total: number
  success: number
  failure: number
  hourlyBreakdown: { hour: string; total: number }[]
} | null> {
  const redisClient = getRedis()
  if (!redisClient) return null

  try {
    const now = new Date()
    const hourlyBreakdown: { hour: string; total: number }[] = []
    let total = 0
    let success = 0
    let failure = 0

    for (let i = 0; i < hours; i++) {
      const date = new Date(now.getTime() - i * 3600000)
      const hourKey = `apikey:usage:${apiKeyId}:${date.toISOString().slice(0, 13)}`

      const data = await redisClient.hgetall(hourKey)
      if (data) {
        const hourTotal = parseInt(String(data.total) || '0', 10)
        total += hourTotal
        success += parseInt(String(data.success) || '0', 10)
        failure += parseInt(String(data.failure) || '0', 10)
        hourlyBreakdown.push({
          hour: date.toISOString().slice(0, 13),
          total: hourTotal,
        })
      }
    }

    return {
      total,
      success,
      failure,
      hourlyBreakdown: hourlyBreakdown.reverse(),
    }
  } catch (error) {
    console.error('[RateLimit] Error getting API key usage stats:', error)
    return null
  }
}
