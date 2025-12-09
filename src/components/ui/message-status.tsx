'use client'

/**
 * MessageStatus Component
 *
 * Displays message delivery/read status with checkmark icons.
 * - Single check: Message sent
 * - Double check: Message delivered/read
 * - Spinning: Message sending
 */

import { Check, CheckCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'sending' | 'sent' | 'delivered' | 'read'

interface MessageStatusProps {
  status: Status
  className?: string
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  if (status === 'sending') {
    return (
      <Loader2
        className={cn('h-3 w-3 animate-spin text-muted-foreground', className)}
      />
    )
  }

  if (status === 'sent') {
    return <Check className={cn('h-3 w-3 text-muted-foreground', className)} />
  }

  if (status === 'delivered' || status === 'read') {
    return (
      <CheckCheck
        className={cn(
          'h-3 w-3',
          status === 'read' ? 'text-blue-500' : 'text-muted-foreground',
          className
        )}
      />
    )
  }

  return null
}

/**
 * SeenBy Component
 *
 * Displays "Seen by [Name]" at the bottom of a conversation
 */
interface SeenByProps {
  names: string[]
  className?: string
}

export function SeenBy({ names, className }: SeenByProps) {
  if (names.length === 0) return null

  const firstNames = names.map(n => n.split(' ')[0])

  let text: string
  if (firstNames.length === 1) {
    text = `Seen by ${firstNames[0]}`
  } else if (firstNames.length === 2) {
    text = `Seen by ${firstNames[0]} and ${firstNames[1]}`
  } else {
    text = `Seen by ${firstNames.length} people`
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-1 text-xs text-muted-foreground',
        className
      )}
    >
      <CheckCheck className="h-3 w-3 text-blue-500" />
      <span>{text}</span>
    </div>
  )
}
