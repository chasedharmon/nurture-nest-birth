'use client'

/**
 * useReadReceipts Hook
 *
 * Tracks read status of messages using conversation_participants.last_read_at
 * Provides visual feedback (checkmarks) for message delivery/read status.
 *
 * Features:
 * - Real-time updates when participants read messages
 * - Single check (sent) vs double check (read) indicators
 * - "Seen by [Name]" text at bottom of conversation
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/app/actions/messaging'

interface Participant {
  id: string
  user_id: string | null
  client_id: string | null
  display_name: string
  last_read_at: string | null
}

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

interface SeenByInfo {
  name: string
  readAt: Date
}

interface UseReadReceiptsOptions {
  conversationId: string
  currentUserId: string
  isClient?: boolean
  participants: Participant[]
}

interface UseReadReceiptsReturn {
  /** Get the read status of a specific message */
  getMessageStatus: (message: Message, isPending?: boolean) => MessageStatus
  /** List of participants who have read the latest messages */
  seenBy: SeenByInfo[]
  /** Get participants who have read a specific message */
  getSeenBy: (message: Message) => SeenByInfo[]
  /** Mark the conversation as read */
  markAsRead: () => Promise<void>
}

export function useReadReceipts({
  conversationId,
  currentUserId,
  isClient = false,
  participants: initialParticipants,
}: UseReadReceiptsOptions): UseReadReceiptsReturn {
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants)

  // Subscribe to participant updates (specifically last_read_at changes)
  useEffect(() => {
    const supabase = createClient()
    const channelName = `read-receipts:${conversationId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const updated = payload.new as Participant

          setParticipants(prev =>
            prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Get the read status of a message
  const getMessageStatus = useCallback(
    (message: Message, isPending = false): MessageStatus => {
      // If the message is pending, it's still sending
      if (isPending) {
        return 'sending'
      }

      // Only track status for messages sent by current user
      const isOwnMessage = isClient
        ? message.sender_client_id === currentUserId
        : message.sender_user_id === currentUserId

      if (!isOwnMessage) {
        // For other people's messages, always show as 'sent'
        return 'sent'
      }

      const messageTime = new Date(message.created_at)

      // Check if any other participant has read this message
      const otherParticipants = participants.filter(p => {
        if (isClient) {
          return p.client_id !== currentUserId
        }
        return p.user_id !== currentUserId
      })

      // If any other participant has last_read_at after this message was sent
      const isRead = otherParticipants.some(p => {
        if (!p.last_read_at) return false
        return new Date(p.last_read_at) >= messageTime
      })

      if (isRead) {
        return 'read'
      }

      // Message was sent but not yet read
      return 'sent'
    },
    [participants, currentUserId, isClient]
  )

  // Get who has seen a specific message
  const getSeenBy = useCallback(
    (message: Message): SeenByInfo[] => {
      const messageTime = new Date(message.created_at)

      // Only show seen by for own messages
      const isOwnMessage = isClient
        ? message.sender_client_id === currentUserId
        : message.sender_user_id === currentUserId

      if (!isOwnMessage) {
        return []
      }

      const seenByList: SeenByInfo[] = []

      participants.forEach(p => {
        // Skip self
        if (isClient && p.client_id === currentUserId) return
        if (!isClient && p.user_id === currentUserId) return

        if (p.last_read_at && new Date(p.last_read_at) >= messageTime) {
          seenByList.push({
            name: p.display_name,
            readAt: new Date(p.last_read_at),
          })
        }
      })

      return seenByList
    },
    [participants, currentUserId, isClient]
  )

  // Get the "Seen by" info for the most recent message
  const seenBy = useCallback((): SeenByInfo[] => {
    // Get the most recent last_read_at for each participant (except self)
    const otherParticipants = participants.filter(p => {
      if (isClient) {
        return p.client_id !== currentUserId
      }
      return p.user_id !== currentUserId
    })

    return otherParticipants
      .filter(p => p.last_read_at)
      .map(p => ({
        name: p.display_name,
        readAt: new Date(p.last_read_at!),
      }))
      .sort((a, b) => b.readAt.getTime() - a.readAt.getTime())
  }, [participants, currentUserId, isClient])

  // Mark conversation as read
  const markAsRead = useCallback(async () => {
    const supabase = createClient()

    if (isClient) {
      // For clients, update the client participant record
      const { error } = await supabase
        .from('conversation_participants')
        .update({
          last_read_at: new Date().toISOString(),
          unread_count: 0,
        })
        .eq('conversation_id', conversationId)
        .eq('client_id', currentUserId)

      if (error) {
        console.error('Error marking as read:', error)
      }
    } else {
      // For team members, use the existing RPC or direct update
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
        p_user_id: currentUserId,
      })

      if (error) {
        // Fallback to direct update
        await supabase
          .from('conversation_participants')
          .update({
            last_read_at: new Date().toISOString(),
            unread_count: 0,
          })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId)
      }
    }
  }, [conversationId, currentUserId, isClient])

  return {
    getMessageStatus,
    seenBy: seenBy(),
    getSeenBy,
    markAsRead,
  }
}

/**
 * Format the "Seen by" text for display
 */
export function formatSeenBy(seenBy: SeenByInfo[]): string | null {
  if (seenBy.length === 0) return null

  const names = seenBy.map(s => s.name.split(' ')[0]) // First names only

  if (names.length === 1) {
    return `Seen by ${names[0]}`
  }

  if (names.length === 2) {
    return `Seen by ${names[0]} and ${names[1]}`
  }

  return `Seen by ${names.length} people`
}
