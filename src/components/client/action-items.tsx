'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Check,
  Circle,
  FileText,
  Calendar,
  Upload,
  CreditCard,
  FileSignature,
  Eye,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import type { ClientActionItem, ActionItemType } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { completeActionItem } from '@/app/actions/client-journey'
import { formatDistanceToNow } from 'date-fns'

interface ActionItemsProps {
  items: ClientActionItem[]
  className?: string
}

const ACTION_TYPE_CONFIG: Record<
  ActionItemType,
  { icon: React.ElementType; color: string }
> = {
  intake_form: { icon: FileText, color: 'text-blue-500' },
  sign_contract: { icon: FileSignature, color: 'text-purple-500' },
  upload_document: { icon: Upload, color: 'text-green-500' },
  schedule_meeting: { icon: Calendar, color: 'text-orange-500' },
  make_payment: { icon: CreditCard, color: 'text-emerald-500' },
  review_document: { icon: Eye, color: 'text-cyan-500' },
  custom: { icon: Circle, color: 'text-gray-500' },
}

export function ActionItems({ items, className }: ActionItemsProps) {
  const [isPending, startTransition] = useTransition()
  const [completingId, setCompletingId] = useState<string | null>(null)

  // Separate completed and pending items
  const pendingItems = items.filter(
    item => item.status === 'pending' || item.status === 'in_progress'
  )
  const completedItems = items.filter(item => item.status === 'completed')

  const completedCount = completedItems.length
  const totalCount = items.length
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleComplete = (id: string) => {
    setCompletingId(id)
    startTransition(async () => {
      await completeActionItem(id)
      setCompletingId(null)
    })
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">What&apos;s Next</CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} completed
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {pendingItems.length === 0 && completedItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No action items yet
          </p>
        ) : (
          <>
            {/* Pending items */}
            {pendingItems.map(item => {
              const config = ACTION_TYPE_CONFIG[item.action_type]
              const Icon = config.icon
              const isCompleting = completingId === item.id

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm active:scale-[0.99]"
                >
                  {/* Checkbox - 44px touch target */}
                  <button
                    onClick={() => handleComplete(item.id)}
                    disabled={isPending}
                    aria-label={`Mark "${item.title}" as complete`}
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center -ml-1',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200',
                        'border-muted-foreground/30 hover:border-primary hover:bg-primary/10 hover:scale-110',
                        isCompleting && 'border-primary bg-primary/10 scale-110'
                      )}
                    >
                      {isCompleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : null}
                    </span>
                  </button>

                  {/* Icon */}
                  <div className={cn('shrink-0', config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                    {item.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due{' '}
                        {formatDistanceToNow(new Date(item.due_date), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>

                  {/* Action button - always visible on mobile, hover on desktop */}
                  {item.action_url && (
                    <Link href={item.action_url}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-9 min-w-[44px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10"
                      >
                        Go
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}

            {/* Completed items (collapsed by default) */}
            {completedItems.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  {completedItems.length} completed item
                  {completedItems.length !== 1 ? 's' : ''}
                </summary>
                <div className="mt-2 space-y-2">
                  {completedItems.map(item => {
                    const config = ACTION_TYPE_CONFIG[item.action_type]
                    const Icon = config.icon

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg p-3 opacity-60"
                      >
                        {/* Completed check */}
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>

                        {/* Icon */}
                        <div className="shrink-0 text-muted-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-through">
                            {item.title}
                          </p>
                          {item.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Completed{' '}
                              {formatDistanceToNow(
                                new Date(item.completed_at),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
