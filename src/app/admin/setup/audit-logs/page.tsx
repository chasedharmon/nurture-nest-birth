import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getAuditLogs,
  getAuditLogFilterOptions,
  getAuditLogStats,
} from '@/app/actions/audit-logs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  FileText,
  Activity,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { AuditLogsTable } from './audit-logs-table'
import { AuditLogFilters } from './audit-log-filters'
import { AuditLogExport } from './audit-log-export'

interface SearchParams {
  search?: string
  action?: string
  entityType?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: string
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parse search params
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  const filters = {
    search: params.search,
    action: params.action,
    entityType: params.entityType,
    userId: params.userId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  }

  // Fetch data in parallel
  const [logsResult, filterOptionsResult, statsResult] = await Promise.all([
    getAuditLogs({ filters, page, pageSize: 50 }),
    getAuditLogFilterOptions(),
    getAuditLogStats(),
  ])

  const logs = logsResult.success ? (logsResult.logs ?? []) : []
  const total = logsResult.success ? (logsResult.total ?? 0) : 0
  const filterOptions = filterOptionsResult.success
    ? {
        actions: filterOptionsResult.actions ?? [],
        entityTypes: filterOptionsResult.entityTypes ?? [],
        users: filterOptionsResult.users ?? [],
      }
    : { actions: [], entityTypes: [], users: [] }
  const stats = statsResult.success ? statsResult.stats : null

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/setup">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Setup
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Audit Logs
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Track who changed what and when
                  </p>
                </div>
              </div>
            </div>
            <AuditLogExport filters={filters} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Logs
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalLogs.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All recorded activities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.todayLogs.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Activities today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Users with activity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Top Action
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {stats.topActions[0]?.action ?? 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.topActions[0]?.count ?? 0} occurrences
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Actions & Entity Types */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Top Actions
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topActions.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topActions.map(({ action, count }) => (
                      <div
                        key={action}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize text-muted-foreground">
                          {action}
                        </span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Top Entity Types
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topEntityTypes.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topEntityTypes.map(({ entity_type, count }) => (
                      <div
                        key={entity_type}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize text-muted-foreground">
                          {entity_type}
                        </span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <AuditLogFilters
              currentFilters={filters}
              filterOptions={filterOptions}
            />
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Activity Log
              {total > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({total.toLocaleString()} records)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AuditLogsTable
              logs={logs}
              currentPage={page}
              totalPages={totalPages}
              total={total}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
