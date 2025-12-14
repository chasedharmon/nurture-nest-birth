'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Building2,
  Calendar,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
} from 'lucide-react'

import {
  getPlatformAuditLog,
  type PlatformAuditLogEntry,
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

/**
 * Platform Audit Log Page
 *
 * Tracks and displays all super-admin actions for GDPR compliance
 * and security monitoring.
 */
export default function AuditLogPage() {
  const [auditEntries, setAuditEntries] = useState<PlatformAuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<string>('7')

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getPlatformAuditLog({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        limit: 200,
      })

      if (result.success && result.data) {
        let entries = result.data.entries || []

        // Client-side search filtering
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          entries = entries.filter(
            (entry: PlatformAuditLogEntry) =>
              entry.action.toLowerCase().includes(query) ||
              entry.description?.toLowerCase().includes(query) ||
              entry.admin_email?.toLowerCase().includes(query) ||
              entry.target_organization_name?.toLowerCase().includes(query)
          )
        }

        setAuditEntries(entries)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [actionFilter, dateRange])

  const handleSearch = () => {
    loadData()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // Group by action type for stats
  const actionCounts = auditEntries.reduce(
    (acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Platform Audit Log
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Track all platform administration actions for compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/50">
                <Activity className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{auditEntries.length}</p>
                <p className="text-xs text-slate-500">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                <Eye className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {actionCounts['tenant_view'] || 0}
                </p>
                <p className="text-xs text-slate-500">Tenant Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
                <Shield className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(actionCounts['data_export'] || 0) +
                    (actionCounts['account_deletion'] || 0)}
                </p>
                <p className="text-xs text-slate-500">GDPR Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {actionCounts['tenant_suspend'] || 0}
                </p>
                <p className="text-xs text-slate-500">Suspensions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Filters:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-slate-400" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="tenant_view">Tenant View</SelectItem>
                <SelectItem value="tenant_create">Tenant Create</SelectItem>
                <SelectItem value="tenant_update">Tenant Update</SelectItem>
                <SelectItem value="tenant_suspend">Tenant Suspend</SelectItem>
                <SelectItem value="tenant_reactivate">
                  Tenant Reactivate
                </SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
                <SelectItem value="account_deletion">
                  Account Deletion
                </SelectItem>
                <SelectItem value="metrics_refresh">Metrics Refresh</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by admin, tenant, or details..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            All platform administration actions are logged for compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : auditEntries.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No audit entries found for the selected filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {formatDateTime(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <User className="size-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {entry.admin_email || 'System'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ActionBadge action={entry.action} />
                    </TableCell>
                    <TableCell>
                      {entry.target_organization_name ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-slate-400" />
                          <span className="text-sm">
                            {entry.target_organization_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="max-w-xs truncate text-sm text-slate-500">
                        {entry.description || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {entry.ip_address || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================================
// Helper Components & Functions
// =====================================================

function ActionBadge({ action }: { action: string }) {
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      className: string
    }
  > = {
    tenant_view: { variant: 'outline', className: '' },
    tenant_create: { variant: 'default', className: 'bg-emerald-500' },
    tenant_update: { variant: 'secondary', className: '' },
    tenant_suspend: { variant: 'destructive', className: '' },
    tenant_reactivate: { variant: 'default', className: 'bg-emerald-500' },
    data_export: {
      variant: 'outline',
      className: 'border-blue-300 text-blue-700 bg-blue-50',
    },
    account_deletion: { variant: 'destructive', className: '' },
    metrics_refresh: { variant: 'outline', className: '' },
  }

  const config = variants[action] || {
    variant: 'outline' as const,
    className: '',
  }
  const label = action.replace(/_/g, ' ')

  return (
    <Badge
      variant={config.variant}
      className={`capitalize ${config.className}`}
    >
      {label}
    </Badge>
  )
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
