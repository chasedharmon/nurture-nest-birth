'use client'

import { cn } from '@/lib/utils'

interface PulsingBadgeProps {
  /** Number to display in badge. If undefined, shows dot only */
  count?: number
  /** Show pulsing animation. Defaults to true when count > 0 */
  pulse?: boolean
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * PulsingBadge - Animated unread notification indicator
 *
 * Follows industry patterns from Intercom/Drift/Crisp:
 * - Pulsing glow animation for urgency
 * - Red color for visibility
 * - Count display: 1-9, then "9+"
 * - Respects prefers-reduced-motion
 */
export function PulsingBadge({
  count,
  pulse,
  className,
  size = 'md',
}: PulsingBadgeProps) {
  // Default pulse to true if count > 0
  const shouldPulse = pulse ?? (count !== undefined && count > 0)

  // Size classes
  const sizeClasses = {
    sm: 'h-4 min-w-4 text-[10px]',
    md: 'h-5 min-w-5 text-xs',
    lg: 'h-6 min-w-6 text-sm',
  }

  // Format count for display
  const displayCount =
    count !== undefined ? (count > 9 ? '9+' : count.toString()) : null

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-full font-semibold',
        // Color - using destructive for red, but could use custom red
        'bg-red-500 text-white',
        // Padding for count display
        displayCount ? 'px-1.5' : 'px-0',
        // Size
        sizeClasses[size],
        // Animation
        shouldPulse && 'animate-pulse-glow',
        className
      )}
      role="status"
      aria-label={
        count !== undefined
          ? `${count} unread message${count !== 1 ? 's' : ''}`
          : 'New messages'
      }
    >
      {displayCount}
    </span>
  )
}
