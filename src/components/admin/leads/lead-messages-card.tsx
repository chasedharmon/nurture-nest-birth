'use client'

/**
 * LeadMessagesCard Component
 *
 * Displays recent messages with a client on their lead detail page.
 * Part of the unified client view (Salesforce-style 360 view).
 */

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, ExternalLink, ChevronRight, Plus } from 'lucide-react'
import type { Message, ConversationWithDetails } from '@/app/actions/messaging'

interface LeadMessagesCardProps {
  clientId: string
  clientName: string
  conversation: ConversationWithDetails | null
  recentMessages: Message[]
  onStartConversation?: () => void
}

export function LeadMessagesCard({
  clientId,
  clientName,
  conversation,
  recentMessages,
  onStartConversation,
}: LeadMessagesCardProps) {
  const hasConversation = conversation !== null
  const unreadCount = conversation?.unread_count || 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-1">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
        {hasConversation ? (
          <Link href={`/admin/messages/${conversation.id}`}>
            <Button variant="ghost" size="sm">
              View All
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="sm" onClick={onStartConversation}>
            <Plus className="mr-1 h-3 w-3" />
            New Message
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {!hasConversation ? (
          <div className="text-center py-8">
            <div className="rounded-full bg-muted w-12 h-12 mx-auto flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              No conversations yet with {clientName}
            </p>
            <Button size="sm" onClick={onStartConversation}>
              <Plus className="mr-1 h-4 w-4" />
              Start Conversation
            </Button>
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No messages in this conversation yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMessages.slice(0, 5).map(message => {
              const isFromClient = message.sender_client_id === clientId
              const initials = message.sender_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={message.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={
                        isFromClient
                          ? 'bg-muted'
                          : 'bg-primary text-primary-foreground'
                      }
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">
                        {isFromClient ? clientName : message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                  </div>
                </div>
              )
            })}

            {recentMessages.length > 5 && (
              <Link
                href={`/admin/messages/${conversation.id}`}
                className="block text-center"
              >
                <Button variant="link" size="sm" className="gap-1">
                  View all messages
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
