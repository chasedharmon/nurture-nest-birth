import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  PauseCircle,
  TrendingUp,
} from 'lucide-react'

import { getDashboardStats } from '@/app/actions/super-admin'
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

/**
 * Super-Admin Dashboard
 *
 * Overview page showing:
 * - Total tenants count
 * - Active/Trialing/Suspended breakdowns
 * - Recent signups (last 7 days)
 * - Quick actions
 */
export default async function SuperAdminDashboardPage() {
  const result = await getDashboardStats()

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
