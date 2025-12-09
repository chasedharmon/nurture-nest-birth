'use client'

/**
 * NavMessageBadge - Real-time message badge for admin navigation
 *
 * This client component subscribes to real-time unread count updates
 * and displays a badge that updates without page refresh.
 */

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUnreadCount } from '@/lib/hooks/use-unread-count'

interface NavMessageBadgeProps {
  userId: string
  initialCount?: number
}

export function NavMessageBadge({
  userId,
  initialCount = 0,
}: NavMessageBadgeProps) {
  const { unreadCount } = useUnreadCount({
    userId,
    initialCount,
  })

  return (
    <Link href="/admin/messages">
      <Button variant="outline" size="sm" className="relative">
        <MessageSquare className="mr-2 h-4 w-4" />
        Messages
        {unreadCount > 0 && (
          <Badge
            variant="default"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
