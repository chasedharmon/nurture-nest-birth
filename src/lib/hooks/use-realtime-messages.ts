'use client'

/**
 * useRealtimeMessages Hook
 *
 * Provides real-time message subscription with optimistic updates.
 * Handles INSERT, UPDATE, and DELETE events from Supabase Realtime.
 *
 * Features:
 * - Optimistic message insertion with pending state
 * - Automatic rollback on send failure
 * - Real-time updates from other participants
 * - Edit and delete support
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/app/actions/messaging'

// Extended message type with status for optimistic updates
export interface MessageWithStatus extends Message {
  status: 'pending' | 'sent' | 'failed'
  tempId?: string // Temporary ID for optimistic messages
}

interface UseRealtimeMessagesOptions {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
  currentUserName: string
  isClient?: boolean // Whether this is a client (vs team member)
  clientId?: string // Client ID if isClient is true
}

interface UseRealtimeMessagesReturn {
  messages: MessageWithStatus[]
  sendMessage: (
    content: string
  ) => Promise<{ success: boolean; error?: string }>
  editMessage: (
    id: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>
  deleteMessage: (id: string) => Promise<{ success: boolean; error?: string }>
  isSending: boolean
  error: string | null
}

export function useRealtimeMessages({
  conversationId,
  initialMessages,
  currentUserId,
  currentUserName,
  isClient = false,
  clientId,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn {
  // Convert initial messages to have status
  const [messages, setMessages] = useState<MessageWithStatus[]>(() =>
    initialMessages.map(m => ({ ...m, status: 'sent' as const }))
  )
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track pending messages for rollback
  const pendingMessagesRef = useRef<Map<string, string>>(new Map())

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()
    const channelName = isClient
      ? `client-messages:${conversationId}`
      : `messages:${conversationId}`

    const channel = supabase
      .channel(channelName)
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

          setMessages(prev => {
            // Check if this message was our optimistic insert
            // by comparing with pending messages
            const tempId = pendingMessagesRef.current.get(newMessage.id)
            if (tempId) {
              // Replace the optimistic message with the real one
              pendingMessagesRef.current.delete(newMessage.id)
              return prev.map(m =>
                m.tempId === tempId
                  ? { ...newMessage, status: 'sent' as const }
                  : m
              )
            }

            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => m.id === newMessage.id)
            if (exists) {
              return prev
            }

            // New message from someone else - add it
            return [...prev, { ...newMessage, status: 'sent' as const }]
          })
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

          setMessages(
            prev =>
              prev
                .map(m => {
                  if (m.id === updatedMessage.id) {
                    // If message was deleted (soft delete), remove from list
                    if (updatedMessage.is_deleted) {
                      return null as unknown as MessageWithStatus
                    }
                    return { ...updatedMessage, status: 'sent' as const }
                  }
                  return m
                })
                .filter(Boolean) as MessageWithStatus[]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, isClient])

  // Send a new message with optimistic update
  const sendMessage = useCallback(
    async (content: string): Promise<{ success: boolean; error?: string }> => {
      if (!content.trim()) {
        return { success: false, error: 'Message content is required' }
      }

      setIsSending(true)
      setError(null)

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create optimistic message
      const optimisticMessage: MessageWithStatus = {
        id: tempId,
        conversation_id: conversationId,
        sender_user_id: isClient ? null : currentUserId,
        sender_client_id: isClient && clientId ? clientId : null,
        sender_name: currentUserName,
        content: content.trim(),
        content_type: 'text',
        attachments: [],
        is_system_message: false,
        is_read: false,
        reply_to_id: null,
        is_edited: false,
        edited_at: null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        status: 'pending',
        tempId,
      }

      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage])

      try {
        // Import the action dynamically to avoid circular dependencies
        const { sendMessage: sendMessageAction, sendClientMessage } =
          await import('@/app/actions/messaging')

        let result
        if (isClient && clientId) {
          result = await sendClientMessage({
            conversationId,
            clientId,
            clientName: currentUserName,
            content: content.trim(),
          })
        } else {
          result = await sendMessageAction({
            conversationId,
            content: content.trim(),
          })
        }

        if (result.success && result.message) {
          // Track the mapping from real ID to temp ID for realtime reconciliation
          pendingMessagesRef.current.set(result.message.id, tempId)

          // Update the optimistic message with real data
          setMessages(prev =>
            prev.map(m =>
              m.tempId === tempId
                ? { ...result.message!, status: 'sent' as const }
                : m
            )
          )

          setIsSending(false)
          return { success: true }
        } else {
          // Mark message as failed
          setMessages(prev =>
            prev.map(m =>
              m.tempId === tempId ? { ...m, status: 'failed' as const } : m
            )
          )
          setError(result.error || 'Failed to send message')
          setIsSending(false)
          return { success: false, error: result.error }
        }
      } catch (err) {
        // Mark message as failed
        setMessages(prev =>
          prev.map(m =>
            m.tempId === tempId ? { ...m, status: 'failed' as const } : m
          )
        )
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message'
        setError(errorMessage)
        setIsSending(false)
        return { success: false, error: errorMessage }
      }
    },
    [conversationId, currentUserId, currentUserName, isClient, clientId]
  )

  // Edit a message
  const editMessage = useCallback(
    async (
      id: string,
      content: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!content.trim()) {
        return { success: false, error: 'Message content is required' }
      }

      // Store original for rollback
      const originalMessage = messages.find(m => m.id === id)
      if (!originalMessage) {
        return { success: false, error: 'Message not found' }
      }

      // Optimistic update
      setMessages(prev =>
        prev.map(m =>
          m.id === id ? { ...m, content: content.trim(), is_edited: true } : m
        )
      )

      try {
        const { editMessage: editMessageAction } =
          await import('@/app/actions/messaging')
        const result = await editMessageAction(id, content.trim())

        if (!result.success) {
          // Rollback on failure
          setMessages(prev =>
            prev.map(m => (m.id === id ? originalMessage : m))
          )
          return { success: false, error: result.error }
        }

        return { success: true }
      } catch (err) {
        // Rollback on error
        setMessages(prev => prev.map(m => (m.id === id ? originalMessage : m)))
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to edit message'
        return { success: false, error: errorMessage }
      }
    },
    [messages]
  )

  // Delete a message
  const deleteMessage = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      // Store original for rollback
      const originalMessage = messages.find(m => m.id === id)
      if (!originalMessage) {
        return { success: false, error: 'Message not found' }
      }

      // Optimistic removal
      setMessages(prev => prev.filter(m => m.id !== id))

      try {
        const { deleteMessage: deleteMessageAction } =
          await import('@/app/actions/messaging')
        const result = await deleteMessageAction(id)

        if (!result.success) {
          // Rollback on failure
          setMessages(prev => {
            // Find the right position to reinsert
            const insertIndex = prev.findIndex(
              m => new Date(m.created_at) > new Date(originalMessage.created_at)
            )
            if (insertIndex === -1) {
              return [...prev, originalMessage]
            }
            return [
              ...prev.slice(0, insertIndex),
              originalMessage,
              ...prev.slice(insertIndex),
            ]
          })
          return { success: false, error: result.error }
        }

        return { success: true }
      } catch (err) {
        // Rollback on error
        setMessages(prev => {
          const insertIndex = prev.findIndex(
            m => new Date(m.created_at) > new Date(originalMessage.created_at)
          )
          if (insertIndex === -1) {
            return [...prev, originalMessage]
          }
          return [
            ...prev.slice(0, insertIndex),
            originalMessage,
            ...prev.slice(insertIndex),
          ]
        })
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete message'
        return { success: false, error: errorMessage }
      }
    },
    [messages]
  )

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isSending,
    error,
  }
}
