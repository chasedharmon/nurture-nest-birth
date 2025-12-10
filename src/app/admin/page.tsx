import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Users,
  List,
  LogOut,
  BarChart3,
  LayoutDashboard,
  Settings,
  Workflow,
} from 'lucide-react'
import { DoulaDashboard } from '@/components/admin/dashboards'
import { QuickMessagesSheet } from '@/components/admin/quick-messages-sheet'
import { AdminMessageNotifications } from '@/components/admin/message-notifications'
import {
  getDashboardKPIs,
  getLeadFunnelData,
  getRevenueTrend,
  getRecentLeads,
  getUpcomingBirths,
  getOverdueInvoices,
  getLeadSourceDistribution,
} from '@/app/actions/reports'
import { getUnreadCount } from '@/app/actions/messaging'

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

  // Fetch user profile and team member role in parallel
  const [{ data: profile }, { data: teamMember }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .single(),
  ])

  // Check if user has permission to access workflows (owner or admin role)
  const canAccessWorkflows =
    teamMember?.role === 'owner' || teamMember?.role === 'admin'

  // Fetch all dashboard data in parallel
  const [
    kpisResult,
    funnelResult,
    revenueTrendResult,
    recentLeadsResult,
    upcomingBirthsResult,
    overdueInvoicesResult,
    leadSourcesResult,
    unreadMessagesResult,
  ] = await Promise.all([
    getDashboardKPIs(),
    getLeadFunnelData(),
    getRevenueTrend(6),
    getRecentLeads(5),
    getUpcomingBirths(5),
    getOverdueInvoices(5),
    getLeadSourceDistribution(),
    getUnreadCount(),
  ])

  const unreadMessages = unreadMessagesResult.count || 0

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
            <div className="flex items-center gap-2">
              <Link href="/admin/leads">
                <Button variant="outline" size="sm">
                  <List className="mr-2 h-4 w-4" />
                  Leads
                </Button>
              </Link>
              <QuickMessagesSheet
                userId={user.id}
                userName={profile?.full_name || user.email || 'Team Member'}
                initialUnreadCount={unreadMessages}
              />
              <Link href="/admin/team">
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              </Link>
              <Link href="/admin/dashboards">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboards
                </Button>
              </Link>
              {canAccessWorkflows && (
                <Link href="/admin/workflows">
                  <Button variant="outline" size="sm">
                    <Workflow className="mr-2 h-4 w-4" />
                    Workflows
                  </Button>
                </Link>
              )}
              <Link href="/admin/setup">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Setup
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

      {/* Message Notifications */}
      <AdminMessageNotifications userId={user.id} />
    </div>
  )
}
