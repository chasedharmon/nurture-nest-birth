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
