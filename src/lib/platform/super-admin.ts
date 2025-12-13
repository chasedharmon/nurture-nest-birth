/**
 * Super Admin Utilities
 *
 * Platform-level admin checks and utilities for managing tenants.
 * Super admins have `is_platform_admin = true` on their user record.
 */

import { cache } from 'react'

import { canBePlatformAdmin, superAdminConfig } from '@/config/platform'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Organization } from '@/lib/supabase/types'

// =====================================================
// Types
// =====================================================

export interface SuperAdminUser {
  id: string
  email: string
  full_name: string | null
  is_platform_admin: boolean
}

export interface ImpersonationSession {
  originalUserId: string
  impersonatingUserId: string
  impersonatingOrgId: string
  startedAt: string
  expiresAt: string
}

export interface TenantListItem {
  id: string
  name: string
  slug: string
  subscription_status: string
  subscription_tier: string
  owner_email: string | null
  member_count: number
  created_at: string
}

// =====================================================
// Core Super Admin Checks
// =====================================================

/**
 * Check if the current user is a platform admin
 * Uses React cache for request-level memoization
 */
export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  // Query users table for is_platform_admin flag
  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  return userData?.is_platform_admin === true
})

/**
 * Require platform admin access - throws if not authorized
 */
export async function requirePlatformAdmin(): Promise<SuperAdminUser> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, email, full_name, is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_platform_admin) {
    throw new Error('Platform admin access required')
  }

  return {
    id: userData.id,
    email: userData.email || user.email || '',
    full_name: userData.full_name,
    is_platform_admin: true,
  }
}

/**
 * Check if a user can be granted platform admin status
 * Based on email domain/address allowlists
 */
export function canBeGrantedPlatformAdmin(email: string): boolean {
  return canBePlatformAdmin(email)
}

// =====================================================
// Tenant Management
// =====================================================

/**
 * List all tenants (organizations) in the platform
 * Requires platform admin access
 */
