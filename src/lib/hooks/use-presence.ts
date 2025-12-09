'use client'

/**
 * usePresence Hook
 *
 * Tracks online presence using Supabase Presence.
 * Shows who is currently online/active in the messaging system.
 *
 * Features:
 * - Real-time online status updates
 * - "Active now" / "Active X ago" display
 * - Automatic heartbeat and disconnect handling
 * - Works across all conversations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'

interface PresenceUser {
  id: string
  name: string
  isClient: boolean
  lastSeen: Date
  online: boolean
}

interface UsePresenceOptions {
  userId: string
  userName: string
  isClient?: boolean
  /** Room to join - defaults to 'messaging' for global presence */
  room?: string
}

interface UsePresenceReturn {
  /** Map of user IDs to presence info */
  onlineUsers: Map<string, PresenceUser>
  /** Check if a specific user is online */
  isUserOnline: (userId: string) => boolean
  /** Get formatted last seen text for a user */
  getLastSeen: (userId: string) => string | null
  /** Total count of online users */
  onlineCount: number
}

// Threshold for considering a user "active" (15 minutes)
const ACTIVE_THRESHOLD_MS = 15 * 60 * 1000

export function usePresence({
  userId,
  userName,
  isClient = false,
  room = 'messaging',
}: UsePresenceOptions): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(
    new Map()
  )
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Track own presence and sync with others
  useEffect(() => {
    const supabase = createClient()
    const channelName = `presence:${room}`

    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    // Handle presence sync (initial state)
    channelRef.current.on('presence', { event: 'sync' }, () => {
      const state = channelRef.current?.presenceState()
      if (!state) return

      const newOnlineUsers = new Map<string, PresenceUser>()

      Object.entries(state).forEach(([key, presences]) => {
        // Get the most recent presence for this user
        const rawPresence = presences[presences.length - 1]
        const presence = rawPresence as unknown as
          | {
              id: string
              name: string
              isClient: boolean
              online_at: string
            }
          | undefined

        if (presence && key !== userId) {
          newOnlineUsers.set(key, {
            id: key,
            name: presence.name,
            isClient: presence.isClient,
            lastSeen: new Date(presence.online_at),
            online: true,
          })
        }
      })

      setOnlineUsers(newOnlineUsers)
    })

    // Handle user joining
    channelRef.current.on(
      'presence',
      { event: 'join' },
      ({ key, newPresences }) => {
        if (key === userId) return

        const rawPresence = newPresences[0]
        const presence = rawPresence as unknown as
          | {
              id: string
              name: string
              isClient: boolean
              online_at: string
            }
          | undefined

        if (presence) {
          setOnlineUsers(prev => {
            const newMap = new Map(prev)
            newMap.set(key, {
              id: key,
              name: presence.name,
              isClient: presence.isClient,
              lastSeen: new Date(presence.online_at),
              online: true,
            })
            return newMap
          })
        }
      }
    )

    // Handle user leaving
    channelRef.current.on(
      'presence',
      { event: 'leave' },
      ({ key, leftPresences }) => {
        if (key === userId) return

        const rawPresence = leftPresences[0]
        const presence = rawPresence as unknown as
          | {
              online_at?: string
            }
          | undefined

        setOnlineUsers(prev => {
          const newMap = new Map(prev)
          const existing = prev.get(key)
          if (existing) {
            // Mark as offline but keep for "last seen" display
            newMap.set(key, {
              ...existing,
              lastSeen: presence?.online_at
                ? new Date(presence.online_at)
                : new Date(),
              online: false,
            })
          }
          return newMap
        })
      }
    )

    // Subscribe and track own presence
    channelRef.current.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channelRef.current?.track({
          id: userId,
          name: userName,
          isClient,
          online_at: new Date().toISOString(),
        })
      }
    })

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, userName, isClient, room])

  // Check if a user is online
  const isUserOnline = useCallback(
    (checkUserId: string): boolean => {
      const user = onlineUsers.get(checkUserId)
      if (!user) return false

      // Consider online if marked as online and last seen within threshold
      if (user.online) return true

      const timeSinceLastSeen = Date.now() - user.lastSeen.getTime()
      return timeSinceLastSeen < ACTIVE_THRESHOLD_MS
    },
    [onlineUsers]
  )

  // Get formatted last seen text
  const getLastSeen = useCallback(
    (checkUserId: string): string | null => {
      const user = onlineUsers.get(checkUserId)
      if (!user) return null

      if (user.online) {
        return 'Active now'
      }

      const timeSinceLastSeen = Date.now() - user.lastSeen.getTime()

      // If within active threshold, show "Active X ago"
      if (timeSinceLastSeen < ACTIVE_THRESHOLD_MS) {
        return `Active ${formatDistanceToNow(user.lastSeen, { addSuffix: false })} ago`
      }

      // Otherwise don't show anything (too long ago)
      return null
    },
    [onlineUsers]
  )

  // Count online users
  const onlineCount = Array.from(onlineUsers.values()).filter(
    u => u.online
  ).length

  return {
    onlineUsers,
    isUserOnline,
    getLastSeen,
    onlineCount,
  }
}

/**
 * Simplified hook that just tracks presence without returning methods
 * Useful for layouts that just need to register presence
 */
export function usePresenceTracker(
  userId: string,
  userName: string,
  isClient = false
): void {
  usePresence({ userId, userName, isClient })
}
