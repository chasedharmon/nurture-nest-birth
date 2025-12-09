'use client'

/**
 * useTypingIndicator Hook
 *
 * Provides real-time typing indicators using Supabase Broadcast.
 * Typing status is ephemeral - no database storage required.
 *
 * Features:
 * - Send typing status on keystroke (debounced)
 * - Auto-clear after 3 seconds of inactivity
 * - Receive typing status from other participants
 * - Filter out own typing status from display
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface TypingUser {
  id: string
  name: string
  isClient: boolean
}

interface UseTypingIndicatorOptions {
  conversationId: string
  userId: string
  userName: string
  isClient?: boolean
}

interface UseTypingIndicatorReturn {
  /** List of users currently typing */
  typingUsers: TypingUser[]
  /** Set typing status - call this on input changes */
  setIsTyping: (isTyping: boolean) => void
  /** Send a typing event - debounced internally */
  handleTypingInput: () => void
}

const TYPING_TIMEOUT_MS = 3000 // Auto-clear after 3 seconds
const TYPING_DEBOUNCE_MS = 500 // Debounce typing broadcasts

export function useTypingIndicator({
  conversationId,
  userId,
  userName,
  isClient = false,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  // Refs for timers and channel
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastBroadcastRef = useRef<number>(0)

  // Clear typing status for a specific user after timeout
  const clearTypingForUser = useCallback((userIdToClear: string) => {
    setTypingUsers(prev => prev.filter(u => u.id !== userIdToClear))
  }, [])

  // Send typing broadcast
  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return

      const now = Date.now()

      // Prevent too frequent broadcasts
      if (isTyping && now - lastBroadcastRef.current < TYPING_DEBOUNCE_MS) {
        return
      }

      lastBroadcastRef.current = now

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          userName,
          isClient,
          isTyping,
          timestamp: now,
        },
      })
    },
    [userId, userName, isClient]
  )

  // Set typing status with auto-clear
  const setIsTyping = useCallback(
    (isTyping: boolean) => {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // Broadcast the status
      broadcastTyping(isTyping)

      // If typing, set auto-clear timeout
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          broadcastTyping(false)
        }, TYPING_TIMEOUT_MS)
      }
    },
    [broadcastTyping]
  )

  // Handle input changes with debouncing
  const handleTypingInput = useCallback(() => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Clear the auto-stop typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator
    broadcastTyping(true)

    // Set auto-clear after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false)
    }, TYPING_TIMEOUT_MS)
  }, [broadcastTyping])

  // Subscribe to typing events
  useEffect(() => {
    const supabase = createClient()
    const channelName = `typing:${conversationId}`

    // Track timeouts for each typing user
    const userTimeouts = new Map<string, NodeJS.Timeout>()

    channelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, payload => {
        const {
          userId: typingUserId,
          userName: typingUserName,
          isClient: typingUserIsClient,
          isTyping,
        } = payload.payload as {
          userId: string
          userName: string
          isClient: boolean
          isTyping: boolean
        }

        // Ignore own typing events
        if (typingUserId === userId) {
          return
        }

        // Clear existing timeout for this user
        const existingTimeout = userTimeouts.get(typingUserId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
          userTimeouts.delete(typingUserId)
        }

        if (isTyping) {
          // Add user to typing list
          setTypingUsers(prev => {
            const exists = prev.some(u => u.id === typingUserId)
            if (exists) return prev
            return [
              ...prev,
              {
                id: typingUserId,
                name: typingUserName,
                isClient: typingUserIsClient,
              },
            ]
          })

          // Set timeout to auto-remove (fallback in case stop event is missed)
          const timeout = setTimeout(() => {
            clearTypingForUser(typingUserId)
            userTimeouts.delete(typingUserId)
          }, TYPING_TIMEOUT_MS + 1000) // Add buffer for network latency

          userTimeouts.set(typingUserId, timeout)
        } else {
          // Remove user from typing list
          clearTypingForUser(typingUserId)
        }
      })
      .subscribe()

    return () => {
      // Clean up channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      // Clear all timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      userTimeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [conversationId, userId, clearTypingForUser])

  // Cleanup on unmount - stop typing
  useEffect(() => {
    return () => {
      broadcastTyping(false)
    }
  }, [broadcastTyping])

  return {
    typingUsers,
    setIsTyping,
    handleTypingInput,
  }
}

/**
 * Format typing users for display
 * e.g., "Alice is typing...", "Alice and Bob are typing..."
 */
export function formatTypingUsers(users: TypingUser[]): string | null {
  if (users.length === 0) return null

  const names = users.map(u => u.name.split(' ')[0]) // First names only

  if (names.length === 1) {
    return `${names[0]} is typing...`
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]} are typing...`
  }

  return `${names.length} people are typing...`
}
