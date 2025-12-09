/**
 * Feature Flags Library
 *
 * Provides feature flag checking based on organization subscription tier.
 * This is the foundation for gating features behind subscription tiers.
 *
 * Usage:
 *   const flags = await getOrganizationFeatures(organizationId);
 *   if (flags.sms_enabled) {
 *     // Allow SMS sending
 *   }
 *
 *   // Or use the helper:
 *   if (await canUseFeature(organizationId, 'sms_enabled')) {
 *     // Allow SMS
 *   }
 */

import { createClient } from '@/lib/supabase/server'
import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlags,
  SubscriptionTier,
} from '@/lib/supabase/types'

// =====================================================
// Feature Flag Checks
// =====================================================

/**
 * Get feature flags for an organization based on their subscription tier
 */
export async function getOrganizationFeatures(
  organizationId: string
): Promise<FeatureFlags> {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status, settings')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    // Default to starter tier if org not found
    console.error('Error fetching organization:', error)
    return DEFAULT_FEATURE_FLAGS.starter
  }

  // Get base features from tier
  const tier = (org.subscription_tier as SubscriptionTier) || 'starter'
  const baseFeatures = { ...DEFAULT_FEATURE_FLAGS[tier] }

  // If subscription is not active, restrict to starter features
  if (
    org.subscription_status !== 'active' &&
    org.subscription_status !== 'trialing'
  ) {
    return DEFAULT_FEATURE_FLAGS.starter
  }

  // Apply any custom feature overrides from org settings
  const customFeatures = (
    org.settings as { feature_overrides?: Partial<FeatureFlags> }
  )?.feature_overrides

  if (customFeatures) {
    return { ...baseFeatures, ...customFeatures }
  }

  return baseFeatures
}

/**
 * Check if a specific feature is enabled for an organization
 */
export async function canUseFeature(
  organizationId: string,
  feature: keyof FeatureFlags
): Promise<boolean> {
  const features = await getOrganizationFeatures(organizationId)
  const value = features[feature]

  // For numeric features, check if it's not 0 or -1 (unlimited)
  if (typeof value === 'number') {
    return value !== 0
  }

  return value === true
}

/**
 * Check if organization has reached a limit
 */
export async function isWithinLimit(
  organizationId: string,
  limitType: 'team_members' | 'clients' | 'workflows' | 'storage_mb',
  currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const features = await getOrganizationFeatures(organizationId)

  const limitMap: Record<typeof limitType, keyof FeatureFlags> = {
    team_members: 'max_team_members',
    clients: 'max_clients',
    workflows: 'max_workflows',
    storage_mb: 'max_storage_mb',
  }

  const limit = features[limitMap[limitType]] as number

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, current: currentCount }
  }

  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  }
}

// =====================================================
// Current Usage Helpers
// =====================================================

/**
 * Get current usage counts for an organization
 */
export async function getOrganizationUsage(organizationId: string): Promise<{
  team_members: number
  clients: number
  workflows: number
  storage_mb: number
}> {
  const supabase = await createClient()

  // Fetch counts in parallel
  const [teamMembersResult, clientsResult, workflowsResult, storageResult] =
    await Promise.all([
      supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('workflows')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      // Sum file sizes from client_documents
      supabase
        .from('client_documents')
        .select('file_size_bytes')
        .eq('organization_id', organizationId),
    ])

  // Calculate storage in MB from bytes
  // Handle NULL values by treating them as 0, then sum and convert to MB
  const totalBytes =
    storageResult.data?.reduce((sum, doc) => {
      return sum + (doc.file_size_bytes || 0)
    }, 0) || 0

  // Convert bytes to MB, rounded to 2 decimal places
  const storage_mb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100

  return {
    team_members: teamMembersResult.count || 0,
    clients: clientsResult.count || 0,
    workflows: workflowsResult.count || 0,
    storage_mb,
  }
}

/**
 * Check if organization can add more of a resource type
 */
export async function canAddMore(
  organizationId: string,
  resourceType: 'team_member' | 'client' | 'workflow'
): Promise<{
  allowed: boolean
  reason?: string
  limit?: number
  current?: number
}> {
  const usage = await getOrganizationUsage(organizationId)

  const typeMap: Record<
    typeof resourceType,
    'team_members' | 'clients' | 'workflows'
  > = {
    team_member: 'team_members',
    client: 'clients',
    workflow: 'workflows',
  }

  const limitResult = await isWithinLimit(
    organizationId,
    typeMap[resourceType],
    usage[typeMap[resourceType]]
  )

  if (!limitResult.allowed) {
    const friendlyNames: Record<typeof resourceType, string> = {
      team_member: 'team members',
      client: 'clients',
      workflow: 'workflows',
    }

    return {
      allowed: false,
      reason: `You've reached your limit of ${limitResult.limit} ${friendlyNames[resourceType]}. Upgrade your plan to add more.`,
      limit: limitResult.limit,
      current: limitResult.current,
    }
  }

  return { allowed: true }
}

