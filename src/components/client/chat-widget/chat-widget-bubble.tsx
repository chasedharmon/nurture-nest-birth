'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PulsingBadge } from '@/components/ui/pulsing-badge'
import { cn } from '@/lib/utils'

interface ChatWidgetBubbleProps {
  /** Number of unread messages */
  unreadCount: number
  /** Click handler to expand widget */
  onClick: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * ChatWidgetBubble - Floating chat button in bottom-right corner
 *
 * Following industry patterns (Intercom/Drift/Crisp):
 * - 56px circular button for easy touch target (WCAG 2.2)
 * - Primary color with shadow for visibility
 * - Pulsing badge when unread > 0
 * - Scale animation on hover
 */
export function ChatWidgetBubble({
  unreadCount,
  onClick,
  className,
}: ChatWidgetBubbleProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        // Size and shape
        'h-14 w-14 rounded-full',
        // Elevation
        'shadow-lg hover:shadow-xl',
        // Animation
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        // Ensure it's above other content
        'relative',
        className
      )}
      aria-label={
        unreadCount > 0
          ? `Open messages. ${unreadCount} unread`
          : 'Open messages'
      }
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <PulsingBadge
          count={unreadCount}
          size="sm"
          className="absolute -top-1 -right-1"
        />
      )}
    </Button>
  )
}
