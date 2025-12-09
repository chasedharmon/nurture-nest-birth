'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { OnlineDot } from '@/components/ui/online-indicator'
import { usePresence } from '@/lib/hooks/use-presence'
import type { ConversationWithDetails } from '@/app/actions/messaging'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  currentUserId: string
  currentUserName: string
}

export function ConversationList({
  conversations,
  currentUserId,
  currentUserName,
}: ConversationListProps) {
  // Track presence in a global messaging room to see all online clients
  const { isUserOnline } = usePresence({
    userId: currentUserId,
    userName: currentUserName,
    isClient: false,
    room: 'messaging', // Global room for presence across all conversations
  })

  return (
    <div className="space-y-2">
      {conversations.map(conversation => {
        const hasUnread = (conversation.unread_count || 0) > 0
        const clientName = conversation.client?.name || 'Unknown Client'
        const clientId = conversation.client?.id
        const initials = clientName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        // Check if the client is online
        const clientIsOnline = clientId ? isUserOnline(clientId) : false

        return (
          <Link
            key={conversation.id}
            href={`/admin/messages/${conversation.id}`}
          >
            <Card
              className={`hover:bg-accent/50 transition-colors cursor-pointer ${
                hasUnread ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className={
                          hasUnread
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online dot */}
                    {clientIsOnline && (
                      <OnlineDot
                        isOnline={true}
                        size="md"
                        className="absolute -bottom-0.5 -right-0.5 border-2 border-background"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium truncate ${
                            hasUnread ? 'text-foreground' : ''
                          }`}
                        >
                          {clientName}
                        </span>
                        {hasUnread && (
                          <Badge variant="default" className="h-5 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(
                            new Date(conversation.last_message_at),
                            { addSuffix: true }
                          )}
                        </span>
                      )}
                    </div>

                    {conversation.last_message_preview ? (
                      <p
                        className={`text-sm mt-1 truncate ${
                          hasUnread
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {conversation.last_message_preview}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        No messages yet
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {conversation.client?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
