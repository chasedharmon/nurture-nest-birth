'use server'

/**
 * Super-Admin Server Actions
 *
 * Platform-level administrative actions for tenant management.
 * All actions require `is_platform_admin = true` on the current user.
 */

import { revalidatePath } from 'next/cache'

import { tenantDefaults } from '@/config/platform'
import { createAdminClient } from '@/lib/supabase/server'
import {
  requirePlatformAdmin,
  listTenants as listTenantsUtil,
  getTenantDetails as getTenantDetailsUtil,
  getTenantUsage as getTenantUsageUtil,
  suspendTenant as suspendTenantUtil,
  reactivateTenant as reactivateTenantUtil,
  updateTenantTier as updateTenantTierUtil,
  type TenantListItem,
} from '@/lib/platform/super-admin'
import type { Organization } from '@/lib/supabase/types'

// =====================================================
// Types
// =====================================================

export interface CreateTenantInput {
  orgName: string
  slug: string
  ownerEmail: string
  ownerName?: string
  tier?: 'starter' | 'professional' | 'business' | 'enterprise'
}

export interface CreateTenantResult {
  success: boolean
  data?: {
    organizationId: string
    userId: string
    membershipId: string
  }
  error?: string
}

export interface TenantListResult {
  success: boolean
  data?: {
    tenants: TenantListItem[]
    total: number
  }
  error?: string
}

export interface TenantDetailResult {
  success: boolean
  data?: {
    tenant: Organization
    usage: {
      teamMembers: number
      clients: number
      contacts: number
      leads: number
      workflows: number
    }
    owner: {
      id: string
      email: string
      full_name: string | null
    } | null
  }
  error?: string
}

export interface DashboardStats {
  totalTenants: number
  activeTenants: number
  trialingTenants: number
  suspendedTenants: number
  recentSignups: TenantListItem[]
}

export interface DashboardStatsResult {
  success: boolean
  data?: DashboardStats
  error?: string
}

// =====================================================
// Dashboard Actions
// =====================================================

/**
 * Get dashboard statistics for the super-admin overview
 */
export async function getDashboardStats(): Promise<DashboardStatsResult> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Get counts by status
    const [totalResult, activeResult, trialingResult, suspendedResult] =
      await Promise.all([
        supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_status', 'active'),
        supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_status', 'trialing'),
        supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_status', 'suspended'),
      ])

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentOrgs } = await supabase
      .from('organizations')
      .select(
        `
        id,
        name,
        slug,
        subscription_status,
        subscription_tier,
        created_at,
        owner_user_id
      `
      )
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch owner emails separately (no FK constraint exists)
    const ownerIds = (recentOrgs || [])
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

    const recentSignups: TenantListItem[] = (recentOrgs || []).map(
      (org: Record<string, unknown>) => ({
        id: org.id as string,
        name: org.name as string,
        slug: org.slug as string,
        subscription_status: org.subscription_status as string,
        subscription_tier: org.subscription_tier as string,
        owner_email: org.owner_user_id
          ? ownerEmails[org.owner_user_id as string] || null
          : null,
        member_count: 0, // Not fetching for recent list
        created_at: org.created_at as string,
      })
    )

    return {
      success: true,
      data: {
        totalTenants: totalResult.count || 0,
        activeTenants: activeResult.count || 0,
        trialingTenants: trialingResult.count || 0,
        suspendedTenants: suspendedResult.count || 0,
        recentSignups,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    }
  }
}

// =====================================================
// Tenant List Actions
// =====================================================

/**
 * List all tenants with filtering and pagination
 */
export async function getTenants(options?: {
  search?: string
  status?: string
  tier?: string
  limit?: number
  offset?: number
}): Promise<TenantListResult> {
  try {
    const result = await listTenantsUtil(options)
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tenants',
    }
  }
}

// =====================================================
// Tenant Detail Actions
// =====================================================

/**
 * Get detailed information about a specific tenant
 */
