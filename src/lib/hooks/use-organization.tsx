/**
 * Organization Context Hook
 *
 * Provides access to the current organization and feature flags.
 * This hook should be used in components that need organization-scoped data.
 */

'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlags,
  Organization,
  OrganizationMembership,
  SubscriptionTier,
} from '@/lib/supabase/types'

// =====================================================
// Types
// =====================================================

interface OrganizationContextValue {
  organization: Organization | null
  membership: OrganizationMembership | null
  features: FeatureFlags
  isLoading: boolean
  error: Error | null

  // Actions
  refreshOrganization: () => Promise<void>

  // Feature checks (client-side)
  canUseFeature: (feature: keyof FeatureFlags) => boolean
  isWithinLimit: (
    limitType: 'team_members' | 'clients' | 'workflows',
    currentCount: number
  ) => { allowed: boolean; limit: number }
}

// =====================================================
// Context
// =====================================================

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
)

// =====================================================
// Provider
// =====================================================

interface OrganizationProviderProps {
  children: ReactNode
  initialOrganization?: Organization | null
  initialMembership?: OrganizationMembership | null
}

export function OrganizationProvider({
  children,
  initialOrganization = null,
  initialMembership = null,
}: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(
    initialOrganization
  )
  const [membership, setMembership] = useState<OrganizationMembership | null>(
    initialMembership
  )
  const [isLoading, setIsLoading] = useState(!initialOrganization)
  const [error, setError] = useState<Error | null>(null)

  // Compute features from organization tier
  const features: FeatureFlags = organization
    ? DEFAULT_FEATURE_FLAGS[
        (organization.subscription_tier as SubscriptionTier) || 'starter'
      ]
    : DEFAULT_FEATURE_FLAGS.starter

  // Fetch organization data
  const fetchOrganization = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setOrganization(null)
        setMembership(null)
        return
      }

      // Get user's organization membership
      const { data: membershipData, error: membershipError } = await supabase
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

      if (membershipError) {
        // No membership found - might be legacy user without org
        // Try to get org from users table
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (userData?.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userData.organization_id)
            .single()

          setOrganization(orgData)
        }

        return
      }

      setMembership(membershipData)
      setOrganization(membershipData.organization)
    } catch (err) {
      console.error('Error fetching organization:', err)
      setError(
        err instanceof Error ? err : new Error('Failed to fetch organization')
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (!initialOrganization) {
      fetchOrganization()
    }
  }, [fetchOrganization, initialOrganization])

  // Feature check helpers
  const canUseFeature = useCallback(
    (feature: keyof FeatureFlags): boolean => {
      const value = features[feature]
      if (typeof value === 'boolean') return value
      return value !== 0 // Numeric values: 0 means disabled, -1 means unlimited
    },
    [features]
  )

  const isWithinLimit = useCallback(
    (
      limitType: 'team_members' | 'clients' | 'workflows',
      currentCount: number
    ): { allowed: boolean; limit: number } => {
      const limitMap: Record<typeof limitType, keyof FeatureFlags> = {
        team_members: 'max_team_members',
        clients: 'max_clients',
        workflows: 'max_workflows',
      }

      const limit = features[limitMap[limitType]] as number

      // -1 means unlimited
      if (limit === -1) {
        return { allowed: true, limit: -1 }
      }

      return {
        allowed: currentCount < limit,
        limit,
      }
    },
    [features]
  )

  const value: OrganizationContextValue = {
    organization,
    membership,
    features,
    isLoading,
    error,
    refreshOrganization: fetchOrganization,
    canUseFeature,
    isWithinLimit,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

// =====================================================
// Hook
// =====================================================

export function useOrganization() {
  const context = useContext(OrganizationContext)

  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    )
  }

  return context
}

// =====================================================
// Server Action Helper
// =====================================================

/**
 * Get the current organization ID for server actions
 * This is used in server components and actions that need org context
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const supabase = await import('@/lib/supabase/server').then(m =>
    m.createClient()
  )

  const {
    data: { user },
  } = await (await supabase).auth.getUser()

  if (!user) return null

  // Get from organization_memberships first
  const { data: membership } = await (await supabase)
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (membership?.organization_id) {
    return membership.organization_id
  }

  // Fallback to users table
  const { data: userData } = await (await supabase)
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return userData?.organization_id || null
}
