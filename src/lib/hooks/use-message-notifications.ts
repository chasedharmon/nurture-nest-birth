'use client'

/**
 * useMessageNotifications Hook
 *
 * Global subscription for new message notifications.
 * Shows toast when new messages arrive while not viewing that conversation.
 *
 * Features:
 * - Real-time toast notifications for new messages
 * - Respects muted conversations
 * - Only shows when not viewing the conversation
 * - Auto-dismisses after timeout
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface NotificationMessage {
  id: string
  conversationId: string
  senderName: string
  preview: string
  createdAt: Date
}

interface UseMessageNotificationsOptions {
  userId?: string
  clientId?: string
  /** Maximum number of notifications to show at once */
  maxNotifications?: number
  /** Auto-dismiss timeout in ms (default: 5000) */
  dismissTimeout?: number
  /** Whether notifications are enabled (for muting) */
  enabled?: boolean
}

interface UseMessageNotificationsReturn {
  /** Current pending notifications */
  notifications: NotificationMessage[]
  /** Dismiss a notification by ID */
  dismissNotification: (id: string) => void
  /** Dismiss all notifications */
  dismissAll: () => void
  /** Number of pending notifications */
  count: number
}

export function useMessageNotifications({
  userId,
  clientId,
  maxNotifications = 3,
  dismissTimeout = 5000,
  enabled = true,
}: UseMessageNotificationsOptions): UseMessageNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const pathname = usePathname()

  // Determine if we're currently viewing a specific conversation
  const currentConversationId = pathname?.match(
    /\/messages\/([a-f0-9-]+)/i
  )?.[1]

  // Dismiss a specific notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  // Dismiss all notifications
  const dismissAll = useCallback(() => {
    setNotifications([])
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current.clear()
  }, [])

  // Add a new notification
  const addNotification = useCallback(
    (notification: NotificationMessage) => {
      // Don't show if viewing that conversation
      if (notification.conversationId === currentConversationId) {
        return
      }

      setNotifications(prev => {
        // Remove oldest if at max
        const updated = [...prev]
        while (updated.length >= maxNotifications) {
          const removed = updated.shift()
          if (removed) {
            const timeout = timeoutsRef.current.get(removed.id)
            if (timeout) {
              clearTimeout(timeout)
              timeoutsRef.current.delete(removed.id)
            }
          }
        }
        return [...updated, notification]
      })

      // Set auto-dismiss timeout
      const timeout = setTimeout(() => {
        dismissNotification(notification.id)
      }, dismissTimeout)
      timeoutsRef.current.set(notification.id, timeout)
    },
    [
      currentConversationId,
      maxNotifications,
      dismissTimeout,
      dismissNotification,
    ]
  )

  // Subscribe to new messages
  useEffect(() => {
    if (!enabled || (!userId && !clientId)) {
      return
    }

    const supabase = createClient()
    const channelName = `notifications:${userId || clientId}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async payload => {
          const message = payload.new as {
            id: string
            conversation_id: string
            sender_user_id: string | null
            sender_client_id: string | null
            sender_name: string
            content: string
            created_at: string
          }

          // Don't notify for own messages
          const isOwnMessage = userId
            ? message.sender_user_id === userId
            : message.sender_client_id === clientId

          if (isOwnMessage) {
            return
          }

          // Check if user is a participant in this conversation
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('id, is_muted')
            .eq('conversation_id', message.conversation_id)
            .eq(userId ? 'user_id' : 'client_id', userId || clientId)
            .single()

          // Don't notify if not a participant or muted
          if (!participant || participant.is_muted) {
            return
          }

          // Create notification
          addNotification({
            id: message.id,
            conversationId: message.conversation_id,
            senderName: message.sender_name,
            preview:
              message.content.length > 50
                ? `${message.content.slice(0, 50)}...`
                : message.content,
            createdAt: new Date(message.created_at),
          })
        }
      )
      .subscribe()

    // Capture current refs for cleanup
    const currentChannel = channelRef.current
    const currentTimeouts = timeoutsRef.current

    return () => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel)
        channelRef.current = null
      }
      // Clear all timeouts
      currentTimeouts.forEach(timeout => clearTimeout(timeout))
      currentTimeouts.clear()
    }
  }, [userId, clientId, enabled, addNotification])

  // Dismiss notifications for the current conversation when navigating to it
  // Using useMemo to filter notifications based on current path
  const filteredNotifications = useMemo(() => {
    if (!currentConversationId) return notifications
    return notifications.filter(n => n.conversationId !== currentConversationId)
  }, [notifications, currentConversationId])

  return {
    notifications: filteredNotifications,
    dismissNotification,
    dismissAll,
    count: filteredNotifications.length,
  }
}
