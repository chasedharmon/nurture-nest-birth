'use client'

import { useEffect, useRef } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Message } from '@/app/actions/messaging'
import {
  useRealtimeMessages,
  type MessageWithStatus,
} from '@/lib/hooks/use-realtime-messages'
import { useConnectionStatus } from '@/lib/hooks/use-connection-status'
import { cn } from '@/lib/utils'

interface ClientMessageThreadProps {
  messages: Message[]
  clientId: string
  clientName: string
  conversationId: string
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) {
    return 'Today'
  }
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  return format(date, 'MMMM d, yyyy')
}

function formatMessageTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function ClientMessageThread({
  messages: initialMessages,
  clientId,
  clientName,
  conversationId,
}: ClientMessageThreadProps) {
  // Use the realtime messages hook in client mode
  const { messages, deleteMessage } = useRealtimeMessages({
    conversationId,
    initialMessages,
    currentUserId: clientId, // For clients, use clientId as the identifier
    currentUserName: clientName,
    isClient: true,
    clientId,
  })

  // Connection status for offline indicator
  const { isOnline, isReconnecting } = useConnectionStatus({
    channelName: `client-messages:${conversationId}`,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Retry failed message
  const handleRetry = async (message: MessageWithStatus) => {
    if (message.status === 'failed' && message.tempId) {
      // Remove the failed message
      await deleteMessage(message.id)
    }
  }

  // Group messages by date
  const groupedMessages: { date: Date; messages: MessageWithStatus[] }[] = []
  let currentGroup: { date: Date; messages: MessageWithStatus[] } | null = null

  messages.forEach(message => {
    const messageDate = new Date(message.created_at)
    if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
      currentGroup = { date: messageDate, messages: [] }
      groupedMessages.push(currentGroup)
    }
    currentGroup.messages.push(message)
  })

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-6">
      {/* Connection status banner */}
      {(!isOnline || isReconnecting) && (
        <div className="sticky top-0 z-10 mx-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2 flex items-center gap-2">
            {isReconnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  Reconnecting...
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  You&apos;re offline. Messages will send when you reconnect.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {groupedMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your doula team will message you here
          </p>
        </div>
      ) : (
        groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <div className="bg-muted px-3 py-1 rounded-full">
                <span className="text-xs text-muted-foreground">
                  {formatMessageDate(group.date)}
                </span>
              </div>
            </div>

            {/* Messages */}
            {group.messages.map(message => {
              const isOwnMessage = message.sender_client_id === clientId
              const initials = message.sender_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              const isPending = message.status === 'pending'
              const isFailed = message.status === 'failed'

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage && 'flex-row-reverse',
                    isPending && 'opacity-70'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'flex flex-col max-w-[70%]',
                      isOwnMessage ? 'items-end' : 'items-start'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {isOwnMessage ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(new Date(message.created_at))}
                      </span>
                      {/* Status indicators */}
                      {isPending && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      {isFailed && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md',
                        isFailed &&
                          'bg-destructive/10 border border-destructive/20'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {/* Retry button for failed messages */}
                    {isFailed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-destructive hover:text-destructive"
                        onClick={() => handleRetry(message)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
