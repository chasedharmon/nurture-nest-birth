'use client'

/**
 * TypingIndicator Component
 *
 * Displays animated typing indicator with user names.
 * Shows bouncing dots animation.
 */

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  /** Text to display (e.g., "Alice is typing...") */
  text: string
  /** Additional CSS classes */
  className?: string
}

export function TypingIndicator({ text, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground px-4 py-2',
        className
      )}
    >
      <TypingDots />
      <span>{text}</span>
    </div>
  )
}

/**
 * Animated bouncing dots
 */
export function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '600ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '600ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '600ms' }}
      />
    </div>
  )
}

/**
 * Compact typing indicator for inline use
 */
export function TypingIndicatorInline({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-0.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '600ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '600ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '600ms' }}
        />
      </div>
      <span>{text}</span>
    </div>
  )
}
