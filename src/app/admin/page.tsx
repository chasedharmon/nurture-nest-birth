import { createClient } from '@/lib/supabase/server'
import { DoulaDashboard } from '@/components/admin/dashboards'
import { AdminMessageNotifications } from '@/components/admin/message-notifications'
import { SetupChecklist } from '@/components/admin/onboarding'
import {
  getDashboardKPIs,
  getLeadFunnelData,
  getRevenueTrend,
  getRecentLeads,
  getUpcomingBirths,
  getOverdueInvoices,
  getLeadSourceDistribution,
} from '@/app/actions/reports'
import { getOnboardingStatus } from '@/app/actions/onboarding'

export const metadata = {
  title: 'Admin Dashboard | Nurture Nest Birth',
  description: 'Manage leads and client relationships',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth is now handled by layout.tsx, but we still need user for data fetching
  if (!user) {
    return null
  }

  // Fetch team member role for onboarding visibility
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

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
    onboardingResult,
  ] = await Promise.all([
    getDashboardKPIs(),
    getLeadFunnelData(),
    getRevenueTrend(6),
    getRecentLeads(5),
    getUpcomingBirths(5),
    getOverdueInvoices(5),
    getLeadSourceDistribution(),
    getOnboardingStatus(),
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

  // Onboarding setup
  const onboardingStatus = onboardingResult.status
  const showOnboarding =
    onboardingStatus && !onboardingStatus.isDismissed && canAccessWorkflows

  return (
    <>
      {/* Onboarding Checklist */}
      {showOnboarding && onboardingStatus && (
        <div className="mb-8">
          <SetupChecklist completionStatus={onboardingStatus} />
        </div>
      )}

      <DoulaDashboard
        kpis={kpis}
        funnelData={funnelData}
        revenueTrend={revenueTrend}
        recentLeads={recentLeads}
        upcomingBirths={upcomingBirths}
        overdueInvoices={overdueInvoices}
        leadSources={leadSources}
      />

      {/* Message Notifications */}
      <AdminMessageNotifications userId={user.id} />
    </>
  )
}
