'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from 'lucide-react'

import { getTenants } from '@/app/actions/super-admin'
import type { TenantListItem } from '@/lib/platform/super-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

const PAGE_SIZE = 20

/**
 * Tenant List Page
 *
 * Displays all tenants with:
 * - Search by name/slug
 * - Filter by status
 * - Filter by tier
 * - Pagination
 */
export default function TenantsListPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch tenants when filters change
  useEffect(() => {
    const fetchTenants = async () => {
      startTransition(async () => {
        const result = await getTenants({
          search: search || undefined,
          status: statusFilter || undefined,
          tier: tierFilter || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        })

        if (result.success && result.data) {
          setTenants(result.data.tenants)
          setTotal(result.data.total)
          setError(null)
        } else {
          setError(result.error || 'Failed to load tenants')
        }
      })
    }

    fetchTenants()
  }, [search, statusFilter, tierFilter, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tenants
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage all organizations on the platform
          </p>
        </div>
        <Link href="/super-admin/tenants/new">
          <Button>
            <Building2 className="mr-2 size-4" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name or slug..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(0) // Reset to first page
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={value => {
                setStatusFilter(value === 'all' ? '' : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>

            {/* Tier Filter */}
            <Select
              value={tierFilter}
              onValueChange={value => {
                setTierFilter(value === 'all' ? '' : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {total} {total === 1 ? 'Tenant' : 'Tenants'}
            </CardTitle>
            {isPending && <Loader2 className="size-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 && !isPending ? (
            <p className="py-8 text-center text-slate-500">
              {search || statusFilter || tierFilter
                ? 'No tenants match your filters'
                : 'No tenants yet'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(tenant => (
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
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {tenant.member_count}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-slate-500">
                Showing {page * PAGE_SIZE + 1} to{' '}
                {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || isPending}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isPending}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================================
// Helper Components
// =====================================================

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
