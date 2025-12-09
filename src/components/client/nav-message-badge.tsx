'use client'

/**
 * ClientNavMessageBadge - Real-time message badge for client portal navigation
 *
 * This client component subscribes to real-time unread count updates
 * and displays a badge that updates without page refresh.
 */

import Link from 'next/link'
import { useUnreadCount } from '@/lib/hooks/use-unread-count'
import { PulsingBadge } from '@/components/ui/pulsing-badge'
import { cn } from '@/lib/utils'

interface ClientNavMessageBadgeProps {
  clientId: string
  initialCount?: number
  className?: string
}

export function ClientNavMessageBadge({
  clientId,
  initialCount = 0,
  className,
}: ClientNavMessageBadgeProps) {
  const { unreadCount } = useUnreadCount({
    clientId,
    initialCount,
  })

  return (
    <Link
      href="/client/messages"
      className={cn(
        'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors relative inline-flex items-center',
        className
      )}
    >
      Messages
      {unreadCount > 0 && (
        <PulsingBadge count={unreadCount} size="sm" className="ml-1.5" />
      )}
    </Link>
  )
}
