'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePresence } from '@/lib/hooks/use-presence'
import { getClientConversations } from '@/app/actions/messaging'
import { ChatWidgetNewMessage } from './chat-widget-new-message'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  subject: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
}

interface ChatWidgetConversationListProps {
  /** Client ID for fetching conversations */
  clientId: string
  /** Client name for presence tracking */
  clientName: string
  /** Handler when a conversation is selected */
  onSelectConversation: (conversationId: string, subject: string | null) => void
}

/**
 * ChatWidgetConversationList - Compact conversation list for the widget
 *
 * Features:
 * - Team availability indicator
 * - New message button
 * - Scrollable conversation list
 * - Unread badges per conversation
 */
export function ChatWidgetConversationList({
  clientId,
  clientName,
  onSelectConversation,
}: ChatWidgetConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)

  // Track team presence
  const { onlineCount } = usePresence({
    userId: clientId,
    userName: clientName,
    isClient: true,
    room: 'messaging',
  })

  // Fetch conversations on mount and when widget opens
  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true)
      setError(null)

      const result = await getClientConversations(clientId)

      if (result.success && result.conversations) {
        setConversations(result.conversations)
      } else {
        setError(result.error || 'Failed to load conversations')
      }

      setIsLoading(false)
    }

    fetchConversations()
  }, [clientId])

  // Handle new conversation created
  const handleConversationCreated = (
    conversationId: string,
    subject: string | null
  ) => {
    setShowNewMessage(false)
    onSelectConversation(conversationId, subject)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Team availability indicator */}
      {onlineCount > 0 && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {onlineCount === 1
              ? '1 team member available'
              : `${onlineCount} team members available`}
          </div>
        </div>
      )}

      {/* New message button */}
      <div className="p-3 border-b border-border">
        <Button className="w-full" onClick={() => setShowNewMessage(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">
              Start a conversation
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We&apos;re here to support you throughout your journey.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map(conversation => {
              const hasUnread = conversation.unread_count > 0

              return (
                <button
                  key={conversation.id}
                  onClick={() =>
                    onSelectConversation(conversation.id, conversation.subject)
                  }
                  className={cn(
                    'w-full flex items-start gap-3 p-3 text-left hover:bg-accent/50 transition-colors',
                    hasUnread && 'bg-primary/5'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-full p-2 shrink-0',
                      hasUnread ? 'bg-primary/20' : 'bg-muted'
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        'h-4 w-4',
                        hasUnread ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm truncate',
                          hasUnread && 'font-semibold'
                        )}
                      >
                        {conversation.subject || 'Conversation'}
                      </span>
                      {hasUnread && (
                        <Badge
                          variant="default"
                          className="h-5 text-[10px] shrink-0"
                        >
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conversation.last_message_preview ? (
                      <p
                        className={cn(
                          'text-xs truncate mt-0.5',
                          hasUnread
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {conversation.last_message_preview}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        No messages yet
                      </p>
                    )}
                    {conversation.last_message_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(
                          new Date(conversation.last_message_at),
                          { addSuffix: true }
                        )}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* New message dialog */}
      {showNewMessage && (
        <ChatWidgetNewMessage
          clientId={clientId}
          clientName={clientName}
          onClose={() => setShowNewMessage(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </>
  )
}
