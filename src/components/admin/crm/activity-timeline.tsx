'use client'

/**
 * ActivityTimeline - Displays a chronological timeline of activities
 *
 * Used to show tasks, events, calls, emails, and notes related to
 * a CRM record in a visually appealing timeline format.
 */

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  StickyNote,
  Clock,
  Check,
  MoreHorizontal,
  Plus,
  Filter,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { CrmActivity, ActivityType } from '@/lib/crm/types'
import { updateRecord } from '@/app/actions/crm-records'

// =====================================================
// TYPES
// =====================================================

export interface ActivityTimelineProps {
  /** Activities to display */
  activities: CrmActivity[]
  /** Total count for "View All" link */
  totalCount: number
  /** Show add activity button */
  showAddButton?: boolean
  /** Callback when add button clicked */
  onAddActivity?: () => void
  /** Enable inline completion toggle */
  enableCompletion?: boolean
  /** Show filter dropdown */
  showFilter?: boolean
}

// =====================================================
// ACTIVITY TYPE CONFIG
// =====================================================

interface ActivityTypeConfig {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
}

const activityTypeConfig: Record<ActivityType, ActivityTypeConfig> = {
  task: {
    icon: CheckSquare,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Task',
  },
  event: {
    icon: Calendar,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Event',
  },
  call: {
    icon: Phone,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Call',
  },
  email: {
    icon: Mail,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Email',
  },
  note: {
    icon: StickyNote,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    label: 'Note',
  },
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function ActivityTimeline({
  activities,
  totalCount,
  showAddButton = true,
  onAddActivity,
  enableCompletion = true,
  showFilter = true,
}: ActivityTimelineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filterTypes, setFilterTypes] = useState<Set<ActivityType>>(
    new Set(['task', 'event', 'call', 'email', 'note'])
  )

  // Filter activities by type
  const filteredActivities = activities.filter(a =>
    filterTypes.has(a.activity_type)
  )

  // Toggle activity completion
  const handleToggleComplete = useCallback(
    async (activity: CrmActivity) => {
      if (!enableCompletion) return
      if (activity.activity_type === 'note') return // Notes can't be completed

      const newStatus = activity.status === 'completed' ? 'open' : 'completed'
      startTransition(async () => {
        await updateRecord('Activity', activity.id, {
          status: newStatus,
          completed_at:
            newStatus === 'completed' ? new Date().toISOString() : null,
        })
        router.refresh()
      })
    },
    [enableCompletion, router]
  )

  // Toggle filter type
  const toggleFilterType = useCallback((type: ActivityType) => {
    setFilterTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base font-medium">
          Activity Timeline
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {showFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Activity Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(activityTypeConfig) as ActivityType[]).map(
                  type => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filterTypes.has(type)}
                      onCheckedChange={() => toggleFilterType(type)}
                    >
                      {activityTypeConfig[type].label}
                    </DropdownMenuCheckboxItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showAddButton && onAddActivity && (
            <Button variant="outline" size="sm" onClick={onAddActivity}>
              <Plus className="mr-2 h-4 w-4" />
              Log Activity
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredActivities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No activities to display
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {/* Timeline items */}
            <div className="space-y-4">
              {filteredActivities.map(activity => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  onToggleComplete={handleToggleComplete}
                  enableCompletion={enableCompletion}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =====================================================
// ACTIVITY ITEM
// =====================================================

interface ActivityItemProps {
  activity: CrmActivity
  onToggleComplete: (activity: CrmActivity) => void
  enableCompletion: boolean
  isPending: boolean
}

function ActivityItem({
  activity,
  onToggleComplete,
  enableCompletion,
  isPending,
}: ActivityItemProps) {
  const config = activityTypeConfig[activity.activity_type]
  const Icon = config.icon
  const isCompleted = activity.status === 'completed'
  const isOverdue =
    activity.due_date &&
    new Date(activity.due_date) < new Date() &&
    !isCompleted

  return (
    <div className="relative pl-10">
      {/* Icon */}
      <div
        className={cn(
          'absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full',
          config.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div
        className={cn(
          'rounded-lg border border-border p-4 transition-colors',
          isCompleted && 'opacity-60'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {activity.subject}
              </span>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
              {activity.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  High Priority
                </Badge>
              )}
            </div>

            {/* Meta info */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              </span>
              {activity.due_date && (
                <>
                  <span>&middot;</span>
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      isOverdue && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    Due {format(new Date(activity.due_date), 'MMM d, yyyy')}
                  </span>
                </>
              )}
              {isCompleted && activity.completed_at && (
                <>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3" />
                    Completed {format(new Date(activity.completed_at), 'MMM d')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {enableCompletion && activity.activity_type !== 'note' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleComplete(activity)}
                disabled={isPending}
                className={cn(
                  'h-8 w-8 p-0',
                  isCompleted && 'text-green-600 dark:text-green-400'
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <CheckSquare className="h-4 w-4" />
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Call-specific info */}
        {activity.activity_type === 'call' && activity.call_result && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {activity.call_direction === 'inbound' ? 'Inbound' : 'Outbound'}
              {activity.call_result && ` - ${activity.call_result}`}
            </Badge>
          </div>
        )}

        {/* Event-specific info */}
        {activity.activity_type === 'event' && activity.location && (
          <div className="mt-2 text-xs text-muted-foreground">
            Location: {activity.location}
          </div>
        )}
      </div>
    </div>
  )
}
