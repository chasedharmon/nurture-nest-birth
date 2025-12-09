'use client'

import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import type { Message } from '@/app/actions/messaging'
import { markConversationAsRead } from '@/app/actions/messaging'
import {
  useRealtimeMessages,
  type MessageWithStatus,
} from '@/lib/hooks/use-realtime-messages'
import { useConnectionStatus } from '@/lib/hooks/use-connection-status'
import { useReadReceipts, formatSeenBy } from '@/lib/hooks/use-read-receipts'
import { MessageStatus, SeenBy } from '@/components/ui/message-status'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  user_id: string | null
  client_id: string | null
  display_name: string
  last_read_at: string | null
}

interface MessageThreadProps {
  messages: Message[]
  currentUserId: string
  currentUserName: string
  conversationId: string
  participants?: Participant[]
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

export function MessageThread({
  messages: initialMessages,
  currentUserId,
  currentUserName,
  conversationId,
  participants = [],
}: MessageThreadProps) {
  // Use the realtime messages hook
  const { messages, editMessage, deleteMessage } = useRealtimeMessages({
    conversationId,
    initialMessages,
    currentUserId,
    currentUserName,
  })

  // Connection status for offline indicator
  const { isOnline, isReconnecting } = useConnectionStatus({
    channelName: `messages:${conversationId}`,
  })

  // Read receipts
  const { getMessageStatus, getSeenByForMessage } = useReadReceipts({
    conversationId,
    currentUserId,
    isClient: false,
    participants,
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mark conversation as read after a delay
  // This prevents the race condition where messages are marked read before they're seen
  useEffect(() => {
    const timer = setTimeout(() => {
      markConversationAsRead(conversationId)
    }, 1500) // Wait 1.5 seconds for user to actually see messages

    return () => clearTimeout(timer)
  }, [conversationId])

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return

    const result = await editMessage(messageId, editContent)
    if (result.success) {
      setEditingId(null)
      setEditContent('')
    }
  }

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId)
  }

  const startEditing = (message: MessageWithStatus) => {
    setEditingId(message.id)
    setEditContent(message.content)
  }

  // Retry failed message
  const handleRetry = async (message: MessageWithStatus) => {
    if (message.status === 'failed' && message.tempId) {
      // Remove the failed message and resend
      // The hook will handle the retry via the composer
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

  // Find the last own message for "Seen by" display
  const lastOwnMessage = [...messages]
    .reverse()
    .find(m => m.sender_user_id === currentUserId)

  // Get who has seen the last message (only show if they read AFTER the message was sent)
  const seenBy = lastOwnMessage
    ? getSeenByForMessage(new Date(lastOwnMessage.created_at))
    : []
  const seenByText = formatSeenBy(seenBy)

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
            Send a message to start the conversation
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
            {group.messages.map((message, msgIndex) => {
              const isOwnMessage = message.sender_user_id === currentUserId
              const initials = message.sender_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              const isPending = message.status === 'pending'
              const isFailed = message.status === 'failed'

              // Get read receipt status
              const readStatus = getMessageStatus(message, isPending)

              // Is this the last message in the conversation and from current user?
              const isLastOwnMessage =
                isOwnMessage &&
                lastOwnMessage?.id === message.id &&
                groupIndex === groupedMessages.length - 1 &&
                msgIndex === group.messages.length - 1

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
                          : 'bg-muted'
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
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(new Date(message.created_at))}
                      </span>
                      {message.is_edited && (
                        <span className="text-xs text-muted-foreground italic">
                          (edited)
                        </span>
                      )}
                      {/* Status indicators */}
                      {isFailed && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </div>

                    <div className="group relative">
                      {editingId === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="min-w-[300px]"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(message.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null)
                                setEditContent('')
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
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

                          {/* Read receipt for own messages */}
                          {isOwnMessage && !isFailed && (
                            <div className="flex justify-end mt-0.5">
                              <MessageStatus status={readStatus} />
                            </div>
                          )}

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

                          {/* Actions dropdown for own messages (not pending/failed) */}
                          {isOwnMessage && !isPending && !isFailed && (
                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => startEditing(message)}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(message.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Seen by indicator (only on last own message) */}
                    {isLastOwnMessage && seenByText && (
                      <SeenBy
                        names={seenBy.map(s => s.name)}
                        className="mt-1"
                      />
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
