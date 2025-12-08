'use server'

import { createClient } from '@/lib/supabase/server'
import type { DashboardKPIs, LeadFunnelData } from '@/lib/supabase/types'

// ============================================================================
// DASHBOARD KPIs
// ============================================================================

export async function getDashboardKPIs(): Promise<{
  success: boolean
  data: DashboardKPIs | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Get current date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    // New leads this month
    const { count: newLeadsThisMonth } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    // New leads last month (for comparison)
    const { count: newLeadsLastMonth } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())

    // Active clients
    const { count: activeClients } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'client')

    // Conversion rate: clients / total leads
    const conversionRate =
      totalLeads && totalLeads > 0
        ? ((activeClients || 0) / totalLeads) * 100
        : 0

    // Revenue from services
    const { data: servicesData } = await supabase
      .from('services')
      .select('total_amount, status')

    const totalRevenue =
      servicesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
    const pendingRevenue =
      servicesData
        ?.filter(s => s.status === 'pending' || s.status === 'active')
        .reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

    // Revenue this month from invoices paid
    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfMonth.toISOString())
      .eq('status', 'completed')

    const revenueThisMonth =
      paymentsThisMonth?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Revenue last month
    const { data: paymentsLastMonth } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startOfLastMonth.toISOString())
      .lt('payment_date', startOfMonth.toISOString())
      .eq('status', 'completed')

    const revenueLastMonth =
      paymentsLastMonth?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Upcoming births (leads with due date in next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { count: upcomingBirths } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'client')
      .gte('expected_due_date', now.toISOString())
      .lte('expected_due_date', thirtyDaysFromNow.toISOString())

    // Overdue invoices
    const { count: overdueInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    // Upcoming meetings this week
    const endOfWeek = new Date()
    endOfWeek.setDate(now.getDate() + 7)

    const { count: meetingsThisWeek } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', endOfWeek.toISOString())

    return {
      success: true,
      data: {
        totalLeads: totalLeads || 0,
        newLeadsThisMonth: newLeadsThisMonth || 0,
        newLeadsLastMonth: newLeadsLastMonth || 0,
        activeClients: activeClients || 0,
        conversionRate,
        totalRevenue,
        pendingRevenue,
        revenueThisMonth,
        revenueLastMonth,
        upcomingBirths: upcomingBirths || 0,
        overdueInvoices: overdueInvoices || 0,
        meetingsThisWeek: meetingsThisWeek || 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch KPIs',
    }
  }
}

// ============================================================================
// LEAD FUNNEL DATA
// ============================================================================

export async function getLeadFunnelData(): Promise<{
  success: boolean
  data: LeadFunnelData[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Get counts by status
    const statuses = ['new', 'contacted', 'scheduled', 'client', 'lost']

    const { data: leads } = await supabase.from('leads').select('status')

    const funnelData: LeadFunnelData[] = statuses.map(status => ({
      stage: status.charAt(0).toUpperCase() + status.slice(1),
      count:
        leads?.filter(l => l.status?.toLowerCase() === status.toLowerCase())
          .length || 0,
    }))

    // Filter out 'lost' from the funnel (it's not part of the progression)
    const activeFunnel = funnelData.filter(
      d => d.stage.toLowerCase() !== 'lost'
    )

    return {
      success: true,
      data: activeFunnel,
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch funnel data',
    }
  }
}

// ============================================================================
// REVENUE TREND DATA
// ============================================================================

export async function getRevenueTrend(months: number = 6): Promise<{
  success: boolean
  data: { name: string; value: number }[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    const now = new Date()
    const monthsData: { name: string; value: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
        .eq('status', 'completed')

      const monthRevenue =
        payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      monthsData.push({
        name: startDate.toLocaleDateString('en-US', { month: 'short' }),
        value: monthRevenue,
      })
    }

    return {
      success: true,
      data: monthsData,
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch revenue trend',
    }
  }
}

// ============================================================================
// RECENT LEADS
// ============================================================================

export async function getRecentLeads(limit: number = 5): Promise<{
  success: boolean
  data: {
    id: string
    title: string
    subtitle: string
    date: string
    status: string
    href: string
  }[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, email, created_at, status')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: (leads || []).map(lead => ({
        id: lead.id,
        title: lead.name,
        subtitle: lead.email,
        date: lead.created_at,
        status: lead.status || 'new',
        href: `/admin/leads/${lead.id}`,
      })),
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch recent leads',
    }
  }
}

// ============================================================================
// UPCOMING BIRTHS
// ============================================================================

