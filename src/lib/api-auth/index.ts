/**
 * API Key Authentication and Rate Limiting
 *
 * Provides utilities for authenticating API requests using API keys
 * and enforcing per-key rate limits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import {
  checkApiKeyRateLimit,
  recordApiKeyUsage,
  createRateLimitResponse,
  addRateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit'

export interface ApiKeyInfo {
  id: string
  organizationId: string
  name: string
  permissions: Record<string, string[]>
  rateLimitRequestsPerMinute: number
}

export interface ApiAuthResult {
  success: boolean
  apiKey?: ApiKeyInfo
  error?: string
  rateLimitResult?: RateLimitResult
}

/**
 * Extract API key from request
 * Supports both Authorization header and X-API-Key header
 */
function extractApiKey(request: NextRequest): string | null {
  // Try Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  return null
}

/**
 * Hash an API key for comparison
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Validate an API key and check rate limits
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ApiAuthResult> {
  const apiKey = extractApiKey(request)

  if (!apiKey) {
    return {
      success: false,
      error:
        'API key required. Provide via Authorization header (Bearer token) or X-API-Key header.',
    }
  }

  // Extract prefix for lookup
  const prefix = apiKey.substring(0, 10)
  const keyHash = hashApiKey(apiKey)

  // Validate key against database
  const supabase = await createClient()

  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select(
      'id, organization_id, name, permissions, rate_limit_per_minute, revoked_at, expires_at'
    )
    .eq('key_prefix', prefix)
    .eq('key_hash', keyHash)
    .single()

  if (keyError || !keyData) {
    return {
      success: false,
      error: 'Invalid API key',
    }
  }

  // Check if revoked (revoked_at is a timestamp, null means not revoked)
  if (keyData.revoked_at) {
    return {
      success: false,
      error: 'API key has been revoked',
    }
  }

  // Check if expired
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return {
      success: false,
      error: 'API key has expired',
    }
  }

  const apiKeyInfo: ApiKeyInfo = {
    id: keyData.id,
    organizationId: keyData.organization_id,
    name: keyData.name,
    permissions: keyData.permissions || {},
    rateLimitRequestsPerMinute: keyData.rate_limit_per_minute || 60,
  }

  // Check rate limit
  const rateLimitResult = await checkApiKeyRateLimit(
    keyData.id,
    apiKeyInfo.rateLimitRequestsPerMinute
  )

  if (rateLimitResult && !rateLimitResult.success) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      rateLimitResult,
    }
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id)

  return {
    success: true,
    apiKey: apiKeyInfo,
    rateLimitResult: rateLimitResult || undefined,
  }
}

/**
 * Check if an API key has permission for a specific action
 */
export function hasPermission(
  apiKey: ApiKeyInfo,
  resource: string,
  action: string
): boolean {
  const resourcePermissions = apiKey.permissions[resource]
  if (!resourcePermissions) return false
  return (
    resourcePermissions.includes(action) || resourcePermissions.includes('*')
  )
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(
  error: string,
  rateLimitResult?: RateLimitResult
): NextResponse {
  if (rateLimitResult && !rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  return NextResponse.json(
    { error: 'Unauthorized', message: error },
    { status: 401 }
  )
}

/**
 * Create a forbidden response
 */
export function createForbiddenResponse(
  resource: string,
  action: string
): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: `You do not have permission to ${action} ${resource}`,
    },
    { status: 403 }
  )
}

/**
 * Middleware-style wrapper for API routes that require API key authentication
 */
export async function withApiKeyAuth<T>(
  request: NextRequest,
  handler: (apiKey: ApiKeyInfo) => Promise<NextResponse<T>>,
  options?: {
    requiredPermission?: { resource: string; action: string }
  }
): Promise<NextResponse> {
  const authResult = await validateApiKey(request)

  if (!authResult.success || !authResult.apiKey) {
    return createUnauthorizedResponse(
      authResult.error || 'Authentication failed',
      authResult.rateLimitResult
    )
  }

  // Check permission if required
  if (options?.requiredPermission) {
    const { resource, action } = options.requiredPermission
    if (!hasPermission(authResult.apiKey, resource, action)) {
      return createForbiddenResponse(resource, action)
    }
  }

  // Execute handler
  const endpoint = request.nextUrl.pathname
  let response: NextResponse

  try {
    response = await handler(authResult.apiKey)

    // Record successful usage
    recordApiKeyUsage(authResult.apiKey.id, endpoint, true)
  } catch (error) {
    // Record failed usage
    recordApiKeyUsage(authResult.apiKey.id, endpoint, false)
    throw error
  }

  // Add rate limit headers if available
  if (authResult.rateLimitResult) {
    return addRateLimitHeaders(response, authResult.rateLimitResult)
  }

  return response
}

/**
 * Get organization context from API key (for use in database queries)
 */
export function getOrganizationContext(apiKey: ApiKeyInfo): {
  organizationId: string
} {
  return {
    organizationId: apiKey.organizationId,
  }
}
