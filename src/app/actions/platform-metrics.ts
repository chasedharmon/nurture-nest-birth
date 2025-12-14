'use server'

/**
 * Platform Metrics Server Actions
 *
 * Actions for retrieving platform-wide metrics, tenant health scores,
 * and revenue data for the super-admin dashboard.
 */

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/server'
import { requirePlatformAdmin } from '@/lib/platform/super-admin'

// =====================================================
// Types
// =====================================================

export interface PlatformMetrics {
  snapshot_date: string
  total_tenants: number
  active_tenants: number
  trialing_tenants: number
  suspended_tenants: number
  cancelled_tenants: number
  mrr_cents: number
  arr_cents: number
  new_signups_daily: number
  new_signups_weekly: number
  new_signups_monthly: number
  starter_tier_count: number
  professional_tier_count: number
  enterprise_tier_count: number
  total_users: number
  total_clients: number
  total_workflows: number
}

export interface TenantHealthScore {
  id: string
  organization_id: string
  overall_score: number
  engagement_score: number
  usage_score: number
  payment_score: number
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical'
  days_since_login: number
  at_team_limit: boolean
  at_client_limit: boolean
  at_workflow_limit: boolean
  at_storage_limit: boolean
  upsell_opportunity: boolean
  calculated_at: string
  organization?: {
    id: string
    name: string
    slug: string
    subscription_status: string
    subscription_tier: string
    owner_user_id: string | null
  }
}

export interface ChurnRiskTenant {
  id: string
  name: string
  slug: string
  subscription_status: string
  subscription_tier: string
  last_login_at: string | null
  days_since_login: number
  churn_risk_level: string
  owner_email: string | null
}

export interface UpsellOpportunity {
  id: string
  name: string
  slug: string
  subscription_tier: string
  at_team_limit: boolean
  at_client_limit: boolean
  at_workflow_limit: boolean
  current_usage: {
    team_members: number
    clients: number
    workflows: number
  }
  limits: {
    max_team_members: number
    max_clients: number
    max_workflows: number
  }
}

export interface RevenueMetrics {
  mrr_cents: number
  arr_cents: number
  mrr_growth_percent: number | null
  tier_breakdown: {
    tier: string
    count: number
    mrr_cents: number
  }[]
  historical: {
    date: string
    mrr_cents: number
  }[]
}

// =====================================================
// Metrics Actions
// =====================================================

/**
 * Get current platform metrics (today's snapshot)
 */
export async function getPlatformMetrics(): Promise<{
  success: boolean
  data?: PlatformMetrics
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // First, refresh the snapshot to ensure data is current
    await supabase.rpc('snapshot_platform_metrics')

    // Get today's metrics
    const { data, error } = await supabase
      .from('platform_metrics')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get platform metrics',
    }
  }
}

/**
 * Get historical metrics for charts
 */
export async function getMetricsHistory(days: number = 30): Promise<{
  success: boolean
  data?: PlatformMetrics[]
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('platform_metrics')
      .select('*')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get metrics history',
    }
  }
}

/**
 * Get revenue metrics with breakdown
 */