export async function getTenant(tenantId: string): Promise<TenantDetailResult> {
  try {
    const tenant = await getTenantDetailsUtil(tenantId)

    if (!tenant) {
      return {
        success: false,
        error: 'Tenant not found',
      }
    }

    const usage = await getTenantUsageUtil(tenantId)

    // Get owner details
    const supabase = createAdminClient()
    let owner = null

    if (tenant.owner_user_id) {
      const { data: ownerData } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', tenant.owner_user_id)
        .single()

      owner = ownerData
    }

    return {
      success: true,
      data: {
        tenant,
        usage: usage || {
          teamMembers: 0,
          clients: 0,
          contacts: 0,
          leads: 0,
          workflows: 0,
        },
        owner,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get tenant details',
    }
  }
}

// =====================================================
// Tenant Provisioning Actions
// =====================================================

/**
 * Create a new tenant (organization) with owner user
 *
 * This is the core provisioning action that:
 * 1. Creates or finds the owner user
 * 2. Creates the organization
 * 3. Creates the membership with 'owner' role
 */
export async function createTenant(
  input: CreateTenantInput
): Promise<CreateTenantResult> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Validate slug format
    const slugRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
    if (!slugRegex.test(input.slug)) {
      return {
        success: false,
        error:
          'Invalid slug format. Use lowercase letters, numbers, and hyphens only.',
      }
    }

    // Check if slug is already taken
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', input.slug)
      .single()

    if (existingOrg) {
      return {
        success: false,
        error: 'Organization slug is already taken',
      }
    }

    // Find or create the owner user
    let userId: string

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.ownerEmail.toLowerCase())
      .single()

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create a new user record
      // Note: In production, you'd send an invitation email
      // For now, we create the user record directly
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: input.ownerEmail.toLowerCase(),
          full_name: input.ownerName || null,
        })
        .select('id')
        .single()

      if (userError || !newUser) {
        return {
          success: false,
          error: `Failed to create user: ${userError?.message || 'Unknown error'}`,
        }
      }

      userId = newUser.id
    }

    // Determine tier limits
    const tier = input.tier || tenantDefaults.subscriptionTier
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
        max_team_members: -1,
        max_clients: -1,
        max_workflows: -1,
        max_storage_mb: -1,
      },
    }

    const limits = tierLimits[tier] || tierLimits.starter

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: input.orgName,
        slug: input.slug,
        owner_user_id: userId,
        subscription_status: 'trialing',
        subscription_tier: tier,
        trial_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
        ...limits,
        primary_color: tenantDefaults.branding.primaryColor,
        secondary_color: tenantDefaults.branding.secondaryColor,
        settings: tenantDefaults.settings,
      })
      .select('id')
      .single()

    if (orgError || !org) {
      return {
        success: false,
        error: `Failed to create organization: ${orgError?.message || 'Unknown error'}`,
      }
    }

    // Create the owner membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        is_active: true,
        accepted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (membershipError || !membership) {
      // Rollback: delete the organization
      await supabase.from('organizations').delete().eq('id', org.id)
      return {
        success: false,
        error: `Failed to create membership: ${membershipError?.message || 'Unknown error'}`,
      }
    }

    // Revalidate tenant list pages
    revalidatePath('/super-admin')
    revalidatePath('/super-admin/tenants')

    return {
      success: true,
      data: {
        organizationId: org.id,
        userId,
        membershipId: membership.id,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tenant',
    }
  }
}

// =====================================================
// Tenant Update Actions
// =====================================================

/**
 * Update a tenant's basic information
 */
export async function updateTenant(
  tenantId: string,
  updates: {
    name?: string
    billing_email?: string
    billing_name?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', tenantId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/super-admin/tenants/${tenantId}`)
    revalidatePath('/super-admin/tenants')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tenant',
    }
  }
}

/**
 * Update a tenant's subscription tier
 */
export async function updateTier(
  tenantId: string,
  tier: 'starter' | 'professional' | 'business' | 'enterprise'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await updateTenantTierUtil(tenantId, tier)

    if (result.success) {
      revalidatePath(`/super-admin/tenants/${tenantId}`)
      revalidatePath('/super-admin/tenants')
    }

    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tier',
    }
  }
}

/**
 * Suspend a tenant
 */
export async function suspendTenant(
  tenantId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await suspendTenantUtil(tenantId, reason)

    if (result.success) {
      revalidatePath(`/super-admin/tenants/${tenantId}`)
      revalidatePath('/super-admin/tenants')
      revalidatePath('/super-admin')
    }

    return result
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to suspend tenant',
    }
  }
}

/**
 * Reactivate a suspended tenant
 */
export async function reactivateTenant(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await reactivateTenantUtil(tenantId)

    if (result.success) {
      revalidatePath(`/super-admin/tenants/${tenantId}`)
      revalidatePath('/super-admin/tenants')
      revalidatePath('/super-admin')
    }

    return result
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reactivate tenant',
    }
  }
}

// =====================================================
// Impersonation Actions
// =====================================================

/**
 * Get members of a tenant for impersonation selection
 */
export async function getTenantMembers(tenantId: string): Promise<{
  success: boolean
  data?: Array<{
    id: string
    user_id: string
    role: string
    user: {
      id: string
      email: string
      full_name: string | null
    }
  }>
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('organization_memberships')
      .select(
        `
        id,
        user_id,
        role,
        users!organization_memberships_user_id_fkey(id, email, full_name)
      `
      )
      .eq('organization_id', tenantId)
      .eq('is_active', true)
      .order('role')

    if (error) {
      return { success: false, error: error.message }
    }

    // Transform the data to flatten the user object
    const members = (data || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      user_id: m.user_id as string,
      role: m.role as string,
      user: m.users as { id: string; email: string; full_name: string | null },
    }))

    return { success: true, data: members }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get tenant members',
    }
  }
}
