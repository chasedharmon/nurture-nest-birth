'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react'

import {
  getChurnRiskTenants,
  getTenantHealthScores,
  getUpsellOpportunities,
  refreshPlatformMetrics,
  type ChurnRiskTenant,
  type TenantHealthScore,
  type UpsellOpportunity,
} from '@/app/actions/platform-metrics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * Tenant Health Monitoring Page
 *
 * Provides visibility into:
 * - Overall tenant health scores
 * - Churn risk detection
 * - Upsell opportunities
 */
export default function TenantHealthPage() {
  const searchParams = useSearchParams()
  const initialTab =
    searchParams.get('filter') === 'upsell' ? 'upsell' : 'health'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [healthScores, setHealthScores] = useState<TenantHealthScore[]>([])
  const [churnRiskTenants, setChurnRiskTenants] = useState<ChurnRiskTenant[]>(
    []
  )
  const [upsellOpportunities, setUpsellOpportunities] = useState<
    UpsellOpportunity[]
  >([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [healthResult, churnResult, upsellResult] = await Promise.all([
        getTenantHealthScores(
          riskFilter !== 'all' ? { risk_level: riskFilter } : undefined
        ),
        getChurnRiskTenants(),
        getUpsellOpportunities(),
      ])

      if (healthResult.success) setHealthScores(healthResult.data || [])
      if (churnResult.success) setChurnRiskTenants(churnResult.data || [])
      if (upsellResult.success) setUpsellOpportunities(upsellResult.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [riskFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshPlatformMetrics()
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate summary stats
  const criticalCount = healthScores.filter(
    h => h.churn_risk_level === 'critical'
  ).length
  const highRiskCount = healthScores.filter(
    h => h.churn_risk_level === 'high'
  ).length
  const mediumRiskCount = healthScores.filter(
    h => h.churn_risk_level === 'medium'
  ).length
  const healthyCount = healthScores.filter(
    h => h.churn_risk_level === 'low'
  ).length
  const averageScore =
    healthScores.length > 0
      ? Math.round(
          healthScores.reduce((sum, h) => sum + h.overall_score, 0) /
            healthScores.length
        )
      : 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tenant Health Monitoring
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Monitor churn risk and identify upsell opportunities
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw
            className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh Data
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/50">
                <CheckCircle className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{healthyCount}</p>
                <p className="text-xs text-slate-500">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
                <AlertTriangle className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mediumRiskCount}</p>
                <p className="text-xs text-slate-500">Medium Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
                <AlertTriangle className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highRiskCount}</p>
                <p className="text-xs text-slate-500">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-slate-500">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/50">
                <TrendingUp className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageScore}</p>
                <p className="text-xs text-slate-500">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="health" className="gap-2">
            <Users className="size-4" />
            Health Scores
          </TabsTrigger>
          <TabsTrigger value="churn" className="gap-2">
            <AlertTriangle className="size-4" />
            Churn Risk ({churnRiskTenants.length})
          </TabsTrigger>
          <TabsTrigger value="upsell" className="gap-2">
            <ArrowUpRight className="size-4" />
            Upsell ({upsellOpportunities.length})
          </TabsTrigger>
        </TabsList>

        {/* Health Scores Tab */}
        <TabsContent value="health" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenant Health Scores</CardTitle>
                  <CardDescription>
                    Composite health score based on engagement, usage, and
                    payment
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-slate-400" />
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">
                  Loading...
                </div>
              ) : healthScores.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No tenants found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Days Inactive</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthScores.map(score => (
                      <TableRow key={score.id}>
                        <TableCell>
                          <Link
                            href={`/super-admin/tenants/${score.organization_id}`}
                            className="font-medium hover:text-violet-600"
                          >
                            {score.organization?.name || 'Unknown'}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {score.organization?.slug}
                          </p>
                        </TableCell>
                        <TableCell>
                          <ScoreIndicator score={score.overall_score} />
                        </TableCell>
                        <TableCell>
                          <ScoreIndicator score={score.engagement_score} />
                        </TableCell>
                        <TableCell>
                          <ScoreIndicator score={score.usage_score} />
                        </TableCell>
                        <TableCell>
                          <ScoreIndicator score={score.payment_score} />
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={score.churn_risk_level} />
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {score.days_since_login}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {score.at_team_limit && (
                              <Badge variant="outline" className="text-xs">
                                Team
                              </Badge>
                            )}
                            {score.at_client_limit && (
                              <Badge variant="outline" className="text-xs">
                                Clients
                              </Badge>
                            )}
                            {score.at_workflow_limit && (
                              <Badge variant="outline" className="text-xs">
                                Workflows
                              </Badge>
                            )}
                            {score.upsell_opportunity && (
                              <Badge className="bg-emerald-500 text-xs">
                                Upsell
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>High-Risk Tenants</CardTitle>
              <CardDescription>
                Tenants with no login in 30+ days or other churn indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">
                  Loading...
                </div>
              ) : churnRiskTenants.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No high-risk tenants found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Days Inactive</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Owner Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnRiskTenants.map(tenant => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Link
                            href={`/super-admin/tenants/${tenant.id}`}
                            className="font-medium hover:text-violet-600"
                          >
                            {tenant.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {tenant.slug}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={tenant.subscription_status} />
                        </TableCell>
                        <TableCell className="capitalize">
                          {tenant.subscription_tier}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              tenant.days_since_login > 60
                                ? 'font-bold text-red-600'
                                : tenant.days_since_login > 30
                                  ? 'text-amber-600'
                                  : ''
                            }
                          >
                            {tenant.days_since_login} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={tenant.churn_risk_level} />
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {tenant.owner_email || '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/super-admin/tenants/${tenant.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upsell Tab */}
        <TabsContent value="upsell" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upsell Opportunities</CardTitle>
              <CardDescription>
                Tenants at 80%+ of their plan limits - ready for upgrade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">
                  Loading...
                </div>
              ) : upsellOpportunities.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No upsell opportunities found
                </div>
              ) : (
                <div className="space-y-4">
                  {upsellOpportunities.map(tenant => (
                    <Card
                      key={tenant.id}
                      className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Building2 className="size-5 text-slate-400" />
                              <Link
                                href={`/super-admin/tenants/${tenant.id}`}
                                className="text-lg font-semibold hover:text-violet-600"
                              >
                                {tenant.name}
                              </Link>
                              <Badge variant="outline" className="capitalize">
                                {tenant.subscription_tier}
                              </Badge>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              {tenant.at_client_limit && (
                                <UsageBar
                                  label="Clients"
                                  current={tenant.current_usage.clients}
                                  max={tenant.limits.max_clients}
                                />
                              )}
                              {tenant.at_team_limit && (
                                <UsageBar
                                  label="Team Members"
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
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/super-admin/tenants/${tenant.id}`}>
                              Contact for Upgrade
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =====================================================
// Helper Components
// =====================================================

function ScoreIndicator({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-emerald-600'
      : score >= 60
        ? 'text-amber-600'
        : score >= 40
          ? 'text-orange-600'
          : 'text-red-600'

  return <span className={`font-semibold ${color}`}>{score}</span>
}

function RiskBadge({ level }: { level: string }) {
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      className: string
    }
  > = {
    low: {
      variant: 'outline',
      className: 'border-emerald-300 text-emerald-700 bg-emerald-50',
    },
    medium: {
      variant: 'outline',
      className: 'border-amber-300 text-amber-700 bg-amber-50',
    },
    high: {
      variant: 'outline',
      className: 'border-orange-300 text-orange-700 bg-orange-50',
    },
    critical: { variant: 'destructive', className: '' },
  }

  const config = variants[level] ?? variants.low

  return (
    <Badge variant={config!.variant} className={config!.className}>
      {level}
    </Badge>
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
  }

  const config = variants[status] || {
    variant: 'outline' as const,
    label: status,
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
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
  const isAtLimit = percentage >= 80

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span
          className={
            isAtLimit ? 'font-medium text-amber-600' : 'text-slate-500'
          }
        >
          {current}/{max} ({percentage}%)
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isAtLimit ? '[&>div]:bg-amber-500' : ''}`}
      />
    </div>
  )
}
