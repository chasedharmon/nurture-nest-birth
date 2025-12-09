import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowWithSteps } from '@/app/actions/workflows'
import { Button } from '@/components/ui/button'
import { ChevronLeft, TrendingUp } from 'lucide-react'
import { AnalyticsDashboard } from './analytics-dashboard'

interface WorkflowAnalyticsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ range?: string }>
}

export default async function WorkflowAnalyticsPage({
  params,
  searchParams,
}: WorkflowAnalyticsPageProps) {
  const { id } = await params
  const { range = '30d' } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: workflow, error } = await getWorkflowWithSteps(id)

  if (error || !workflow) {
    notFound()
  }

  // Calculate date range
  const now = new Date()
  let startDate: Date
  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'all':
      startDate = new Date(0)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  // Fetch execution statistics
  const { data: executions } = await supabase
    .from('workflow_executions')
    .select('id, status, started_at, completed_at, error_message')
    .eq('workflow_id', id)
    .gte('started_at', startDate.toISOString())
    .order('started_at', { ascending: false })

  // Fetch step executions for funnel
  const { data: stepExecutions } = await supabase
    .from('workflow_step_executions')
    .select('step_id, status, started_at, completed_at, error_message')
    .in(
      'execution_id',
      (executions || []).map(e => e.id)
    )

  // Calculate statistics
  const stats = {
    total: executions?.length || 0,
    completed: executions?.filter(e => e.status === 'completed').length || 0,
    failed: executions?.filter(e => e.status === 'failed').length || 0,
    running: executions?.filter(e => e.status === 'running').length || 0,
    waiting: executions?.filter(e => e.status === 'waiting').length || 0,
    cancelled: executions?.filter(e => e.status === 'cancelled').length || 0,
  }

  // Calculate success rate
  const completedOrFailed = stats.completed + stats.failed
  const successRate =
    completedOrFailed > 0
      ? Math.round((stats.completed / completedOrFailed) * 100)
      : 0

  // Calculate average duration for completed executions
  const completedExecutions = (executions || []).filter(
    e => e.status === 'completed' && e.completed_at
  )
  const avgDurationMs =
    completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          const duration =
            new Date(e.completed_at!).getTime() -
            new Date(e.started_at).getTime()
          return sum + duration
        }, 0) / completedExecutions.length
      : 0

  // Calculate step-by-step funnel
  const stepFunnel = workflow.steps
    .filter(s => s.step_type !== 'trigger')
    .map(step => {
      const stepExecs = (stepExecutions || []).filter(
        se => se.step_id === step.id
      )
      return {
        stepKey: step.step_key,
        stepType: step.step_type,
        total: stepExecs.length,
        completed: stepExecs.filter(se => se.status === 'completed').length,
        failed: stepExecs.filter(se => se.status === 'failed').length,
        skipped: stepExecs.filter(se => se.status === 'skipped').length,
      }
    })

  // Error breakdown
  const errorBreakdown = (executions || [])
    .filter(e => e.error_message)
    .reduce(
      (acc, e) => {
        const msg = e.error_message || 'Unknown error'
        acc[msg] = (acc[msg] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

  // Executions over time (group by day)
  const executionsByDay = (executions || []).reduce(
    (acc, e) => {
      const dayStr = new Date(e.started_at).toISOString().split('T')[0]
      if (!dayStr) return acc
      const existing = acc[dayStr]
      if (!existing) {
        acc[dayStr] = { total: 0, completed: 0, failed: 0 }
      }
      const day = acc[dayStr]!
      day.total++
      if (e.status === 'completed') day.completed++
      if (e.status === 'failed') day.failed++
      return acc
    },
    {} as Record<string, { total: number; completed: number; failed: number }>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/admin/workflows/${id}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to Builder
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    Workflow Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {workflow.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/workflows/${id}/history`}>
                <Button variant="outline" size="sm">
                  View Executions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Analytics Dashboard */}
      <main className="container mx-auto px-4 py-8">
        <AnalyticsDashboard
          range={range}
          stats={stats}
          successRate={successRate}
          avgDurationMs={avgDurationMs}
          stepFunnel={stepFunnel}
          errorBreakdown={errorBreakdown}
          executionsByDay={executionsByDay}
        />
      </main>
    </div>
  )
}
