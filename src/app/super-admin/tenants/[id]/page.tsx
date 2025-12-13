'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  Mail,
  PauseCircle,
  PlayCircle,
  User,
  Users,
  Workflow,
} from 'lucide-react'

import {
  getTenant,
  updateTier,
  suspendTenant,
  reactivateTenant,
  getTenantMembers,
} from '@/app/actions/super-admin'
import type { Organization } from '@/lib/supabase/types'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Tenant Detail Page
 *
 * Shows detailed information about a tenant and actions:
 * - Usage statistics
 * - Subscription status and tier
 * - Suspend/reactivate
 * - Change tier
 * - Impersonate members
 */
export default function TenantDetailPage() {
  const params = useParams()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<Organization | null>(null)
  const [usage, setUsage] = useState<{
    teamMembers: number
    clients: number
    contacts: number
    leads: number
    workflows: number
  } | null>(null)
  const [owner, setOwner] = useState<{
    id: string
    email: string
    full_name: string | null
  } | null>(null)
  const [members, setMembers] = useState<
    Array<{
      id: string
      user_id: string
      role: string
      user: { id: string; email: string; full_name: string | null }
    }>
  >([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Suspend modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  // Load tenant data
  useEffect(() => {
    const loadTenant = async () => {
      setIsLoading(true)
      const result = await getTenant(tenantId)

      if (result.success && result.data) {
        setTenant(result.data.tenant)
        setUsage(result.data.usage)
        setOwner(result.data.owner)
        setError(null)

        // Load members
        const membersResult = await getTenantMembers(tenantId)
        if (membersResult.success && membersResult.data) {
          setMembers(membersResult.data)
        }
      } else {
        setError(result.error || 'Failed to load tenant')
      }

      setIsLoading(false)
    }

    loadTenant()
  }, [tenantId])

  const handleTierChange = (
    newTier: 'starter' | 'professional' | 'business' | 'enterprise'
  ) => {
    startTransition(async () => {
      const result = await updateTier(tenantId, newTier)
      if (result.success) {
        // Reload tenant data
        const tenantResult = await getTenant(tenantId)
        if (tenantResult.success && tenantResult.data) {
          setTenant(tenantResult.data.tenant)
        }
      } else {
        setError(result.error || 'Failed to update tier')
      }
    })
  }

  const handleSuspend = () => {
    if (!suspendReason.trim()) {
      setError('Please provide a reason for suspension')
      return
    }

    startTransition(async () => {
      const result = await suspendTenant(tenantId, suspendReason)
      if (result.success) {
        setShowSuspendModal(false)
        setSuspendReason('')
        // Reload tenant data
        const tenantResult = await getTenant(tenantId)
        if (tenantResult.success && tenantResult.data) {
          setTenant(tenantResult.data.tenant)
        }
      } else {
        setError(result.error || 'Failed to suspend tenant')
      }
    })
  }

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateTenant(tenantId)
      if (result.success) {
        // Reload tenant data
        const tenantResult = await getTenant(tenantId)
        if (tenantResult.success && tenantResult.data) {
          setTenant(tenantResult.data.tenant)
        }
      } else {
        setError(result.error || 'Failed to reactivate tenant')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error && !tenant) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Tenants
        </Link>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!tenant) return null

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/super-admin/tenants"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Tenants
      </Link>

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
            <Building2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {tenant.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={tenant.subscription_status} />
          <TierBadge tier={tenant.subscription_tier} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Current resource usage for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <UsageStat
                  label="Team Members"
                  value={usage?.teamMembers || 0}
                  limit={tenant.max_team_members}
                  icon={<Users className="size-4" />}
                />
                <UsageStat
                  label="Clients"
                  value={usage?.clients || 0}
                  limit={tenant.max_clients}
                  icon={<User className="size-4" />}
                />
                <UsageStat
                  label="Workflows"
                  value={usage?.workflows || 0}
                  limit={tenant.max_workflows}
                  icon={<Workflow className="size-4" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                Users with access to this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="py-4 text-center text-slate-500">
                  No members found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {member.user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {member.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title="Impersonation coming soon"
                          >
                            Impersonate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={<Mail className="size-4" />}
                label="Owner"
                value={owner?.email || 'Unknown'}
              />
              <InfoRow
                icon={<Calendar className="size-4" />}
                label="Created"
                value={formatDate(tenant.created_at)}
              />
              {tenant.trial_ends_at && (
                <InfoRow
                  icon={<Calendar className="size-4" />}
                  label="Trial Ends"
                  value={formatDate(tenant.trial_ends_at)}
                />
              )}
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage subscription tier and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Select
                  value={tenant.subscription_tier}
                  onValueChange={handleTierChange}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                {tenant.subscription_status === 'suspended' ? (
                  <Button
                    onClick={handleReactivate}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 size-4" />
                    )}
                    Reactivate Tenant
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => setShowSuspendModal(true)}
                    disabled={isPending}
                    className="w-full"
                  >
                    <PauseCircle className="mr-2 size-4" />
                    Suspend Tenant
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Suspend Tenant</CardTitle>
              <CardDescription>
                This will prevent all users in this organization from accessing
                the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Suspension *</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Non-payment, Terms violation..."
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuspendModal(false)
                    setSuspendReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSuspend}
                  disabled={isPending || !suspendReason.trim()}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <PauseCircle className="mr-2 size-4" />
                  )}
                  Suspend
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Helper Components
// =====================================================

function UsageStat({
  label,
  value,
  limit,
  icon,
}: {
  label: string
  value: number
  limit: number
  icon: React.ReactNode
}) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((value / limit) * 100, 100)
  const isNearLimit = !isUnlimited && percentage >= 80

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="text-sm text-slate-500">
          / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full transition-all ${
              isNearLimit ? 'bg-amber-500' : 'bg-violet-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-900 dark:text-white">
        {value}
      </span>
    </div>
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
