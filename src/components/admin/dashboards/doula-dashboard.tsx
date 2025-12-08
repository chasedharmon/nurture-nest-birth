'use client'

import {
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Baby,
  TrendingUp,
} from 'lucide-react'
import type { DashboardKPIs, LeadFunnelData } from '@/lib/supabase/types'
import { MetricWidget, ChartWidget, ListWidget, FunnelWidget } from './widgets'

interface DoulaDashboardProps {
  kpis: DashboardKPIs
  funnelData: LeadFunnelData[]
  revenueTrend: { name: string; value: number }[]
  recentLeads: {
    id: string
    title: string
    subtitle: string
    date: string
    status: string
    href: string
  }[]
  upcomingBirths: {
    id: string
    title: string
    subtitle: string
    date: string
    badge: string
    href: string
  }[]
  overdueInvoices: {
    id: string
    title: string
    subtitle: string
    date: string
    status: string
    href: string
  }[]
  leadSources: { name: string; value: number }[]
}

export function DoulaDashboard({
  kpis,
  funnelData,
  revenueTrend,
  recentLeads,
  upcomingBirths,
  overdueInvoices,
  leadSources,
}: DoulaDashboardProps) {
  // Calculate trend directions
  const leadsTrend =
    kpis.newLeadsLastMonth > 0
      ? kpis.newLeadsThisMonth > kpis.newLeadsLastMonth
        ? 'up'
        : kpis.newLeadsThisMonth < kpis.newLeadsLastMonth
          ? 'down'
          : 'neutral'
      : 'neutral'

  const revenueTrendDirection =
    kpis.revenueLastMonth > 0
      ? kpis.revenueThisMonth > kpis.revenueLastMonth
        ? 'up'
        : kpis.revenueThisMonth < kpis.revenueLastMonth
          ? 'down'
          : 'neutral'
      : 'neutral'

  const leadsTrendValue =
    kpis.newLeadsLastMonth > 0
      ? `${kpis.newLeadsThisMonth > kpis.newLeadsLastMonth ? '+' : ''}${(
          ((kpis.newLeadsThisMonth - kpis.newLeadsLastMonth) /
            kpis.newLeadsLastMonth) *
          100
        ).toFixed(0)}%`
      : '+0%'

  const revenueTrendValue =
    kpis.revenueLastMonth > 0
      ? `${kpis.revenueThisMonth > kpis.revenueLastMonth ? '+' : ''}${(
          ((kpis.revenueThisMonth - kpis.revenueLastMonth) /
            kpis.revenueLastMonth) *
          100
        ).toFixed(0)}%`
      : '+0%'

  // Transform upcoming births for list widget
  const upcomingBirthsList = upcomingBirths.map(birth => ({
    ...birth,
    status: undefined,
  }))

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricWidget
          title="Total Leads"
          value={kpis.totalLeads}
          icon={<Users className="h-4 w-4" />}
          description="all time"
        />
        <MetricWidget
          title="New Leads This Month"
          value={kpis.newLeadsThisMonth}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={leadsTrend as 'up' | 'down' | 'neutral'}
          trendValue={leadsTrendValue}
          description="vs last month"
        />
        <MetricWidget
          title="Conversion Rate"
          value={kpis.conversionRate}
          format="percent"
          icon={<Users className="h-4 w-4" />}
          description="leads to clients"
        />
        <MetricWidget
          title="Revenue Pipeline"
          value={kpis.pendingRevenue}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
          description="active contracts"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricWidget
          title="Active Clients"
          value={kpis.activeClients}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricWidget
          title="Revenue This Month"
          value={kpis.revenueThisMonth}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
          trend={revenueTrendDirection as 'up' | 'down' | 'neutral'}
          trendValue={revenueTrendValue}
          description="vs last month"
        />
        <MetricWidget
          title="Upcoming Births"
          value={kpis.upcomingBirths}
          icon={<Baby className="h-4 w-4" />}
          description="next 30 days"
        />
        <MetricWidget
          title="Meetings This Week"
          value={kpis.meetingsThisWeek}
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      {/* Alert: Overdue Invoices */}
      {kpis.overdueInvoices > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="font-medium text-destructive">
              {kpis.overdueInvoices} overdue{' '}
              {kpis.overdueInvoices === 1 ? 'invoice' : 'invoices'} need
              attention
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FunnelWidget
          title="Lead Pipeline"
          stages={funnelData.map(d => ({
            name: d.stage,
            count: d.count,
          }))}
        />
        <ChartWidget
          title="Revenue Trend"
          type="bar"
          data={revenueTrend}
          valueFormat="currency"
          height={200}
        />
      </div>

      {/* Lists Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ListWidget
          title="Recent Leads"
          items={recentLeads}
          viewAllHref="/admin/leads"
          viewAllLabel="View All"
          emptyMessage="No recent leads"
        />
        <ListWidget
          title="Upcoming Births"
          items={upcomingBirthsList}
          viewAllHref="/admin/leads?status=client"
          viewAllLabel="View All Clients"
          emptyMessage="No upcoming births"
          dateFormat="short"
        />
        {overdueInvoices.length > 0 ? (
          <ListWidget
            title="Overdue Invoices"
            items={overdueInvoices}
            viewAllHref="/admin/invoices?status=overdue"
            viewAllLabel="View All"
            className="border-destructive/20"
          />
        ) : (
          <ChartWidget
            title="Lead Sources"
            type="donut"
            data={leadSources}
            height={180}
          />
        )}
      </div>
    </div>
  )
}
