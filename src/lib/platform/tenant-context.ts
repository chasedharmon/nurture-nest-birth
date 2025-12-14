/**
 * Tenant Context - Server-Side Organization Resolution
 *
 * This module provides server-side utilities for resolving the current tenant (organization)
 * from various sources: session, subdomain, or explicit ID.
 *
 * Current implementation: Session-based (user's active membership)
 * Future: Subdomain-based when domain is purchased
 */

import { cache } from 'react'

import { getBranding, tenantDefaults } from '@/config/platform'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Organization, OrganizationMembership } from '@/lib/supabase/types'

// =====================================================
// Types
// =====================================================

export interface TenantContext {
  organization: Organization
  membership: OrganizationMembership
  branding: TenantBranding
  userId: string
}

export interface TenantBranding {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string | null
  faviconUrl: string | null
  fontFamily: string
  customCss?: string | null
}

export type TenantResolutionResult =
  | {
      success: true
      context: TenantContext
    }
  | {
      success: false
      error: TenantResolutionError
      redirectTo?: string
    }

export type TenantResolutionError =
  | 'NO_USER' // User not authenticated
  | 'NO_MEMBERSHIP' // User has no active organization membership
  | 'ORG_NOT_FOUND' // Organization not found (deleted or invalid)
  | 'ORG_SUSPENDED' // Organization is suspended
  | 'MEMBERSHIP_INACTIVE' // User's membership is inactive

// =====================================================
// Core Resolution Functions
// =====================================================

/**
 * Get the current tenant context from the authenticated user's session
 * This is the primary method for resolving tenant context
 *
 * Uses React's cache() for request-level memoization
 */
export const getTenantContext = cache(
  async (): Promise<TenantResolutionResult> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'NO_USER',
        redirectTo: '/login',
      }
    }

    // Use admin client for membership/org queries to bypass RLS
    // This is safe because we've already verified the user is authenticated
    // and we're only querying data for the authenticated user's ID
    const adminClient = createAdminClient()

    // Get user's active organization membership
    const { data: membershipData, error: membershipError } = await adminClient
      .from('organization_memberships')
      .select(
        `
        *,
        organization:organizations(*)
      `
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (membershipError || !membershipData) {
      // Try legacy fallback: user.organization_id
      const { data: userData } = await adminClient
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (userData?.organization_id) {
        const { data: orgData, error: orgError } = await adminClient
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single()

        if (orgError || !orgData) {
          return {
            success: false,
            error: 'ORG_NOT_FOUND',
            redirectTo: '/onboarding',
          }
        }

        // Create synthetic membership for legacy users
        const syntheticMembership: OrganizationMembership = {
          id: `legacy-${user.id}`,
          organization_id: orgData.id,
          user_id: user.id,
          role: 'owner', // Assume owner for legacy
          is_active: true,
          created_at: orgData.created_at,
          updated_at: orgData.updated_at,
          organization: orgData,
        }

        return buildTenantContext(orgData, syntheticMembership, user.id)
      }

      return {
        success: false,
        error: 'NO_MEMBERSHIP',
        redirectTo: '/onboarding',
      }
    }

    const organization = membershipData.organization as Organization

    // Check organization status
    if (organization.subscription_status === 'suspended') {
      return {
        success: false,
        error: 'ORG_SUSPENDED',
        redirectTo: '/account-suspended',
      }
    }

    if (!membershipData.is_active) {
      return {
        success: false,
        error: 'MEMBERSHIP_INACTIVE',
        redirectTo: '/membership-inactive',
      }
    }

    return buildTenantContext(organization, membershipData, user.id)
  }
)

/**
 * Build the full tenant context with resolved branding
 */
function buildTenantContext(
  organization: Organization,
  membership: OrganizationMembership,
  userId: string
): TenantResolutionResult {
  // Get branding with platform fallbacks
  const branding = getBranding({
    primaryColor: organization.primary_color,
    secondaryColor: organization.secondary_color,
    logoUrl: organization.logo_url,
  })

  return {
    success: true,
    context: {
      organization,
      membership,
      userId,
      branding: {
        ...branding,
        customCss: null, // TODO: Pull from tenant_branding table when created
      },
    },
  }
}

// =====================================================
// Convenience Functions
// =====================================================

/**
 * Get just the organization from the current session
 * Throws if no tenant context available
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const result = await getTenantContext()

  if (!result.success) {
    throw new Error(`Tenant context required but unavailable: ${result.error}`)
  }

  return result.context
}

/**
 * Get the current organization ID (cached)
 * Returns null if not authenticated or no membership
 */
export const getCurrentOrganizationId = cache(
  async (): Promise<string | null> => {
    const result = await getTenantContext()
    return result.success ? result.context.organization.id : null
  }
)

/**
 * Get the current organization (cached)
 * Returns null if not authenticated or no membership
 */
export const getCurrentOrganization = cache(
  async (): Promise<Organization | null> => {
    const result = await getTenantContext()
    return result.success ? result.context.organization : null
  }
)

/**
 * Get current user's role in the organization
 */
export const getCurrentUserRole = cache(async () => {
  const result = await getTenantContext()
  return result.success ? result.context.membership.role : null
})

/**
 * Check if current user has at least the specified role
 */
export async function hasMinimumRole(
  minimumRole: 'viewer' | 'member' | 'admin' | 'owner'
): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (!role) return false

  const roleHierarchy = ['viewer', 'member', 'admin', 'owner']
  const userRoleIndex = roleHierarchy.indexOf(role)
  const minimumRoleIndex = roleHierarchy.indexOf(minimumRole)

  return userRoleIndex >= minimumRoleIndex
}

// =====================================================
// Future: Subdomain-Based Resolution
// =====================================================

/**
 * Resolve organization from subdomain
 * TODO: Enable when domain is purchased and subdomain routing is configured
 *
 * @example
 * // Given URL: https://acme.birthcrm.com
 * const org = await resolveOrganizationFromSubdomain('acme')
 */
export async function resolveOrganizationFromSubdomain(
  subdomain: string
): Promise<Organization | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', subdomain)
    .single()

  return data
}

/**
 * Parse subdomain from hostname
 * Returns null if on main domain or localhost
 */
export function parseSubdomain(hostname: string): string | null {
  // Skip parsing for localhost development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return null
  }

  // Skip if no subdomain (e.g., birthcrm.com)
  const parts = hostname.split('.')
  if (parts.length <= 2) {
    return null
  }

  // Return the subdomain (e.g., 'acme' from 'acme.birthcrm.com')
  const subdomain = parts[0]

  // Check subdomain exists
  if (!subdomain) {
    return null
  }

  // Skip common non-tenant subdomains
  const reservedSubdomains = ['www', 'api', 'app', 'admin', 'super-admin']
  if (reservedSubdomains.includes(subdomain)) {
    return null
  }

  return subdomain
}

// =====================================================
// Initialization & Defaults
// =====================================================

/**
 * Get default settings for tenant initialization
 */
export function getTenantDefaultSettings() {
  return tenantDefaults.settings
}

/**
 * Get default branding for tenant initialization
 */
export function getTenantDefaultBranding() {
  return tenantDefaults.branding
}