// =====================================================
// Tier Comparison Helpers
// =====================================================

export interface TierComparison {
  currentTier: SubscriptionTier
  upgradeTier: SubscriptionTier
  improvements: string[]
}

/**
 * Get list of improvements from upgrading to a higher tier
 */
export function getTierUpgradeImprovements(
  currentTier: SubscriptionTier,
  upgradeTier: SubscriptionTier
): string[] {
  const current = DEFAULT_FEATURE_FLAGS[currentTier]
  const upgrade = DEFAULT_FEATURE_FLAGS[upgradeTier]
  const improvements: string[] = []

  // Compare numeric limits
  if (upgrade.max_team_members > current.max_team_members) {
    improvements.push(
      `Increase team members from ${current.max_team_members} to ${upgrade.max_team_members === -1 ? 'unlimited' : upgrade.max_team_members}`
    )
  }

  if (upgrade.max_clients > current.max_clients) {
    improvements.push(
      `Increase clients from ${current.max_clients} to ${upgrade.max_clients === -1 ? 'unlimited' : upgrade.max_clients}`
    )
  }

  if (upgrade.max_workflows > current.max_workflows) {
    improvements.push(
      `Increase workflows from ${current.max_workflows} to ${upgrade.max_workflows === -1 ? 'unlimited' : upgrade.max_workflows}`
    )
  }

  // Compare boolean features
  if (!current.sms_enabled && upgrade.sms_enabled) {
    improvements.push('Enable SMS messaging')
  }

  if (!current.custom_branding && upgrade.custom_branding) {
    improvements.push('Custom branding')
  }

  if (!current.advanced_reports && upgrade.advanced_reports) {
    improvements.push('Advanced analytics & reports')
  }

  if (!current.api_access && upgrade.api_access) {
    improvements.push('API access')
  }

  if (!current.priority_support && upgrade.priority_support) {
    improvements.push('Priority support')
  }

  if (!current.white_label && upgrade.white_label) {
    improvements.push('White-label branding')
  }

  if (!current.custom_domain && upgrade.custom_domain) {
    improvements.push('Custom domain')
  }

  return improvements
}

/**
 * Get the next upgrade tier for a given tier
 */
export function getNextTier(
  currentTier: SubscriptionTier
): SubscriptionTier | null {
  const tierOrder: SubscriptionTier[] = [
    'starter',
    'professional',
    'enterprise',
  ]
  const currentIndex = tierOrder.indexOf(currentTier)

  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return null // Already at highest tier or custom
  }

  return tierOrder[currentIndex + 1] ?? null
}

// =====================================================
// Feature Gate Component Helper
// =====================================================

export interface FeatureGateResult {
  allowed: boolean
  reason?: string
  upgradeTier?: SubscriptionTier
  upgradeMessage?: string
}

/**
 * Check if a feature is available, with upgrade messaging
 */
export async function checkFeatureAccess(
  organizationId: string,
  feature: keyof FeatureFlags
): Promise<FeatureGateResult> {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    }
  }

  const currentTier = (org.subscription_tier as SubscriptionTier) || 'starter'
  const features = await getOrganizationFeatures(organizationId)
  const featureValue = features[feature]

  // Check if feature is available
  const isAvailable =
    typeof featureValue === 'boolean' ? featureValue : featureValue !== 0

  if (isAvailable) {
    return { allowed: true }
  }

  // Feature not available - find upgrade tier that enables it
  const tierOrder: SubscriptionTier[] = [
    'starter',
    'professional',
    'enterprise',
  ]
  const currentIndex = tierOrder.indexOf(currentTier)

  for (let i = currentIndex + 1; i < tierOrder.length; i++) {
    const upgradeTier = tierOrder[i]
    if (!upgradeTier) continue

    const upgradeTierFlags = DEFAULT_FEATURE_FLAGS[upgradeTier]
    const upgradeValue = upgradeTierFlags[feature]
    const upgradeHasFeature =
      typeof upgradeValue === 'boolean' ? upgradeValue : upgradeValue !== 0

    if (upgradeHasFeature) {
      return {
        allowed: false,
        reason: `This feature requires a ${upgradeTier} plan`,
        upgradeTier: upgradeTier,
        upgradeMessage: `Upgrade to ${upgradeTier} to unlock this feature`,
      }
    }
  }

  return {
    allowed: false,
    reason: 'Feature not available',
  }
}
