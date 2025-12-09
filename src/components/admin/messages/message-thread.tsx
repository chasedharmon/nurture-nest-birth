'use client'

import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { editMessage, deleteMessage } from '@/app/actions/messaging'
import type { Message } from '@/app/actions/messaging'

interface MessageThreadProps {
  messages: Message[]
  currentUserId: string
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

export function MessageThread({
  messages: initialMessages,
  currentUserId,
  conversationId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const updatedMessage = payload.new as Message
          setMessages(prev =>
            prev.map(m => (m.id === updatedMessage.id ? updatedMessage : m))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return

    const result = await editMessage(messageId, editContent)
    if (result.success) {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, content: editContent, is_edited: true }
            : m
        )
      )
      setEditingId(null)
      setEditContent('')
    }
  }

  const handleDelete = async (messageId: string) => {
    const result = await deleteMessage(messageId)
    if (result.success) {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }
  }

  const startEditing = (message: Message) => {
    setEditingId(message.id)
    setEditContent(message.content)
  }

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = []
  let currentGroup: { date: Date; messages: Message[] } | null = null

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
            {group.messages.map(message => {
              const isOwnMessage = message.sender_user_id === currentUserId
              const initials = message.sender_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isOwnMessage ? 'flex-row-reverse' : ''
                  }`}
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
                    className={`flex flex-col max-w-[70%] ${
                      isOwnMessage ? 'items-end' : 'items-start'
                    }`}
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
                            className={`rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>

                          {/* Actions dropdown for own messages */}
                          {isOwnMessage && (
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