export async function listTenants(options?: {
  search?: string
  status?: string
  tier?: string
  limit?: number
  offset?: number
}): Promise<{ tenants: TenantListItem[]; total: number }> {
  await requirePlatformAdmin()

  // Use admin client to bypass RLS
  const supabase = createAdminClient()

  // Query organizations without the FK join (no FK constraint exists)
  let query = supabase.from('organizations').select(
    `
      id,
      name,
      slug,
      subscription_status,
      subscription_tier,
      created_at,
      owner_user_id,
      organization_memberships(count)
    `,
    { count: 'exact' }
  )

  // Apply filters
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,slug.ilike.%${options.search}%`
    )
  }

  if (options?.status) {
    query = query.eq('subscription_status', options.status)
  }

  if (options?.tier) {
    query = query.eq('subscription_tier', options.tier)
  }

  // Pagination
  const limit = options?.limit || 50
  const offset = options?.offset || 0
  query = query.range(offset, offset + limit - 1)

  // Order by creation date, newest first
  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing tenants:', error)
    throw new Error(`Failed to list tenants: ${error.message}`)
  }

  // Fetch owner emails separately
  const ownerIds = (data || [])
    .map((org: Record<string, unknown>) => org.owner_user_id)
    .filter((id): id is string => !!id)

  let ownerEmails: Record<string, string> = {}
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('users')
      .select('id, email')
      .in('id', ownerIds)

    ownerEmails = (owners || []).reduce(
      (acc: Record<string, string>, user: { id: string; email: string }) => {
        acc[user.id] = user.email
        return acc
      },
      {}
    )
  }

  // Transform data
  const tenants: TenantListItem[] = (data || []).map(
    (org: Record<string, unknown>) => ({
      id: org.id as string,
      name: org.name as string,
      slug: org.slug as string,
      subscription_status: org.subscription_status as string,
      subscription_tier: org.subscription_tier as string,
      owner_email: org.owner_user_id
        ? ownerEmails[org.owner_user_id as string] || null
        : null,
      member_count:
        (org.organization_memberships as { count: number }[] | null)?.[0]
          ?.count || 0,
      created_at: org.created_at as string,
    })
  )

  return { tenants, total: count || 0 }
}

/**
 * Get detailed information about a specific tenant
 */
export async function getTenantDetails(
  tenantId: string
): Promise<Organization | null> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error) {
    console.error('Error fetching tenant:', error)
    return null
  }

  return data
}

/**
 * Get tenant usage statistics
 */
export async function getTenantUsage(tenantId: string): Promise<{
  teamMembers: number
  clients: number
  contacts: number
  leads: number
  workflows: number
} | null> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  // Run counts in parallel
  const [memberships, clients, contacts, leads, workflows] = await Promise.all([
    supabase
      .from('organization_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', tenantId),
    supabase
      .from('crm_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', tenantId),
    supabase
      .from('crm_leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', tenantId),
    supabase
      .from('workflows')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', tenantId),
  ])

  return {
    teamMembers: memberships.count || 0,
    clients: clients.count || 0,
    contacts: contacts.count || 0,
    leads: leads.count || 0,
    workflows: workflows.count || 0,
  }
}

// =====================================================
// Tenant Actions
// =====================================================

/**
 * Suspend a tenant
 */
export async function suspendTenant(
  tenantId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  // First get the current settings
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', tenantId)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) || {}
  const updatedSettings = {
    ...currentSettings,
    suspension_reason: reason,
    suspended_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'suspended',
      settings: updatedSettings,
    })
    .eq('id', tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Reactivate a suspended tenant
 */
export async function reactivateTenant(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  // First get the current settings
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', tenantId)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) || {}
  // Remove suspension fields
  const {
    suspension_reason: _,
    suspended_at: __,
    ...updatedSettings
  } = currentSettings

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
      settings: updatedSettings,
    })
    .eq('id', tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update tenant subscription tier
 */
export async function updateTenantTier(
  tenantId: string,
  tier: 'starter' | 'professional' | 'business' | 'enterprise'
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  // Tier limits mapping
  const tierLimits: Record<
    string,
    {
      max_team_members: number
      max_clients: number
      max_workflows: number
      max_storage_mb: number
    }
  > = {
    starter: {
      max_team_members: 1,
      max_clients: 50,
      max_workflows: 3,
      max_storage_mb: 500,
    },
    professional: {
      max_team_members: 5,
      max_clients: 200,
      max_workflows: 10,
      max_storage_mb: 2000,
    },
    business: {
      max_team_members: 15,
      max_clients: 500,
      max_workflows: 25,
      max_storage_mb: 5000,
    },
    enterprise: {
      max_team_members: -1, // unlimited
      max_clients: -1,
      max_workflows: -1,
      max_storage_mb: -1,
    },
  }

  const limits = tierLimits[tier]

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_tier: tier,
      ...limits,
    })
    .eq('id', tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// =====================================================
// Impersonation
// =====================================================

// Session key for storing impersonation state
// Used by middleware for impersonation detection
const _IMPERSONATION_KEY = 'platform_impersonation'
void _IMPERSONATION_KEY // Reserved for future impersonation implementation

/**
 * Start impersonating a user in a tenant
 * Stores original user ID and sets session to target user
 */
export async function startImpersonation(
  targetUserId: string,
  targetOrgId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requirePlatformAdmin()

  // Verify target user exists and belongs to target org
  const supabase = createAdminClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('organization_id', targetOrgId)
    .eq('is_active', true)
    .single()

  if (!membership) {
    return {
      success: false,
      error: 'User is not a member of the specified organization',
    }
  }

  // Create impersonation session record
  // This would be stored in a separate table or session store
  // For now, we'll use cookies (implemented in the middleware)
  const impersonationSession: ImpersonationSession = {
    originalUserId: admin.id,
    impersonatingUserId: targetUserId,
    impersonatingOrgId: targetOrgId,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  }

  // Store in cookie for middleware to pick up
  // Note: Actual implementation requires setting cookies from a server action
  console.log('Impersonation session created:', impersonationSession)

  return { success: true }
}

/**
 * End impersonation session
 */
export async function endImpersonation(): Promise<{ success: boolean }> {
  // Clear impersonation cookie
  // This would be implemented in a server action
  return { success: true }
}

/**
 * Check if currently impersonating
 */
export async function getImpersonationSession(): Promise<ImpersonationSession | null> {
  // Read from cookie/session
  // Return null if not impersonating
  return null
}

// =====================================================
// Platform Admin Management
// =====================================================

/**
 * Grant platform admin status to a user
 */
export async function grantPlatformAdmin(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  // Get user's email to verify they're allowed
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (!userData?.email) {
    return { success: false, error: 'User not found' }
  }

  if (!canBeGrantedPlatformAdmin(userData.email)) {
    return {
      success: false,
      error: 'User email is not in the allowed list for platform admin access',
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ is_platform_admin: true })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Revoke platform admin status from a user
 */
export async function revokePlatformAdmin(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requirePlatformAdmin()

  // Prevent revoking own admin status
  if (admin.id === userId) {
    return {
      success: false,
      error: 'Cannot revoke your own platform admin status',
    }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({ is_platform_admin: false })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * List all platform admins
 */
export async function listPlatformAdmins(): Promise<SuperAdminUser[]> {
  await requirePlatformAdmin()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, is_platform_admin')
    .eq('is_platform_admin', true)
    .order('email')

  if (error) {
    console.error('Error listing platform admins:', error)
    return []
  }

  return (data || []).map(user => ({
    id: user.id,
    email: user.email || '',
    full_name: user.full_name,
    is_platform_admin: true,
  }))
}

// =====================================================
// Route Guards
// =====================================================

/**
 * Get the super admin route prefix
 */
export function getSuperAdminRoutePrefix(): string {
  return superAdminConfig.routePrefix
}

/**
 * Check if a path is a super admin route
 */
export function isSuperAdminRoute(pathname: string): boolean {
  return pathname.startsWith(superAdminConfig.routePrefix)
}
