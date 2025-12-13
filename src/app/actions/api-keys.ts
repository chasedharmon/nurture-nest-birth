'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface ApiKey {
  id: string
  organization_id: string | null
  name: string
  description: string | null
  key_prefix: string
  permissions: Record<string, string[]>
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  rate_limit_per_day: number
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
  revoked_at: string | null
  revoke_reason: string | null
  // Joined data
  created_by_user?: {
    email: string
    full_name: string | null
  } | null
}

export interface CreateApiKeyParams {
  name: string
  description?: string
  permissions: Record<string, string[]>
  rateLimitPerMinute?: number
  rateLimitPerHour?: number
  rateLimitPerDay?: number
  expiresAt?: string | null
}

export interface UpdateApiKeyParams {
  name?: string
  description?: string
  permissions?: Record<string, string[]>
  rateLimitPerMinute?: number
  rateLimitPerHour?: number
  rateLimitPerDay?: number
  expiresAt?: string | null
  isActive?: boolean
}

export interface ApiKeyUsageStats {
  totalRequests: number
  requestsToday: number
  requestsThisHour: number
  averageResponseTime: number
  topEndpoints: { endpoint: string; count: number }[]
}

/**
 * Generate a secure API key
 * Format: nn_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 random chars after prefix)
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'nn_live_'
  const randomPart = crypto.randomBytes(24).toString('base64url') // ~32 chars
  const key = `${prefix}${randomPart}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')

  return { key, prefix, hash }
}

/**
 * Get all API keys for the current organization
 */
export async function getApiKeys(): Promise<{
  success: boolean
  keys?: ApiKey[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('api_keys')
      .select(
        `
        *,
        created_by_user:users!api_keys_created_by_fkey(email, full_name)
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return { success: false, error: error.message }
    }

    return { success: true, keys: data as ApiKey[] }
  } catch (error) {
    console.error('Error in getApiKeys:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a new API key
 * Returns the full key ONLY ONCE - it cannot be retrieved again
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<{
  success: boolean
  key?: ApiKey
  fullKey?: string // Only returned on creation
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get organization ID
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    // Generate the API key
    const { key, prefix, hash } = generateApiKey()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: membership?.organization_id ?? null,
        name: params.name,
        description: params.description ?? null,
        key_prefix: prefix,
        key_hash: hash,
        permissions: params.permissions,
        rate_limit_per_minute: params.rateLimitPerMinute ?? 60,
        rate_limit_per_hour: params.rateLimitPerHour ?? 1000,
        rate_limit_per_day: params.rateLimitPerDay ?? 10000,
        expires_at: params.expiresAt ?? null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      key: data as ApiKey,
      fullKey: key, // This is the ONLY time the full key is available
    }
  } catch (error) {
    console.error('Error in createApiKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update an API key
 */
export async function updateApiKey(
  id: string,
  params: UpdateApiKeyParams
): Promise<{
  success: boolean
  key?: ApiKey
  error?: string
}> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (params.name !== undefined) updateData.name = params.name
    if (params.description !== undefined)
      updateData.description = params.description
    if (params.permissions !== undefined)
      updateData.permissions = params.permissions
    if (params.rateLimitPerMinute !== undefined)
      updateData.rate_limit_per_minute = params.rateLimitPerMinute
    if (params.rateLimitPerHour !== undefined)
      updateData.rate_limit_per_hour = params.rateLimitPerHour
    if (params.rateLimitPerDay !== undefined)
      updateData.rate_limit_per_day = params.rateLimitPerDay
    if (params.expiresAt !== undefined) updateData.expires_at = params.expiresAt
    if (params.isActive !== undefined) updateData.is_active = params.isActive

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating API key:', error)
      return { success: false, error: error.message }
    }

    return { success: true, key: data as ApiKey }
  } catch (error) {
    console.error('Error in updateApiKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  id: string,
  reason?: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error revoking API key:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in revokeApiKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('api_keys').delete().eq('id', id)

    if (error) {
      console.error('Error deleting API key:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteApiKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get usage statistics for an API key
 */
export async function getApiKeyUsage(id: string): Promise<{
  success: boolean
  stats?: ApiKeyUsageStats
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get total requests
    const { count: totalRequests } = await supabase
      .from('api_key_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', id)

    // Get today's requests
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: requestsToday } = await supabase
      .from('api_key_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', id)
      .gte('request_timestamp', today.toISOString())

    // Get this hour's requests
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { count: requestsThisHour } = await supabase
      .from('api_key_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', id)
      .gte('request_timestamp', oneHourAgo.toISOString())

    // Get average response time
    const { data: responseTimeData } = await supabase
      .from('api_key_usage')
      .select('response_time_ms')
      .eq('api_key_id', id)
      .not('response_time_ms', 'is', null)
      .limit(1000)

    const responseTimes = responseTimeData?.map(r => r.response_time_ms) ?? []
    const averageResponseTime =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          )
        : 0

    // Get top endpoints
    const { data: endpointData } = await supabase
      .from('api_key_usage')
      .select('endpoint')
      .eq('api_key_id', id)

    const endpointCounts = (endpointData ?? []).reduce(
      (acc, { endpoint }) => {
        acc[endpoint] = (acc[endpoint] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      success: true,
      stats: {
        totalRequests: totalRequests ?? 0,
        requestsToday: requestsToday ?? 0,
        requestsThisHour: requestsThisHour ?? 0,
        averageResponseTime,
        topEndpoints,
      },
    }
  } catch (error) {
    console.error('Error in getApiKeyUsage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Regenerate an API key (creates new key, invalidates old one)
 * Returns the new full key ONLY ONCE
 */
export async function regenerateApiKey(id: string): Promise<{
  success: boolean
  key?: ApiKey
  fullKey?: string
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get existing key details
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingKey) {
      return { success: false, error: 'API key not found' }
    }

    // Generate new key
    const { key, prefix, hash } = generateApiKey()

    // Update with new key hash
    const { data, error } = await supabase
      .from('api_keys')
      .update({
        key_prefix: prefix,
        key_hash: hash,
        updated_at: new Date().toISOString(),
        last_used_at: null, // Reset last used
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error regenerating API key:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      key: data as ApiKey,
      fullKey: key,
    }
  } catch (error) {
    console.error('Error in regenerateApiKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
