'use client'

/**
 * ClientConversationHeader Component
 *
 * Client component for conversation header in client portal that displays:
 * - Conversation subject
 * - Online team member count
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import { usePresence } from '@/lib/hooks/use-presence'

interface ClientConversationHeaderProps {
  conversationId: string
  clientId: string
  clientName: string
  subject: string | null
}

export function ClientConversationHeader({
  conversationId,
  clientId,
  clientName,
  subject,
}: ClientConversationHeaderProps) {
  // Track own presence and get team members' presence
  const { onlineCount } = usePresence({
    userId: clientId,
    userName: clientName,
    isClient: true,
    room: `conversation:${conversationId}`,
  })

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-border shrink-0">
      <Link href="/client/messages">
        <Button variant="ghost" size="sm">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Messages
        </Button>
      </Link>
      <div className="flex items-center gap-3">
        <div className="relative rounded-full bg-primary/10 p-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {/* Online dot if team members are online */}
          {onlineCount > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
        <div>
          <h1 className="font-semibold text-foreground">
            {subject || 'Conversation'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {onlineCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {onlineCount === 1
                  ? '1 team member online'
                  : `${onlineCount} team members online`}
              </span>
            ) : (
              'With your Nurture Nest team'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
