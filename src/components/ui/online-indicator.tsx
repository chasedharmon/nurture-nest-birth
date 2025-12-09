'use client'

/**
 * OnlineIndicator Component
 *
 * Displays online/offline status with visual indicators.
 * - Green dot: Currently online
 * - Gray dot: Offline with "Active X ago" text
 * - No indicator: Offline > 15 minutes
 */

import { cn } from '@/lib/utils'

interface OnlineIndicatorProps {
  isOnline: boolean
  lastSeenText?: string | null
  /** Show only the dot, no text */
  dotOnly?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export function OnlineIndicator({
  isOnline,
  lastSeenText,
  dotOnly = false,
  size = 'md',
  className,
}: OnlineIndicatorProps) {
  // If offline and no last seen text, don't show anything
  if (!isOnline && !lastSeenText) {
    return null
  }

  if (dotOnly) {
    return (
      <span
        className={cn(
          'rounded-full shrink-0',
          sizeClasses[size],
          isOnline ? 'bg-green-500' : 'bg-gray-400',
          className
        )}
        aria-label={isOnline ? 'Online' : 'Offline'}
      />
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full shrink-0',
          sizeClasses[size],
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isOnline ? 'Active now' : lastSeenText}
      </span>
    </div>
  )
}

/**
 * OnlineDot Component
 *
 * Simple dot indicator for use in lists/avatars
 */
interface OnlineDotProps {
  isOnline: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OnlineDot({
  isOnline,
  size = 'sm',
  className,
}: OnlineDotProps) {
  if (!isOnline) return null

  return (
    <span
      className={cn(
        'rounded-full bg-green-500 shrink-0',
        sizeClasses[size],
        className
      )}
      aria-label="Online"
    />
  )
}

/**
 * OnlineStatus Component
 *
 * Full status display with avatar position support
 */
interface OnlineStatusProps {
  isOnline: boolean
  lastSeenText?: string | null
  className?: string
}

export function OnlineStatus({
  isOnline,
  lastSeenText,
  className,
}: OnlineStatusProps) {
  if (!isOnline && !lastSeenText) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'h-2 w-2 rounded-full shrink-0',
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isOnline ? 'Active now' : lastSeenText}
      </span>
    </div>
  )
}
