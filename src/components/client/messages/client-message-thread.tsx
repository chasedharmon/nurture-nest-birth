'use client'

import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/app/actions/messaging'

interface ClientMessageThreadProps {
  messages: Message[]
  clientId: string
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
  conversationId,
}: ClientMessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
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
      .channel(`client-messages:${conversationId}`)
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

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

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
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
                    className={`flex flex-col max-w-[70%] ${
                      isOwnMessage ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {isOwnMessage ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(new Date(message.created_at))}
                      </span>
                    </div>

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
