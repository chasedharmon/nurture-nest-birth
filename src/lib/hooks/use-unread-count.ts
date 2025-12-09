'use client'

/**
 * useUnreadCount Hook
 *
 * Subscribes to real-time changes in conversation_participants to track
 * unread message counts without page refresh.
 *
 * Features:
 * - Real-time updates when unread counts change
 * - Supports both admin users and client portal
 * - Aggregates unread counts across all conversations
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseUnreadCountOptions {
  /** User ID for admin users */
  userId?: string
  /** Client ID for client portal users */
  clientId?: string
  /** Initial count from server */
  initialCount?: number
}

interface UseUnreadCountReturn {
  /** Total unread message count across all conversations */
  unreadCount: number
  /** Whether the count is currently loading */
  isLoading: boolean
  /** Refresh the count manually */
  refresh: () => Promise<void>
}

export function useUnreadCount({
  userId,
  clientId,
  initialCount = 0,
}: UseUnreadCountOptions): UseUnreadCountReturn {
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch the current unread count
  const fetchUnreadCount = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      if (userId) {
        // For admin users - use the existing RPC function
        const { data, error } = await supabase.rpc('get_user_unread_count', {
          p_user_id: userId,
        })

        if (error) {
          console.error('Error fetching unread count:', error)
          return
        }

        setUnreadCount(data || 0)
      } else if (clientId) {
        // For client portal users - aggregate from conversation_participants
        const { data, error } = await supabase
          .from('conversation_participants')
          .select('unread_count')
          .eq('client_id', clientId)

        if (error) {
          console.error('Error fetching client unread count:', error)
          return
        }

        const total =
          data?.reduce((sum, p) => sum + (p.unread_count || 0), 0) || 0
        setUnreadCount(total)
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId, clientId])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId && !clientId) {
      return
    }

    const supabase = createClient()

    // Initial fetch
    fetchUnreadCount()

    // Subscribe to conversation_participants changes
    const channelName = userId
      ? `unread:user:${userId}`
      : `unread:client:${clientId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          ...(userId
            ? { filter: `user_id=eq.${userId}` }
            : { filter: `client_id=eq.${clientId}` }),
        },
        () => {
          // Refetch count on any participant update
          // This handles both marking as read (count decreases) and new messages (count increases)
          fetchUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          ...(userId
            ? { filter: `user_id=eq.${userId}` }
            : { filter: `client_id=eq.${clientId}` }),
        },
        () => {
          // New participant record (new conversation) - refetch
          fetchUnreadCount()
        }
      )
      .subscribe()

    // Also subscribe to messages table for new messages
    // This ensures we catch new messages even before participant is updated
    const messagesChannel = supabase
      .channel(`${channelName}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        payload => {
          // Only update if the message is not from us
          const newMessage = payload.new as {
            sender_user_id?: string
            sender_client_id?: string
          }
          if (userId && newMessage.sender_user_id !== userId) {
            fetchUnreadCount()
          } else if (clientId && newMessage.sender_client_id !== clientId) {
            fetchUnreadCount()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(messagesChannel)
    }
  }, [userId, clientId, fetchUnreadCount])

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount,
  }
}

/**
 * Simple hook that just returns the unread count as a number
 * Useful for simpler use cases where you just need the count
 */
export function useSimpleUnreadCount(
  userId?: string,
  clientId?: string,
  initialCount?: number
): number {
  const { unreadCount } = useUnreadCount({ userId, clientId, initialCount })
  return unreadCount
}
