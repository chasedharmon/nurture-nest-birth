'use client'

/**
 * MessageToast Component
 *
 * Toast notification for new messages with:
 * - Sender name and message preview
 * - Click to navigate to conversation
 * - Dismiss button
 * - Stacked display for multiple notifications
 */

import { useRouter } from 'next/navigation'
import { X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageToastProps {
  id: string
  conversationId: string
  senderName: string
  preview: string
  onDismiss: (id: string) => void
  /** Base path for navigation (e.g., '/admin/messages' or '/client/messages') */
  basePath?: string
  className?: string
}

export function MessageToast({
  id,
  conversationId,
  senderName,
  preview,
  onDismiss,
  basePath = '/admin/messages',
  className,
}: MessageToastProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`${basePath}/${conversationId}`)
    onDismiss(id)
  }

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-right-full fade-in duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-primary/10 p-2">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm text-foreground truncate">
              {senderName}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={e => {
                e.stopPropagation()
                onDismiss(id)
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {preview}
          </p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 mt-1 text-primary"
            onClick={handleClick}
          >
            View message
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * MessageToastContainer Component
 *
 * Container for stacking multiple toast notifications
 */
interface MessageToastContainerProps {
  notifications: Array<{
    id: string
    conversationId: string
    senderName: string
    preview: string
  }>
  onDismiss: (id: string) => void
  basePath?: string
  className?: string
}

export function MessageToastContainer({
  notifications,
  onDismiss,
  basePath = '/admin/messages',
  className,
}: MessageToastContainerProps) {
  if (notifications.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex flex-col gap-2',
        className
      )}
    >
      {notifications.map((notification, index) => (
        <MessageToast
          key={notification.id}
          {...notification}
          onDismiss={onDismiss}
          basePath={basePath}
          className={cn(
            // Stack effect with slight offset
            index < notifications.length - 1 && 'opacity-90'
          )}
        />
      ))}
    </div>
  )
}
