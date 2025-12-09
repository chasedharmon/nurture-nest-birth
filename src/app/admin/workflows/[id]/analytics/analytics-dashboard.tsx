'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Ban,
  TrendingUp,
  Timer,
  Percent,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'

interface AnalyticsDashboardProps {
  range: string
  stats: {
    total: number
    completed: number
    failed: number
    running: number
    waiting: number
    cancelled: number
  }
  successRate: number
  avgDurationMs: number
  stepFunnel: Array<{
    stepKey: string
    stepType: string
    total: number
    completed: number
    failed: number
    skipped: number
  }>
  errorBreakdown: Record<string, number>
  executionsByDay: Record<
    string,
    { total: number; completed: number; failed: number }
  >
}

const STEP_TYPE_LABELS: Record<string, string> = {
  send_email: 'Send Email',
  send_sms: 'Send SMS',
  create_task: 'Create Task',
  update_field: 'Update Field',
  create_record: 'Create Record',
  wait: 'Wait',
  decision: 'Decision',
  send_message: 'Portal Message',
  webhook: 'Webhook',
  end: 'End',
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`
  return `${(ms / 86400000).toFixed(1)}d`
}

export function AnalyticsDashboard({
  range,
  stats,
  successRate,
  avgDurationMs,
  stepFunnel,
  errorBreakdown,
  executionsByDay,
}: AnalyticsDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleRangeChange = (newRange: string) => {
    router.push(`${pathname}?range=${newRange}`)
  }

  const maxDayExecutions = Math.max(
    ...Object.values(executionsByDay).map(d => d.total),
    1
  )

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <Select value={range} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                {stats.completed} completed
              </Badge>
              {stats.failed > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {stats.failed} failed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
            <Progress value={successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Avg. Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgDurationMs > 0 ? formatDuration(avgDurationMs) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              For completed executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Completed
                </span>
                <span className="font-medium">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  Failed
                </span>
                <span className="font-medium">{stats.failed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  Running
                </span>
                <span className="font-medium">{stats.running}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Pause className="h-3 w-3 text-yellow-600" />
                  Waiting
                </span>
                <span className="font-medium">{stats.waiting}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Ban className="h-3 w-3 text-gray-600" />
                  Cancelled
                </span>
                <span className="font-medium">{stats.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step-by-Step Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {stepFunnel.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No steps have been executed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stepFunnel.map((step, index) => {
                  const completionRate =
                    step.total > 0
                      ? Math.round((step.completed / step.total) * 100)
                      : 0
                  return (
                    <div key={step.stepKey}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {index + 1}.
                          </span>
                          <span className="font-medium">
                            {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                          </span>
                          <span className="text-muted-foreground">
                            ({step.stepKey})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600">
                            {step.completed} passed
                          </span>
                          {step.failed > 0 && (
                            <span className="text-red-600">
                              {step.failed} failed
                            </span>
                          )}
                          {step.skipped > 0 && (
                            <span className="text-gray-500">
                              {step.skipped} skipped
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={completionRate}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Error Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(errorBreakdown).length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No errors in this period!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(errorBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([error, count]) => (
                    <div
                      key={error}
                      className="flex items-start justify-between gap-2 p-2 rounded bg-red-50 dark:bg-red-900/20"
                    >
                      <p className="text-sm text-red-700 dark:text-red-300 line-clamp-2">
                        {error}
                      </p>
                      <Badge variant="outline" className="shrink-0">
                        {count}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Executions Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(executionsByDay).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No executions in this period.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(executionsByDay)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 14)
                .reverse()
                .map(([day, data]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {new Date(day).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex-1 flex items-center gap-1 h-5">
                      <div
                        className="h-full bg-green-500 rounded-sm transition-all"
                        style={{
                          width: `${(data.completed / maxDayExecutions) * 100}%`,
                        }}
                        title={`${data.completed} completed`}
                      />
                      <div
                        className="h-full bg-red-500 rounded-sm transition-all"
                        style={{
                          width: `${(data.failed / maxDayExecutions) * 100}%`,
                        }}
                        title={`${data.failed} failed`}
                      />
                      <div
                        className="h-full bg-gray-300 dark:bg-gray-700 rounded-sm transition-all"
                        style={{
                          width: `${((data.total - data.completed - data.failed) / maxDayExecutions) * 100}%`,
                        }}
                        title={`${data.total - data.completed - data.failed} other`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {data.total}
                    </span>
                  </div>
                ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              Completed
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              Failed
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-sm" />
              Other
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
