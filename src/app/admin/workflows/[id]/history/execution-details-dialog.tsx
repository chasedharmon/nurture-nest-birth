'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Ban,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  getWorkflowExecution,
  retryWorkflowExecution,
  cancelWorkflowExecution,
} from '@/app/actions/workflows'
import type {
  WorkflowExecutionStatus,
  StepExecutionStatus,
  ExecutionContext,
} from '@/lib/workflows/types'
import { useRouter } from 'next/navigation'

interface ExecutionDetailsDialogProps {
  executionId: string
  status: WorkflowExecutionStatus
}

interface ExecutionDetails {
  id: string
  workflow_id: string
  record_type: string
  record_id: string
  status: WorkflowExecutionStatus
  current_step_key: string | null
  context: ExecutionContext
  error_message: string | null
  retry_count: number
  started_at: string
  completed_at: string | null
  next_run_at: string | null
  waiting_for: string | null
  step_executions: Array<{
    id: string
    step_id: string
    status: StepExecutionStatus
    input: Record<string, unknown> | null
    output: Record<string, unknown> | null
    error_message: string | null
    started_at: string
    completed_at: string | null
  }>
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

const stepStatusConfig: Record<
  StepExecutionStatus,
  { label: string; icon: typeof CheckCircle; className: string }
> = {
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'text-green-600 dark:text-green-400',
  },
  running: {
    label: 'Running',
    icon: Loader2,
    className: 'text-blue-600 dark:text-blue-400',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'text-gray-400 dark:text-gray-500',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'text-red-600 dark:text-red-400',
  },
  skipped: {
    label: 'Skipped',
    icon: AlertCircle,
    className: 'text-gray-500 dark:text-gray-400',
  },
}

export function ExecutionDetailsDialog({
  executionId,
  status,
}: ExecutionDetailsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [details, setDetails] = useState<ExecutionDetails | null>(null)

  const fetchDetails = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getWorkflowExecution(executionId)
      if (!error && data) {
        setDetails(data as ExecutionDetails)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchDetails()
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await retryWorkflowExecution(executionId)
      await fetchDetails()
      router.refresh()
    } finally {
      setIsRetrying(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await cancelWorkflowExecution(executionId)
      await fetchDetails()
      router.refresh()
    } finally {
      setIsCancelling(false)
    }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Execution Details
            <Badge variant="secondary" className={`gap-1 ${config.className}`}>
              <StatusIcon
                className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`}
              />
              {config.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View the details and step-by-step progress of this workflow
            execution
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Record Type</p>
                  <p className="font-medium capitalize">
                    {details.record_type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Record ID</p>
                  <p className="font-mono text-xs">{details.record_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {format(
                      new Date(details.started_at),
                      'MMM d, yyyy h:mm:ss a'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {details.completed_at ? 'Completed' : 'Duration'}
                  </p>
                  <p className="font-medium">
                    {details.completed_at
                      ? format(
                          new Date(details.completed_at),
                          'MMM d, yyyy h:mm:ss a'
                        )
                      : formatDistanceToNow(new Date(details.started_at), {
                          addSuffix: false,
                        })}
                  </p>
                </div>
                {details.retry_count > 0 && (
                  <div>
                    <p className="text-muted-foreground">Retry Count</p>
                    <p className="font-medium">{details.retry_count}</p>
                  </div>
                )}
                {details.waiting_for && (
                  <div>
                    <p className="text-muted-foreground">Waiting For</p>
                    <p className="font-medium">{details.waiting_for}</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {details.error_message && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Error Message
                  </p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                    {details.error_message}
                  </p>
                </div>
              )}

              {/* Step Executions */}
              <div>
                <h4 className="mb-3 font-medium">Step Executions</h4>
                {details.step_executions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No steps have been executed yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {details.step_executions.map((step, index) => {
                      const stepConfig = stepStatusConfig[step.status]
                      const StepIcon = stepConfig.icon

                      return (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <div
                            className={`mt-0.5 ${stepConfig.className} ${step.status === 'running' ? 'animate-spin' : ''}`}
                          >
                            <StepIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                Step {index + 1}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {step.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.completed_at
                                ? `Completed ${formatDistanceToNow(new Date(step.completed_at), { addSuffix: true })}`
                                : step.started_at
                                  ? `Started ${formatDistanceToNow(new Date(step.started_at), { addSuffix: true })}`
                                  : 'Pending'}
                            </p>
                            {step.error_message && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {step.error_message}
                              </p>
                            )}
                            {step.output &&
                              Object.keys(step.output).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    View output
                                  </summary>
                                  <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(step.output, null, 2)}
                                  </pre>
                                </details>
                              )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {(status === 'failed' || status === 'cancelled') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying}
                  >
                    {isRetrying && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Execution
                  </Button>
                )}
                {(status === 'running' || status === 'waiting') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Execution
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Failed to load execution details
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