export async function getUpcomingBirths(limit: number = 5): Promise<{
  success: boolean
  data: {
    id: string
    title: string
    subtitle: string
    date: string
    badge: string
    href: string
  }[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    const now = new Date()
    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(now.getDate() + 60)

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, expected_due_date, journey_phase')
      .eq('status', 'client')
      .not('expected_due_date', 'is', null)
      .gte('expected_due_date', now.toISOString())
      .lte('expected_due_date', sixtyDaysFromNow.toISOString())
      .order('expected_due_date', { ascending: true })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: (leads || []).map(lead => {
        const dueDate = new Date(lead.expected_due_date!)
        const daysUntil = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          id: lead.id,
          title: lead.name,
          subtitle: dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          date: lead.expected_due_date!,
          badge:
            daysUntil <= 7
              ? 'This week'
              : daysUntil <= 14
                ? '2 weeks'
                : `${Math.ceil(daysUntil / 7)} weeks`,
          href: `/admin/leads/${lead.id}`,
        }
      }),
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch upcoming births',
    }
  }
}

// ============================================================================
// OVERDUE INVOICES
// ============================================================================

export async function getOverdueInvoices(limit: number = 5): Promise<{
  success: boolean
  data: {
    id: string
    title: string
    subtitle: string
    date: string
    status: string
    href: string
  }[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(
        `
        id,
        invoice_number,
        balance_due,
        due_date,
        leads(name)
      `
      )
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: (invoices || []).map(invoice => {
        const clientName =
          (invoice.leads as unknown as { name: string })?.name || 'Unknown'
        return {
          id: invoice.id,
          title: `#${invoice.invoice_number}`,
          subtitle: `${clientName} - $${(invoice.balance_due || 0).toLocaleString()}`,
          date: invoice.due_date,
          status: 'Overdue',
          href: `/admin/invoices/${invoice.id}`,
        }
      }),
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch overdue invoices',
    }
  }
}

// ============================================================================
// LEAD SOURCE DISTRIBUTION
// ============================================================================

export async function getLeadSourceDistribution(): Promise<{
  success: boolean
  data: { name: string; value: number }[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: leads, error } = await supabase.from('leads').select('source')

    if (error) throw error

    // Group by source
    const sourceMap = new Map<string, number>()
    leads?.forEach(lead => {
      const source = lead.source || 'Unknown'
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
    })

    const sourceData = Array.from(sourceMap.entries())
      .map(([name, value]) => ({
        name: formatSourceLabel(name),
        value,
      }))
      .sort((a, b) => b.value - a.value)

    return {
      success: true,
      data: sourceData,
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch source distribution',
    }
  }
}

function formatSourceLabel(source: string): string {
  return source
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ============================================================================
// REPORT CRUD OPERATIONS
// ============================================================================

import type {
  Report,
  ReportInsert,
  FilterCondition,
  ColumnConfig,
  AggregationConfig,
  ObjectType,
} from '@/lib/supabase/types'

export async function createReport(
  report: Omit<ReportInsert, 'created_by'>
): Promise<{
  success: boolean
  data: Report | null
  error?: string
}> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: null, error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...report,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as Report }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create report',
    }
  }
}

export async function updateReport(
  id: string,
  updates: Partial<Omit<Report, 'id' | 'created_at' | 'created_by'>>
): Promise<{
  success: boolean
  data: Report | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as Report }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update report',
    }
  }
}

export async function deleteReport(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from('reports').delete().eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete report',
    }
  }
}

export async function getReportById(id: string): Promise<{
  success: boolean
  data: Report | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { success: true, data: data as Report }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch report',
    }
  }
}

