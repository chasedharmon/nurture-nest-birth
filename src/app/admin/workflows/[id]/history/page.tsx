import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkflow, getWorkflowExecutions } from '@/app/actions/workflows'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  Workflow,
  History,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ExecutionDetailsDialog } from './execution-details-dialog'
import type { WorkflowExecutionStatus } from '@/lib/workflows/types'

interface WorkflowHistoryPageProps {
  params: Promise<{ id: string }>
}

const statusConfig: Record<
  WorkflowExecutionStatus,
  { label: string; icon: typeof CheckCircle; className: string }
> = {
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  running: {
    label: 'Running',
    icon: Loader2,
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  waiting: {
    label: 'Waiting',
    icon: Clock,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
}

export default async function WorkflowHistoryPage({
  params,
}: WorkflowHistoryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [workflowResult, executionsResult] = await Promise.all([
    getWorkflow(id),
    getWorkflowExecutions(id, 100),
  ])

  if (workflowResult.error || !workflowResult.data) {
    notFound()
  }

  const workflow = workflowResult.data
  const executions = executionsResult.data || []

  // Calculate stats
  const totalExecutions = executions.length
  const completedExecutions = executions.filter(
    e => e.status === 'completed'
  ).length
  const failedExecutions = executions.filter(e => e.status === 'failed').length
  const runningExecutions = executions.filter(
    e => e.status === 'running' || e.status === 'waiting'
  ).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/admin/workflows/${id}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to Builder
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Execution History
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {workflow.name}
                  </p>
                </div>
              </div>
            </div>
            <Link href={`/admin/workflows/${id}`}>
              <Button variant="outline" size="sm">
                <Workflow className="mr-2 h-4 w-4" />
                Edit Workflow
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Executions
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExecutions}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedExecutions}</div>
              <p className="text-xs text-muted-foreground">
                {totalExecutions > 0
                  ? `${Math.round((completedExecutions / totalExecutions) * 100)}% success rate`
                  : 'No executions yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedExecutions}</div>
              <p className="text-xs text-muted-foreground">
                {totalExecutions > 0
                  ? `${Math.round((failedExecutions / totalExecutions) * 100)}% failure rate`
                  : 'No failures'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningExecutions}</div>
              <p className="text-xs text-muted-foreground">
                Currently running or waiting
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Executions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>
              View details and troubleshoot workflow executions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {executions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <History className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No executions yet</p>
                <p className="text-sm">
                  This workflow hasn&apos;t been triggered yet. Activate it and
                  trigger an event to see executions here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Record
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Trigger
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Started
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Duration
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {executions.map(execution => {
                      const config =
                        statusConfig[
                          execution.status as WorkflowExecutionStatus
                        ]
                      const StatusIcon = config.icon

                      // Calculate duration
                      const startedAt = new Date(execution.started_at)
                      const endedAt = execution.completed_at
                        ? new Date(execution.completed_at)
                        : new Date()
                      const durationMs = endedAt.getTime() - startedAt.getTime()
                      const durationSeconds = Math.floor(durationMs / 1000)
                      const durationMinutes = Math.floor(durationSeconds / 60)
                      const durationDisplay =
                        durationMinutes > 0
                          ? `${durationMinutes}m ${durationSeconds % 60}s`
                          : `${durationSeconds}s`

                      // Get trigger type from context
                      const triggerType =
                        (
                          execution.context as {
                            trigger_type?: string
                          }
                        )?.trigger_type || 'automatic'

                      return (
                        <tr key={execution.id} className="hover:bg-muted/50">
                          <td className="px-4 py-4">
                            <Badge
                              variant="secondary"
                              className={`gap-1 ${config.className}`}
                            >
                              <StatusIcon
                                className={`h-3 w-3 ${execution.status === 'running' ? 'animate-spin' : ''}`}
                              />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {execution.record_type}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {execution.record_id.slice(0, 8)}...
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="capitalize">
                              {triggerType.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-foreground">
                                {formatDistanceToNow(startedAt, {
                                  addSuffix: true,
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(startedAt, 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {execution.status === 'running' ||
                            execution.status === 'waiting'
                              ? 'In progress...'
                              : durationDisplay}
                          </td>
                          <td className="px-4 py-4">
                            <ExecutionDetailsDialog
                              executionId={execution.id}
                              status={
                                execution.status as WorkflowExecutionStatus
                              }
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
