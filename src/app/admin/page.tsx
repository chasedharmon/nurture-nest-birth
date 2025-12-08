import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Users, List, LogOut } from 'lucide-react'
import { DoulaDashboard } from '@/components/admin/dashboards'
import {
  getDashboardKPIs,
  getLeadFunnelData,
  getRevenueTrend,
  getRecentLeads,
  getUpcomingBirths,
  getOverdueInvoices,
  getLeadSourceDistribution,
} from '@/app/actions/reports'

export const metadata = {
  title: 'Admin Dashboard | Nurture Nest Birth',
  description: 'Manage leads and client relationships',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all dashboard data in parallel
  const [
    kpisResult,
    funnelResult,
    revenueTrendResult,
    recentLeadsResult,
    upcomingBirthsResult,
    overdueInvoicesResult,
    leadSourcesResult,
  ] = await Promise.all([
    getDashboardKPIs(),
    getLeadFunnelData(),
    getRevenueTrend(6),
    getRecentLeads(5),
    getUpcomingBirths(5),
    getOverdueInvoices(5),
    getLeadSourceDistribution(),
  ])

  // Default KPIs if fetch fails
  const defaultKPIs = {
    totalLeads: 0,
    newLeadsThisMonth: 0,
    newLeadsLastMonth: 0,
    activeClients: 0,
    conversionRate: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    upcomingBirths: 0,
    overdueInvoices: 0,
    meetingsThisWeek: 0,
  }

  const kpis = kpisResult.data || defaultKPIs
  const funnelData = funnelResult.data || []
  const revenueTrend = revenueTrendResult.data || []
  const recentLeads = recentLeadsResult.data || []
  const upcomingBirths = upcomingBirthsResult.data || []
  const overdueInvoices = overdueInvoicesResult.data || []
  const leadSources = leadSourcesResult.data || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Nurture Nest Birth CRM
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.full_name || user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/leads">
                <Button variant="outline" size="sm">
                  <List className="mr-2 h-4 w-4" />
                  Leads
                </Button>
              </Link>
              <Link href="/admin/team">
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </Link>
              <form action="/auth/signout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DoulaDashboard
          kpis={kpis}
          funnelData={funnelData}
          revenueTrend={revenueTrend}
          recentLeads={recentLeads}
          upcomingBirths={upcomingBirths}
          overdueInvoices={overdueInvoices}
          leadSources={leadSources}
        />
      </main>
    </div>
  )
}