export async function listReports(): Promise<{
  success: boolean
  data: Report[]
  error?: string
}> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], error: 'Not authenticated' }
  }

  try {
    // Get reports that are org-wide, shared, or owned by user
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .or(`visibility.eq.org,visibility.eq.shared,created_by.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return { success: true, data: (data || []) as Report[] }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
    }
  }
}

// ============================================================================
// REPORT EXECUTION
// ============================================================================

// Table name mapping for ObjectType
const TABLE_MAP: Record<ObjectType, string> = {
  leads: 'leads',
  clients: 'leads', // Clients are leads with status='client'
  invoices: 'invoices',
  meetings: 'meetings',
  team_members: 'team_members',
  payments: 'payments',
  services: 'client_services',
}

// Build Supabase filter from FilterCondition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilter(query: any, filter: FilterCondition) {
  const { field, operator, value } = filter

  switch (operator) {
    case 'equals':
      return query.eq(field, value)
    case 'not_equals':
      return query.neq(field, value)
    case 'contains':
      return query.ilike(field, `%${value}%`)
    case 'not_contains':
      return query.not(field, 'ilike', `%${value}%`)
    case 'starts_with':
      return query.ilike(field, `${value}%`)
    case 'ends_with':
      return query.ilike(field, `%${value}`)
    case 'greater_than':
      return query.gt(field, value)
    case 'less_than':
      return query.lt(field, value)
    case 'greater_or_equal':
      return query.gte(field, value)
    case 'less_or_equal':
      return query.lte(field, value)
    case 'is_null':
      return query.is(field, null)
    case 'is_not_null':
      return query.not(field, 'is', null)
    case 'in':
      return query.in(field, Array.isArray(value) ? value : [value])
    case 'not_in':
      return query.not(
        field,
        'in',
        `(${Array.isArray(value) ? value.join(',') : value})`
      )
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return query.gte(field, value[0]).lte(field, value[1])
      }
      return query
    case 'this_week': {
      const now = new Date()
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      return query
        .gte(field, startOfWeek.toISOString())
        .lte(field, endOfWeek.toISOString())
    }
    case 'this_month': {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return query
        .gte(field, startOfMonth.toISOString())
        .lte(field, endOfMonth.toISOString())
    }
    case 'this_quarter': {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
      const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      return query
        .gte(field, startOfQuarter.toISOString())
        .lte(field, endOfQuarter.toISOString())
    }
    case 'last_n_days': {
      const days =
        typeof value === 'number' ? value : parseInt(String(value), 10)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      return query.gte(field, startDate.toISOString())
    }
    default:
      return query
  }
}

// Re-export from types for backwards compatibility
export type { ReportExecutionResult } from '@/lib/supabase/types'
import type { ReportExecutionResult } from '@/lib/supabase/types'

export async function executeReport(
  reportId: string,
  runtimeFilters?: FilterCondition[]
): Promise<{
  success: boolean
  data: ReportExecutionResult | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Get report config
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return { success: false, data: null, error: 'Report not found' }
    }

    return executeReportConfig(report as Report, runtimeFilters)
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to execute report',
    }
  }
}

export async function executeReportConfig(
  config: {
    object_type: ObjectType
    columns: ColumnConfig[]
    filters: FilterCondition[]
    groupings?: string[]
    aggregations?: AggregationConfig[]
  },
  runtimeFilters?: FilterCondition[]
): Promise<{
  success: boolean
  data: ReportExecutionResult | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const tableName = TABLE_MAP[config.object_type]
    if (!tableName) {
      return { success: false, data: null, error: 'Invalid object type' }
    }

    // Build select columns
    const selectColumns = config.columns
      .filter(c => c.visible !== false)
      .map(c => c.field)
      .join(', ')

    // Start query
    let query = supabase
      .from(tableName)
      .select(selectColumns || '*', { count: 'exact' })

    // Apply special filter for "clients" (leads with status='client')
    if (config.object_type === 'clients') {
      query = query.eq('status', 'client')
    }

    // Apply saved filters
    const allFilters = [...(config.filters || []), ...(runtimeFilters || [])]
    for (const filter of allFilters) {
      query = applyFilter(query, filter) as typeof query
    }

    // Execute query
    const { data: rows, count, error } = await query

    if (error) throw error

    // Calculate aggregations if specified
    let aggregations: Record<string, number> | undefined
    if (config.aggregations && config.aggregations.length > 0) {
      aggregations = {}
      for (const agg of config.aggregations) {
        const values = (rows || [])
          .map(r => {
            const val = r[agg.field as keyof typeof r]
            return typeof val === 'number' ? val : parseFloat(String(val)) || 0
          })
          .filter(v => !isNaN(v))

        const aggType = agg.function || agg.type || 'count'
        switch (aggType) {
          case 'sum':
            aggregations[agg.label] = values.reduce((a, b) => a + b, 0)
            break
          case 'count':
          case 'count_distinct':
            aggregations[agg.label] = values.length
            break
          case 'avg':
            aggregations[agg.label] =
              values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0
            break
          case 'min':
            aggregations[agg.label] =
              values.length > 0 ? Math.min(...values) : 0
            break
          case 'max':
            aggregations[agg.label] =
              values.length > 0 ? Math.max(...values) : 0
            break
        }
      }
    }

    // Normalize rows to Record<string, unknown>[]
    const normalizedRows: Record<string, unknown>[] = (rows || []).map(
      row => row as unknown as Record<string, unknown>
    )

    // Group data if groupings specified
    let groupedData: Record<string, Record<string, unknown>[]> | undefined
    const groupField = config.groupings?.[0]
    if (groupField) {
      groupedData = {}
      for (const row of normalizedRows) {
        const groupKey = String(row[groupField] || 'Ungrouped')
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = []
        }
        groupedData[groupKey].push(row)
      }
    }

    return {
      success: true,
      data: {
        rows: normalizedRows,
        totalCount: count || 0,
        aggregations,
        groupedData,
      },
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to execute report',
    }
  }
}
