import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'
import {
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
} from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Check rate limit first
  const rateLimitResult = await checkRateLimit(request)

  if (rateLimitResult && !rateLimitResult.success) {
    // Rate limit exceeded
    return createRateLimitResponse(rateLimitResult)
  }

  // Continue with session handling
  const response = await updateSession(request)

  // Add rate limit headers to successful responses
  if (rateLimitResult && response) {
    return addRateLimitHeaders(response, rateLimitResult)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
