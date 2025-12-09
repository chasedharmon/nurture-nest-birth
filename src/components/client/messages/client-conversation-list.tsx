'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, MessageSquare } from 'lucide-react'
import { PulsingBadge } from '@/components/ui/pulsing-badge'
import { usePresence } from '@/lib/hooks/use-presence'

interface Conversation {
  id: string
  subject: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count?: number
}

interface ClientConversationListProps {
  conversations: Conversation[]
  clientId: string
  clientName: string
}

export function ClientConversationList({
  conversations,
  clientId,
  clientName,
}: ClientConversationListProps) {
  // Track presence to see if team members are online
  const { onlineCount } = usePresence({
    userId: clientId,
    userName: clientName,
    isClient: true,
    room: 'messaging',
  })

  return (
    <div className="divide-y divide-border">
      {/* Team availability indicator */}
      {onlineCount > 0 && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {onlineCount === 1
              ? '1 team member is available'
              : `${onlineCount} team members are available`}
          </div>
        </div>
      )}
      {conversations.map(conversation => {
        const hasUnread = (conversation.unread_count || 0) > 0

        return (
          <Link
            key={conversation.id}
            href={`/client/messages/${conversation.id}`}
            className={`flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${
              hasUnread ? 'bg-primary/5' : ''
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`rounded-full p-2 ${
                  hasUnread ? 'bg-primary/20' : 'bg-muted'
                }`}
              >
                <MessageSquare
                  className={`h-5 w-5 ${
                    hasUnread ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${hasUnread ? 'text-foreground' : ''}`}
                  >
                    {conversation.subject || 'Conversation'}
                  </span>
                  {hasUnread && (
                    <PulsingBadge count={conversation.unread_count} size="sm" />
                  )}
                </div>
                {conversation.last_message_preview ? (
                  <p
                    className={`text-sm truncate mt-0.5 ${
                      hasUnread
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {conversation.last_message_preview}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5 italic">
                    No messages yet
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {conversation.last_message_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                  })}
                </span>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
