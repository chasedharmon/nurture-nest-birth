'use client'

import { useState, useEffect, useRef } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getMessages } from '@/app/actions/messaging'
import {
  useRealtimeMessages,
  type MessageWithStatus,
} from '@/lib/hooks/use-realtime-messages'
import {
  useTypingIndicator,
  formatTypingUsers,
} from '@/lib/hooks/use-typing-indicator'
import { TypingIndicatorInline } from '@/components/ui/typing-indicator'
import { ChatWidgetComposer } from './chat-widget-composer'
import { cn } from '@/lib/utils'
import type { Message } from '@/app/actions/messaging'

interface ChatWidgetThreadProps {
  /** Conversation ID to display */
  conversationId: string
  /** Client ID for message attribution */
  clientId: string
  /** Client name for display */
  clientName: string
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) {
    return 'Today'
  }
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  return format(date, 'MMM d')
}

function formatMessageTime(date: Date): string {
  return format(date, 'h:mm a')
}

/**
 * ChatWidgetThread - Compact message thread for the widget
 *
 * Features:
 * - Fetches messages on mount
 * - Real-time updates via useRealtimeMessages
 * - Typing indicators
 * - Auto-scroll to newest messages
 * - Compact styling for widget context
 */
export function ChatWidgetThread({
  conversationId,
  clientId,
  clientName,
}: ChatWidgetThreadProps) {
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true)
      setError(null)

      const result = await getMessages(conversationId, { limit: 50 })

      if (result.success && result.messages) {
        setInitialMessages(result.messages)
      } else {
        setError(result.error || 'Failed to load messages')
      }

      setIsLoading(false)
      setIsInitialized(true)
    }

    fetchMessages()
  }, [conversationId])

  // Only render the real-time component after initial messages are loaded
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
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
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

  if (!isInitialized) {
    return null
  }

  return (
    <ChatWidgetThreadContent
      conversationId={conversationId}
      clientId={clientId}
      clientName={clientName}
      initialMessages={initialMessages}
      scrollRef={scrollRef}
      bottomRef={bottomRef}
    />
  )
}

interface ChatWidgetThreadContentProps {
  conversationId: string
  clientId: string
  clientName: string
  initialMessages: Message[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  bottomRef: React.RefObject<HTMLDivElement | null>
}

function ChatWidgetThreadContent({
  conversationId,
  clientId,
  clientName,
  initialMessages,
  scrollRef,
  bottomRef,
}: ChatWidgetThreadContentProps) {
  // Use the realtime messages hook in client mode
  const { messages, sendMessage, deleteMessage, isSending } =
    useRealtimeMessages({
      conversationId,
      initialMessages,
      currentUserId: clientId,
      currentUserName: clientName,
      isClient: true,
      clientId,
    })

  // Typing indicator
  const { typingUsers, handleTypingInput, setIsTyping } = useTypingIndicator({
    conversationId,
    userId: clientId,
    userName: clientName,
    isClient: true,
  })

  const typingText = formatTypingUsers(typingUsers)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, bottomRef])

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

  // Retry failed message
  const handleRetry = async (message: MessageWithStatus) => {
    if (message.status === 'failed' && message.tempId) {
      await deleteMessage(message.id)
      // Re-send the message
      await sendMessage(message.content)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-4">
        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-3">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <div className="bg-muted px-2 py-0.5 rounded-full">
                  <span className="text-[10px] text-muted-foreground">
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
                      'flex gap-2',
                      isOwnMessage && 'flex-row-reverse',
                      isPending && 'opacity-70'
                    )}
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback
                        className={cn(
                          'text-[10px]',
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        'flex flex-col max-w-[75%]',
                        isOwnMessage ? 'items-end' : 'items-start'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-medium">
                          {isOwnMessage
                            ? 'You'
                            : message.sender_name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatMessageTime(new Date(message.created_at))}
                        </span>
                        {isPending && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                        )}
                        {isFailed && (
                          <AlertCircle className="h-2.5 w-2.5 text-destructive" />
                        )}
                      </div>

                      <div
                        className={cn(
                          'rounded-xl px-3 py-1.5',
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm',
                          isFailed &&
                            'bg-destructive/10 border border-destructive/20'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      {/* Retry button for failed messages */}
                      {isFailed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-0.5 h-6 text-xs text-destructive hover:text-destructive px-2"
                          onClick={() => handleRetry(message)}
                        >
                          <RefreshCw className="h-2.5 w-2.5 mr-1" />
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

      {/* Typing indicator */}
      {typingText && (
        <div className="px-3 py-1">
          <TypingIndicatorInline text={typingText} />
        </div>
      )}

      {/* Composer */}
      <ChatWidgetComposer
        conversationId={conversationId}
        clientId={clientId}
        clientName={clientName}
        onSend={sendMessage}
        onTyping={handleTypingInput}
        onTypingStop={() => setIsTyping(false)}
        isSending={isSending}
      />
    </div>
  )
}
