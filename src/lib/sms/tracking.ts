/**
 * SMS Usage Tracking Service
 *
 * Tracks SMS usage per organization for:
 * - Soft limit enforcement (warn but allow overage)
 * - Overage billing calculation
 * - Usage analytics and reporting
 *
 * Integrates with subscription tier limits from feature flags.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { getOrganizationFeatures } from '@/lib/features/flags'

// =====================================================
// Types
// =====================================================

export interface SmsUsageRecord {
  id: string
  organizationId: string
  billingPeriodStart: Date
  billingPeriodEnd: Date
  messagesSent: number
  segmentsSent: number
  messagesDelivered: number
  messagesFailed: number
  segmentsIncluded: number
  segmentsOverage: number
  overageCostCents: number
  providerMode: 'platform' | 'byot'
}

export interface SmsLimitCheck {
  canSend: boolean
  isOverLimit: boolean
  currentUsage: number
  includedLimit: number
  overageSegments: number
  warningMessage: string | null
  tierName: string
}

export interface UsageSummary {
  currentPeriod: SmsUsageRecord | null
  percentUsed: number
  isUnlimited: boolean
  smsEnabled: boolean
}

// =====================================================
// Constants
// =====================================================

// Cost per SMS segment for overage (in cents)
export const OVERAGE_COST_PER_SEGMENT_CENTS = 1 // $0.01 per segment

// =====================================================
// Usage Tracking Functions
// =====================================================

/**
 * Get or create the current billing period's usage record
 */
