import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  PauseCircle,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'

import { getDashboardStats } from '@/app/actions/super-admin'
import {
  getChurnRiskTenants,
  getPlatformMetrics,
  getRevenueMetrics,
  getUpsellOpportunities,
} from '@/app/actions/platform-metrics'
import {
  getAccountDeletionRequests,
  getDataExportRequests,
} from '@/app/actions/gdpr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

/**
 * Super-Admin Dashboard
 *
 * Overview page showing:
 * - Total tenants count
 * - Active/Trialing/Suspended breakdowns
 * - MRR/ARR metrics
 * - Churn risk tenants
 * - Upsell opportunities
 * - Recent signups (last 7 days)
 * - GDPR requests status
 * - Quick actions
 */
export default async function SuperAdminDashboardPage() {
  // Fetch all data in parallel
  const [
    statsResult,
    metricsResult,
    revenueResult,
    churnResult,
    upsellResult,
    deletionResult,
    exportResult,
  ] = await Promise.all([
    getDashboardStats(),
    getPlatformMetrics(),
    getRevenueMetrics(),
    getChurnRiskTenants(),
    getUpsellOpportunities(),
    getAccountDeletionRequests('pending'),
    getDataExportRequests(),
  ])

  const result = statsResult

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const stats = result.data
  const metrics = metricsResult.data
  const revenue = revenueResult.data
  const churnRiskTenants = churnResult.data || []
  const upsellOpportunities = upsellResult.data || []
  const pendingDeletions = deletionResult.data || []
  const pendingExports = (exportResult.data || []).filter(
    e => e.status === 'pending'
  )

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Platform Dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Overview of all tenants and platform health
          </p>
        </div>
        <Link href="/super-admin/tenants/new">
          <Button>
            <Building2 className="mr-2 size-4" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {/* Revenue Metrics */}
      {revenue && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Monthly Revenue (MRR)
                  </p>
                  <p className="mt-1 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(revenue.mrr_cents)}
                  </p>
                  {revenue.mrr_growth_percent !== null && (
                    <p
                      className={`mt-1 text-xs ${revenue.mrr_growth_percent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {revenue.mrr_growth_percent >= 0 ? '+' : ''}
                      {revenue.mrr_growth_percent.toFixed(1)}% vs 30 days ago
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-emerald-200 p-3 dark:bg-emerald-800">
                  <DollarSign className="size-5 text-emerald-700 dark:text-emerald-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Annual Revenue (ARR)
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(revenue.arr_cents)}
                  </p>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    Projected yearly
                  </p>
                </div>
                <div className="rounded-lg bg-blue-200 p-3 dark:bg-blue-800">
                  <TrendingUp className="size-5 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Signups This Week
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                {metrics?.new_signups_weekly || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics?.new_signups_monthly || 0} this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tier Distribution
              </p>
              <div className="mt-2 space-y-1">
                {revenue.tier_breakdown.map(tier => (
                  <div
                    key={tier.tier}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize text-slate-600 dark:text-slate-400">
                      {tier.tier}
                    </span>
                    <span className="font-medium">{tier.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={<Building2 className="size-5" />}
          description="All organizations"
        />
        <StatsCard
          title="Active"
          value={stats.activeTenants}
          icon={<CheckCircle className="size-5 text-emerald-500" />}
          description="Paying customers"
        />
        <StatsCard
          title="Trialing"
          value={stats.trialingTenants}
          icon={<Clock className="size-5 text-amber-500" />}
          description="In trial period"
        />
        <StatsCard
          title="Suspended"
          value={stats.suspendedTenants}
          icon={<PauseCircle className="size-5 text-red-500" />}
          description="Paused accounts"
        />
      </div>

      {/* Churn Risk & Upsell Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Churn Risk Tenants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-500" />
                  Churn Risk
                </CardTitle>
                <CardDescription>
                  Tenants with no login in 30+ days
                </CardDescription>
              </div>
              <Link href="/super-admin/health">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {churnRiskTenants.length === 0 ? (
              <p className="py-4 text-center text-slate-500">
                No tenants at risk
              </p>
            ) : (
              <div className="space-y-3">
                {churnRiskTenants.slice(0, 5).map(tenant => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="font-medium hover:text-violet-600"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {tenant.days_since_login} days inactive
                      </p>
                    </div>
                    <Badge
                      variant={
                        tenant.churn_risk_level === 'critical'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {tenant.churn_risk_level}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upsell Opportunities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="size-5 text-emerald-500" />
                  Upsell Opportunities
                </CardTitle>
                <CardDescription>Tenants at 80%+ of limits</CardDescription>
              </div>
              <Link href="/super-admin/health?filter=upsell">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upsellOpportunities.length === 0 ? (
              <p className="py-4 text-center text-slate-500">
                No upsell opportunities
              </p>
            ) : (
              <div className="space-y-3">
                {upsellOpportunities.slice(0, 5).map(tenant => (
                  <div key={tenant.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="font-medium hover:text-violet-600"
                      >
                        {tenant.name}
                      </Link>
                      <TierBadge tier={tenant.subscription_tier} />
                    </div>
                    <div className="mt-2 space-y-1">
                      {tenant.at_client_limit && (
                        <UsageBar
                          label="Clients"
                          current={tenant.current_usage.clients}
                          max={tenant.limits.max_clients}
                        />
                      )}
                      {tenant.at_team_limit && (
                        <UsageBar
                          label="Team"
                          current={tenant.current_usage.team_members}
                          max={tenant.limits.max_team_members}
                        />
                      )}
                      {tenant.at_workflow_limit && (
                        <UsageBar
                          label="Workflows"
                          current={tenant.current_usage.workflows}
                          max={tenant.limits.max_workflows}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GDPR Requests */}
      {(pendingDeletions.length > 0 || pendingExports.length > 0) && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-amber-600" />
              GDPR Requests Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {pendingDeletions.length > 0 && (
                <Link
                  href="/super-admin/gdpr?tab=deletions"
                  className="flex items-center gap-2 text-amber-700 hover:text-amber-900"
                >
                  <AlertTriangle className="size-4" />
                  <span className="font-medium">
                    {pendingDeletions.length} deletion request
                    {pendingDeletions.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              )}
              {pendingExports.length > 0 && (
                <Link
                  href="/super-admin/gdpr?tab=exports"
                  className="flex items-center gap-2 text-amber-700 hover:text-amber-900"
                >
                  <FileText className="size-4" />
                  <span className="font-medium">
                    {pendingExports.length} export request
                    {pendingExports.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Signups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-emerald-500" />
                Recent Signups
              </CardTitle>
              <CardDescription>New tenants in the last 7 days</CardDescription>
            </div>
            <Link href="/super-admin/tenants">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentSignups.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No new signups in the last 7 days
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentSignups.map(tenant => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="font-medium text-slate-900 hover:text-violet-600 dark:text-white dark:hover:text-violet-400"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-sm text-slate-500">{tenant.slug}</p>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {tenant.owner_email || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.subscription_status} />
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={tenant.subscription_tier} />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(tenant.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          title="Create New Tenant"
          description="Provision a new organization manually"
          href="/super-admin/tenants/new"
          icon={<Building2 className="size-6" />}
        />
        <QuickActionCard
          title="View All Tenants"
          description="Search and manage existing organizations"
          href="/super-admin/tenants"
          icon={<Building2 className="size-6" />}
        />
        <QuickActionCard
          title="Tenant Health"
          description="Monitor churn risk and upsell opportunities"
          href="/super-admin/health"
          icon={<Users className="size-6" />}
        />
        <QuickActionCard
          title="GDPR Compliance"
          description="Manage data exports and deletion requests"
          href="/super-admin/gdpr"
          icon={<Shield className="size-6" />}
        />
        <QuickActionCard
          title="Audit Log"
          description="View platform admin activity history"
          href="/super-admin/audit"
          icon={<FileText className="size-6" />}
        />
        <QuickActionCard
          title="Platform Settings"
          description="Configure platform-wide settings"
          href="/super-admin/settings"
          icon={<Building2 className="size-6" />}
        />
      </div>
    </div>
  )
}

// =====================================================
// Helper Components
// =====================================================

function StatsCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: number
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-violet-300 dark:hover:border-violet-700">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="rounded-lg bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      label: string
    }
  > = {
    active: { variant: 'default', label: 'Active' },
    trialing: { variant: 'secondary', label: 'Trialing' },
    suspended: { variant: 'destructive', label: 'Suspended' },
    cancelled: { variant: 'outline', label: 'Cancelled' },
    past_due: { variant: 'destructive', label: 'Past Due' },
  }

  const config = variants[status] || {
    variant: 'outline' as const,
    label: status,
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function TierBadge({ tier }: { tier: string }) {
  const labels: Record<string, string> = {
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business',
    enterprise: 'Enterprise',
  }

  return (
    <Badge variant="outline" className="capitalize">
      {labels[tier] || tier}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function UsageBar({
  label,
  current,
  max,
}: {
  label: string
  current: number
  max: number
}) {
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-slate-500">{label}</span>
      <Progress value={percentage} className="h-2 flex-1" />
      <span className="w-16 text-right text-slate-600">
        {current}/{max}
      </span>
    </div>
  )
}
