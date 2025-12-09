'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, MessageSquare } from 'lucide-react'

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
}

export function ClientConversationList({
  conversations,
}: ClientConversationListProps) {
  return (
    <div className="divide-y divide-border">
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
                    <Badge variant="default" className="h-5 text-xs">
                      {conversation.unread_count} new
                    </Badge>
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