export async function getCurrentUsageRecord(
  organizationId: string
): Promise<SmsUsageRecord | null> {
  const supabase = createAdminClient()

  // Call the database function that handles period creation
  const { data, error } = await supabase.rpc('get_or_create_sms_usage', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('[SMS Tracking] Failed to get usage record:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    billingPeriodStart: new Date(data.billing_period_start),
    billingPeriodEnd: new Date(data.billing_period_end),
    messagesSent: data.messages_sent,
    segmentsSent: data.segments_sent,
    messagesDelivered: data.messages_delivered,
    messagesFailed: data.messages_failed,
    segmentsIncluded: data.segments_included,
    segmentsOverage: data.segments_overage,
    overageCostCents: data.overage_cost_cents,
    providerMode: data.provider_mode,
  }
}

/**
 * Increment usage after sending an SMS
 */
export async function incrementUsage(
  organizationId: string,
  segmentCount: number,
  delivered: boolean = false,
  failed: boolean = false
): Promise<SmsUsageRecord | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('increment_sms_usage', {
    p_organization_id: organizationId,
    p_segments: segmentCount,
    p_delivered: delivered,
    p_failed: failed,
  })

  if (error) {
    console.error('[SMS Tracking] Failed to increment usage:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    billingPeriodStart: new Date(data.billing_period_start),
    billingPeriodEnd: new Date(data.billing_period_end),
    messagesSent: data.messages_sent,
    segmentsSent: data.segments_sent,
    messagesDelivered: data.messages_delivered,
    messagesFailed: data.messages_failed,
    segmentsIncluded: data.segments_included,
    segmentsOverage: data.segments_overage,
    overageCostCents: data.overage_cost_cents,
    providerMode: data.provider_mode,
  }
}

/**
 * Update usage when delivery status is received
 */
export async function updateDeliveryStatus(
  organizationId: string,
  delivered: boolean,
  failed: boolean
): Promise<void> {
  const supabase = createAdminClient()

  // Get current usage record
  const usage = await getCurrentUsageRecord(organizationId)

  if (!usage) {
    return
  }

  // Update delivery/failure counts
  const { error } = await supabase
    .from('sms_usage')
    .update({
      messages_delivered: usage.messagesDelivered + (delivered ? 1 : 0),
      messages_failed: usage.messagesFailed + (failed ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', usage.id)

  if (error) {
    console.error('[SMS Tracking] Failed to update delivery status:', error)
  }
}

// =====================================================
// Limit Checking (Soft Limits)
// =====================================================

/**
 * Check if organization can send SMS (soft limit with overage)
 * Returns warning message if over limit but still allows sending
 */
export async function checkSmsLimit(
  organizationId: string,
  segmentsToSend: number = 1
): Promise<SmsLimitCheck> {
  // Get feature flags for this org
  const features = await getOrganizationFeatures(organizationId)

  // Check if SMS is enabled at all
  if (!features.sms_enabled) {
    return {
      canSend: false,
      isOverLimit: false,
      currentUsage: 0,
      includedLimit: 0,
      overageSegments: 0,
      warningMessage:
        'SMS is not available on your current plan. Upgrade to Professional or higher to enable SMS.',
      tierName: 'starter',
    }
  }

  // Get current usage
  const usage = await getCurrentUsageRecord(organizationId)
  const currentSegments = usage?.segmentsSent || 0
  const includedLimit = features.max_sms_per_month

  // Unlimited tier (-1)
  if (includedLimit === -1) {
    return {
      canSend: true,
      isOverLimit: false,
      currentUsage: currentSegments,
      includedLimit: -1,
      overageSegments: 0,
      warningMessage: null,
      tierName: 'enterprise',
    }
  }

  // Calculate if over limit
  const projectedUsage = currentSegments + segmentsToSend
  const isOverLimit = projectedUsage > includedLimit
  const overageSegments = Math.max(0, currentSegments - includedLimit)

  // Generate warning message
  let warningMessage: string | null = null

  if (isOverLimit) {
    warningMessage = `You have used ${currentSegments} of ${includedLimit} included SMS segments this billing period. Additional segments will be billed at $0.01 each.`
  } else if (projectedUsage > includedLimit * 0.8) {
    const percentUsed = Math.round((currentSegments / includedLimit) * 100)
    warningMessage = `You have used ${percentUsed}% of your ${includedLimit} included SMS segments this billing period.`
  }

  // Soft limit: always allow, just warn
  return {
    canSend: true,
    isOverLimit,
    currentUsage: currentSegments,
    includedLimit,
    overageSegments,
    warningMessage,
    tierName: includedLimit === 500 ? 'professional' : 'enterprise',
  }
}

/**
 * Get usage summary for display in UI
 */
export async function getUsageSummary(
  organizationId: string
): Promise<UsageSummary> {
  const features = await getOrganizationFeatures(organizationId)
  const usage = await getCurrentUsageRecord(organizationId)

  const includedLimit = features.max_sms_per_month
  const isUnlimited = includedLimit === -1
  const currentUsage = usage?.segmentsSent || 0

  return {
    currentPeriod: usage,
    percentUsed: isUnlimited
      ? 0
      : Math.round((currentUsage / includedLimit) * 100),
    isUnlimited,
    smsEnabled: features.sms_enabled,
  }
}

// =====================================================
// Historical Usage
// =====================================================

/**
 * Get usage history for an organization
 */
export async function getUsageHistory(
  organizationId: string,
  months: number = 6
): Promise<SmsUsageRecord[]> {
  const supabase = createAdminClient()

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data, error } = await supabase
    .from('sms_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('billing_period_start', startDate.toISOString())
    .order('billing_period_start', { ascending: false })

  if (error) {
    console.error('[SMS Tracking] Failed to get usage history:', error)
    return []
  }

  return (data || []).map(
    (record: {
      id: string
      organization_id: string
      billing_period_start: string
      billing_period_end: string
      messages_sent: number
      segments_sent: number
      messages_delivered: number
      messages_failed: number
      segments_included: number
      segments_overage: number
      overage_cost_cents: number
      provider_mode: 'platform' | 'byot'
    }) => ({
      id: record.id,
      organizationId: record.organization_id,
      billingPeriodStart: new Date(record.billing_period_start),
      billingPeriodEnd: new Date(record.billing_period_end),
      messagesSent: record.messages_sent,
      segmentsSent: record.segments_sent,
      messagesDelivered: record.messages_delivered,
      messagesFailed: record.messages_failed,
      segmentsIncluded: record.segments_included,
      segmentsOverage: record.segments_overage,
      overageCostCents: record.overage_cost_cents,
      providerMode: record.provider_mode,
    })
  )
}

/**
 * Calculate total overage cost for a billing period
 */
export function calculateOverageCost(overageSegments: number): number {
  return overageSegments * OVERAGE_COST_PER_SEGMENT_CENTS
}

// =====================================================
// Admin/Super-Admin Functions
// =====================================================

/**
 * Get aggregated SMS usage across all organizations (super-admin)
 */
export async function getPlatformUsageStats(): Promise<{
  totalMessagesSent: number
  totalSegmentsSent: number
  totalOverageRevenue: number
  activeOrgsThisPeriod: number
}> {
  const supabase = createAdminClient()

  // Get current month's start
  const periodStart = new Date()
  periodStart.setDate(1)
  periodStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sms_usage')
    .select('messages_sent, segments_sent, overage_cost_cents, organization_id')
    .eq('billing_period_start', periodStart.toISOString().split('T')[0])

  if (error) {
    console.error('[SMS Tracking] Failed to get platform stats:', error)
    return {
      totalMessagesSent: 0,
      totalSegmentsSent: 0,
      totalOverageRevenue: 0,
      activeOrgsThisPeriod: 0,
    }
  }

  const uniqueOrgs = new Set(data?.map(r => r.organization_id) || [])

  return {
    totalMessagesSent: data?.reduce((sum, r) => sum + r.messages_sent, 0) || 0,
    totalSegmentsSent: data?.reduce((sum, r) => sum + r.segments_sent, 0) || 0,
    totalOverageRevenue:
      data?.reduce((sum, r) => sum + r.overage_cost_cents, 0) || 0,
    activeOrgsThisPeriod: uniqueOrgs.size,
  }
}
