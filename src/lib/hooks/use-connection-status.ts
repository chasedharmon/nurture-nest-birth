'use client'

/**
 * useConnectionStatus Hook
 *
 * Monitors network connectivity and Supabase Realtime connection status.
 * Provides UI feedback for offline/reconnecting states.
 *
 * Features:
 * - Browser online/offline detection
 * - Supabase channel connection monitoring
 * - Reconnection state tracking
 * - Last connected timestamp
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseConnectionStatusOptions {
  /** Channel name to monitor (optional - creates a test channel if not provided) */
  channelName?: string
  /** Callback when connection is restored */
  onReconnect?: () => void
  /** Callback when connection is lost */
  onDisconnect?: () => void
}

interface UseConnectionStatusReturn {
  /** Whether the browser reports being online */
  isOnline: boolean
  /** Whether the Supabase Realtime channel is connected */
  isConnected: boolean
  /** Whether currently attempting to reconnect */
  isReconnecting: boolean
  /** Timestamp of last successful connection */
  lastConnected: Date | null
  /** Human-readable connection status */
  statusText: string
}

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'

export function useConnectionStatus(
  options: UseConnectionStatusOptions = {}
): UseConnectionStatusReturn {
  const { channelName, onReconnect, onDisconnect } = options

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastConnected, setLastConnected] = useState<Date | null>(null)

  // Track previous connection state for callbacks
  const [wasConnected, setWasConnected] = useState(false)

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsReconnecting(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsConnected(false)
      setIsReconnecting(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Monitor Supabase Realtime connection
  useEffect(() => {
    if (!isOnline) {
      return
    }

    const supabase = createClient()
    const testChannelName = channelName || `connection-test-${Date.now()}`

    let channel: RealtimeChannel | null = null

    const setupChannel = () => {
      channel = supabase.channel(testChannelName)

      channel
        .on('system', { event: '*' }, payload => {
          // Handle system events for connection status
          console.debug('Realtime system event:', payload)
        })
        .subscribe((status: ChannelStatus) => {
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true)
              setIsReconnecting(false)
              setLastConnected(new Date())

              // Fire reconnect callback if we were disconnected
              if (!wasConnected && onReconnect) {
                onReconnect()
              }
              setWasConnected(true)
              break

            case 'TIMED_OUT':
            case 'CLOSED':
            case 'CHANNEL_ERROR':
              setIsConnected(false)
              setIsReconnecting(true)

              // Fire disconnect callback if we were connected
              if (wasConnected && onDisconnect) {
                onDisconnect()
              }
              setWasConnected(false)
              break
          }
        })
    }

    setupChannel()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [isOnline, channelName, onReconnect, onDisconnect, wasConnected])

  // Derive status text
  const getStatusText = useCallback((): string => {
    if (!isOnline) {
      return 'Offline'
    }
    if (isReconnecting) {
      return 'Reconnecting...'
    }
    if (isConnected) {
      return 'Connected'
    }
    return 'Connecting...'
  }, [isOnline, isConnected, isReconnecting])

  return {
    isOnline,
    isConnected,
    isReconnecting,
    lastConnected,
    statusText: getStatusText(),
  }
}

/**
 * Simplified hook that just returns whether we're connected
 * Useful for conditional rendering
 */
export function useIsConnected(): boolean {
  const { isOnline, isConnected } = useConnectionStatus()
  return isOnline && isConnected
}