export async function getRevenueMetrics(): Promise<{
  success: boolean
  data?: RevenueMetrics
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Get current MRR
    const { data: mrrData } = await supabase.rpc('calculate_platform_mrr')
    const currentMrr = mrrData || 0

    // Get tier breakdown
    const { data: orgs } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('subscription_status', 'active')
      .is('deleted_at', null)

    const tierCounts: Record<string, number> = {}
    const tierPrices: Record<string, number> = {
      starter: 2900,
      professional: 7900,
      enterprise: 19900,
    }

    for (const org of orgs || []) {
      const tier = org.subscription_tier || 'starter'
      tierCounts[tier] = (tierCounts[tier] || 0) + 1
    }

    const tier_breakdown = Object.entries(tierCounts).map(([tier, count]) => ({
      tier,
      count,
      mrr_cents: count * (tierPrices[tier] || 0),
    }))

    // Get last 30 days of metrics for MRR history
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const { data: history } = await supabase
      .from('platform_metrics')
      .select('snapshot_date, mrr_cents')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    // Calculate growth
    let mrr_growth_percent: number | null = null
    if (history && history.length >= 2) {
      const oldestMrr = history[0]?.mrr_cents ?? 0
      if (oldestMrr > 0) {
        mrr_growth_percent = ((currentMrr - oldestMrr) / oldestMrr) * 100
      }
    }

    return {
      success: true,
      data: {
        mrr_cents: currentMrr,
        arr_cents: currentMrr * 12,
        mrr_growth_percent,
        tier_breakdown,
        historical: (history || []).map(h => ({
          date: h.snapshot_date,
          mrr_cents: h.mrr_cents,
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get revenue metrics',
    }
  }
}

// =====================================================
// Tenant Health Actions
// =====================================================

/**
 * Get all tenant health scores
 */
export async function getTenantHealthScores(options?: {
  risk_level?: string
  upsell_only?: boolean
  limit?: number
}): Promise<{
  success: boolean
  data?: TenantHealthScore[]
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Refresh health scores first
    await supabase.rpc('refresh_all_tenant_health_scores')

    let query = supabase
      .from('tenant_health_scores')
      .select(
        `
        *,
        organization:organizations(
          id,
          name,
          slug,
          subscription_status,
          subscription_tier,
          owner_user_id
        )
      `
      )
      .order('overall_score', { ascending: true })

    if (options?.risk_level) {
      query = query.eq('churn_risk_level', options.risk_level)
    }

    if (options?.upsell_only) {
      query = query.eq('upsell_opportunity', true)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get tenant health scores',
    }
  }
}

/**
 * Get tenants at risk of churning (no login in 30+ days)
 */
export async function getChurnRiskTenants(): Promise<{
  success: boolean
  data?: ChurnRiskTenant[]
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Get tenants with high/critical churn risk
    const { data: healthScores, error: healthError } = await supabase
      .from('tenant_health_scores')
      .select(
        `
        organization_id,
        days_since_login,
        churn_risk_level,
        organization:organizations(
          id,
          name,
          slug,
          subscription_status,
          subscription_tier,
          last_login_at,
          owner_user_id
        )
      `
      )
      .in('churn_risk_level', ['high', 'critical'])
      .order('days_since_login', { ascending: false })

    if (healthError) {
      return { success: false, error: healthError.message }
    }

    // Get owner emails
    const ownerIds = (healthScores || [])
      .map(h => {
        const org = h.organization as unknown as Record<string, unknown> | null
        return org?.owner_user_id as string | undefined
      })
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

    const result: ChurnRiskTenant[] = (healthScores || []).map(h => {
      const org = h.organization as unknown as Record<string, unknown> | null
      return {
        id: (org?.id as string) || '',
        name: (org?.name as string) || '',
        slug: (org?.slug as string) || '',
        subscription_status: (org?.subscription_status as string) || '',
        subscription_tier: (org?.subscription_tier as string) || '',
        last_login_at: (org?.last_login_at as string | null) || null,
        days_since_login: h.days_since_login,
        churn_risk_level: h.churn_risk_level,
        owner_email: org?.owner_user_id
          ? ownerEmails[org.owner_user_id as string] || null
          : null,
      }
    })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get churn risk tenants',
    }
  }
}

/**
 * Get upsell opportunities (tenants at >80% of limits)
 */
export async function getUpsellOpportunities(): Promise<{
  success: boolean
  data?: UpsellOpportunity[]
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Get tenants with upsell opportunity
    const { data: healthScores, error: healthError } = await supabase
      .from('tenant_health_scores')
      .select(
        `
        organization_id,
        at_team_limit,
        at_client_limit,
        at_workflow_limit,
        organization:organizations(
          id,
          name,
          slug,
          subscription_tier,
          max_team_members,
          max_clients,
          max_workflows
        )
      `
      )
      .eq('upsell_opportunity', true)

    if (healthError) {
      return { success: false, error: healthError.message }
    }

    // Get current usage counts for each org
    const result: UpsellOpportunity[] = []

    for (const h of healthScores || []) {
      const org = h.organization as unknown as Record<string, unknown> | null
      if (!org) continue
      const orgId = org.id as string

      // Get team member count
      const { count: teamCount } = await supabase
        .from('organization_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true)

      // Get client count
      const { count: clientCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      // Get workflow count
      const { count: workflowCount } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true)

      result.push({
        id: orgId,
        name: (org.name as string) || '',
        slug: (org.slug as string) || '',
        subscription_tier: (org.subscription_tier as string) || '',
        at_team_limit: h.at_team_limit,
        at_client_limit: h.at_client_limit,
        at_workflow_limit: h.at_workflow_limit,
        current_usage: {
          team_members: teamCount || 0,
          clients: clientCount || 0,
          workflows: workflowCount || 0,
        },
        limits: {
          max_team_members: (org.max_team_members as number) || 0,
          max_clients: (org.max_clients as number) || 0,
          max_workflows: (org.max_workflows as number) || 0,
        },
      })
    }

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get upsell opportunities',
    }
  }
}

/**
 * Refresh platform metrics (force recalculation)
 */
export async function refreshPlatformMetrics(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const supabase = createAdminClient()

    // Refresh metrics snapshot
    const { error: metricsError } = await supabase.rpc(
      'snapshot_platform_metrics'
    )
    if (metricsError) {
      return { success: false, error: metricsError.message }
    }

    // Refresh health scores
    const { error: healthError } = await supabase.rpc(
      'refresh_all_tenant_health_scores'
    )
    if (healthError) {
      return { success: false, error: healthError.message }
    }

    revalidatePath('/super-admin')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to refresh metrics',
    }
  }
}
