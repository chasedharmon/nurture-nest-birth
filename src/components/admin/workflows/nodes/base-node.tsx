'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData, WorkflowStepType } from '@/lib/workflows/types'

interface BaseNodeProps {
  data: WorkflowNodeData
  selected?: boolean
}
import {
  Zap,
  Mail,
  MessageSquare,
  CheckSquare,
  Edit,
  Plus,
  Clock,
  GitBranch,
  MessageCircle,
  Globe,
  Square,
} from 'lucide-react'

const iconMap: Record<WorkflowStepType, React.ElementType> = {
  trigger: Zap,
  send_email: Mail,
  send_sms: MessageSquare,
  create_task: CheckSquare,
  update_field: Edit,
  create_record: Plus,
  wait: Clock,
  decision: GitBranch,
  send_message: MessageCircle,
  webhook: Globe,
  end: Square,
}

const colorMap: Record<
  WorkflowStepType,
  { bg: string; border: string; icon: string }
> = {
  trigger: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  send_email: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-500',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  send_sms: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-500',
    icon: 'text-green-600 dark:text-green-400',
  },
  create_task: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-500',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  update_field: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-500',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  create_record: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-500',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  wait: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-500',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  decision: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-500',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  send_message: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-500',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
  webhook: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-500',
    icon: 'text-slate-600 dark:text-slate-400',
  },
  end: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-400',
    icon: 'text-gray-500 dark:text-gray-400',
  },
}

function BaseNodeComponent({ data, selected }: BaseNodeProps) {
  const Icon = iconMap[data.stepType] || Square
  const colors = colorMap[data.stepType] || colorMap.end
  const isDecision = data.stepType === 'decision'
  const isTrigger = data.stepType === 'trigger'
  const isEnd = data.stepType === 'end'

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-lg border-2 shadow-md transition-all',
        colors.bg,
        colors.border,
        selected && 'ring-2 ring-primary ring-offset-2',
        data.isRunning && 'animate-pulse',
        data.isCompleted && 'opacity-80',
        data.isFailed && 'border-destructive'
      )}
    >
      {/* Input Handle (not for trigger) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {/* Node Content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-md', colors.bg)}>
            <Icon className={cn('h-4 w-4', colors.icon)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {data.label}
            </p>
            {data.config?.template_name && (
              <p className="text-xs text-muted-foreground truncate">
                {data.config.template_name}
              </p>
            )}
            {data.config?.wait_days && (
              <p className="text-xs text-muted-foreground">
                Wait {data.config.wait_days} day(s)
              </p>
            )}
            {data.config?.condition_field && (
              <p className="text-xs text-muted-foreground truncate">
                If {data.config.condition_field}{' '}
                {data.config.condition_operator} {data.config.condition_value}
              </p>
            )}
          </div>
        </div>

        {/* Status indicators */}
        {data.isRunning && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Running...
          </div>
        )}
        {data.isCompleted && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Completed
          </div>
        )}
        {data.isFailed && (
          <div className="mt-2 text-xs text-destructive flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            Failed
          </div>
        )}
      </div>

      {/* Output Handles */}
      {!isEnd && (
        <>
          {isDecision ? (
            <>
              {/* Yes branch - left */}
              <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
                style={{ left: '30%' }}
              />
              {/* No branch - right */}
              <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
                style={{ left: '70%' }}
              />
            </>
          ) : (
            <Handle
              type="source"
              position={Position.Bottom}
              className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
            />
          )}
        </>
      )}
    </div>
  )
}

export const BaseNode = memo(BaseNodeComponent)
