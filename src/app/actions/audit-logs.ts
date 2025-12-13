'use server'

import { createClient } from '@/lib/supabase/server'

export interface AuditLog {
  id: string
  organization_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
  // Joined user info
  user?: {
    id: string
    email: string
    full_name: string | null
  } | null
}

export interface AuditLogFilters {
  search?: string
  action?: string
  entityType?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export interface GetAuditLogsOptions {
  filters?: AuditLogFilters
  page?: number
  pageSize?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface AuditLogStats {
  totalLogs: number
  todayLogs: number
  uniqueUsers: number
  topActions: { action: string; count: number }[]
  topEntityTypes: { entity_type: string; count: number }[]
}

/**
 * Get audit logs with filtering, pagination, and sorting
 */
export async function getAuditLogs(options: GetAuditLogsOptions = {}): Promise<{
  success: boolean
  logs?: AuditLog[]
  total?: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      filters = {},
      page = 1,
      pageSize = 50,
      sortField = 'created_at',
      sortDirection = 'desc',
    } = options

    // Build query
    let query = supabase.from('audit_logs').select(
      `
        *,
        user:users!audit_logs_user_id_fkey(id, email, full_name)
      `,
      { count: 'exact' }
    )

    // Apply filters
    if (filters.search) {
      query = query.or(
        `action.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`
      )
    }

    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(filters.dateTo)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('created_at', endDate.toISOString())
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      logs: data as AuditLog[],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in getAuditLogs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get available filter options (unique actions, entity types, users)
 */
export async function getAuditLogFilterOptions(): Promise<{
  success: boolean
  actions?: string[]
  entityTypes?: string[]
  users?: { id: string; email: string; full_name: string | null }[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get unique actions
    const { data: actionsData } = await supabase
      .from('audit_logs')
      .select('action')
      .order('action')

    // Get unique entity types
    const { data: entityTypesData } = await supabase
      .from('audit_logs')
      .select('entity_type')
      .order('entity_type')

    // Get unique user IDs from audit logs, then fetch user details
    const { data: userIdsData } = await supabase
      .from('audit_logs')
      .select('user_id')
      .not('user_id', 'is', null)

    // Get unique user IDs
    const uniqueUserIds = [
      ...new Set(userIdsData?.map(d => d.user_id).filter(Boolean) as string[]),
    ]

    // Fetch user details for those IDs
    let users: { id: string; email: string; full_name: string | null }[] = []
    if (uniqueUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', uniqueUserIds)
        .order('full_name')

      users = usersData ?? []
    }

    // Extract unique values
    const actions = [...new Set(actionsData?.map(d => d.action) ?? [])]
    const entityTypes = [
      ...new Set(entityTypesData?.map(d => d.entity_type) ?? []),
    ]

    return {
      success: true,
      actions,
      entityTypes,
      users,
    }
  } catch (error) {
    console.error('Error in getAuditLogFilterOptions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(): Promise<{
  success: boolean
  stats?: AuditLogStats
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get total count
    const { count: totalLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })

    // Get today's count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get unique users count
    const { data: uniqueUsersData } = await supabase
      .from('audit_logs')
      .select('user_id')
      .not('user_id', 'is', null)

    const uniqueUsers = new Set(uniqueUsersData?.map(d => d.user_id) ?? []).size

    // Get top actions (manually aggregate since Supabase doesn't support GROUP BY in JS client)
    const { data: actionsData } = await supabase
      .from('audit_logs')
      .select('action')

    const actionCounts = (actionsData ?? []).reduce(
      (acc, { action }) => {
        acc[action] = (acc[action] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Get top entity types
    const { data: entityTypesData } = await supabase
      .from('audit_logs')
      .select('entity_type')

    const entityTypeCounts = (entityTypesData ?? []).reduce(
      (acc, { entity_type }) => {
        acc[entity_type] = (acc[entity_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const topEntityTypes = Object.entries(entityTypeCounts)
      .map(([entity_type, count]) => ({ entity_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      success: true,
      stats: {
        totalLogs: totalLogs ?? 0,
        todayLogs: todayLogs ?? 0,
        uniqueUsers,
        topActions,
        topEntityTypes,
      },
    }
  } catch (error) {
    console.error('Error in getAuditLogStats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create an audit log entry
 * Called from server actions when important changes occur
 */
export async function createAuditLog(params: {
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get organization ID for the user
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    const { error } = await supabase.from('audit_logs').insert({
      organization_id: membership?.organization_id ?? null,
      user_id: user.id,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null,
      metadata: params.metadata ?? {},
    })

    if (error) {
      console.error('Error creating audit log:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createAuditLog:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a single audit log by ID with full details
 */
export async function getAuditLogById(id: string): Promise<{
  success: boolean
  log?: AuditLog
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('audit_logs')
      .select(
        `
        *,
        user:users!audit_logs_user_id_fkey(id, email, full_name)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching audit log:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      log: data as AuditLog,
    }
  } catch (error) {
    console.error('Error in getAuditLogById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
