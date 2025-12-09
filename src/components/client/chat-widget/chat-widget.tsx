'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatWidgetBubble } from './chat-widget-bubble'
import { ChatWidgetPanel } from './chat-widget-panel'
import { ChatWidgetConversationList } from './chat-widget-conversation-list'
import { ChatWidgetThread } from './chat-widget-thread'
import { useUnreadCount } from '@/lib/hooks/use-unread-count'

type WidgetView = 'list' | 'thread'

interface ChatWidgetProps {
  /** Client ID for fetching conversations */
  clientId: string
  /** Client name for display and presence */
  clientName: string
  /** Initial unread count (from server) */
  initialUnreadCount?: number
}

const STORAGE_KEY = 'chat-widget-expanded'

/**
 * ChatWidget - Main floating chat widget for client portal
 *
 * Features:
 * - Floating bubble in bottom-right corner
 * - Expandable panel with conversation list
 * - Thread view for individual conversations
 * - Persistent state via localStorage
 * - Real-time unread count updates
 */
export function ChatWidget({
  clientId,
  clientName,
  initialUnreadCount = 0,
}: ChatWidgetProps) {
  // Widget state - use lazy initializer to restore from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [view, setView] = useState<WidgetView>('list')
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [activeConversationSubject, setActiveConversationSubject] = useState<
    string | null
  >(null)

  // Real-time unread count
  const { unreadCount } = useUnreadCount({
    clientId,
    initialCount: initialUnreadCount,
  })

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isExpanded))
    } catch {
      // localStorage not available
    }
  }, [isExpanded])

  // Handlers
  const handleExpand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const handleMinimize = useCallback(() => {
    setIsExpanded(false)
  }, [])

  const handleSelectConversation = useCallback(
    (conversationId: string, subject: string | null) => {
      setActiveConversationId(conversationId)
      setActiveConversationSubject(subject)
      setView('thread')
    },
    []
  )

  const handleBackToList = useCallback(() => {
    setView('list')
    setActiveConversationId(null)
    setActiveConversationSubject(null)
  }, [])

  // Keyboard handling for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        if (view === 'thread') {
          handleBackToList()
        } else {
          handleMinimize()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, view, handleBackToList, handleMinimize])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isExpanded ? (
        <ChatWidgetPanel
          title={
            view === 'thread'
              ? activeConversationSubject || 'Conversation'
              : 'Messages'
          }
          showBackButton={view === 'thread'}
          onBack={handleBackToList}
          onMinimize={handleMinimize}
        >
          {view === 'list' ? (
            <ChatWidgetConversationList
              clientId={clientId}
              clientName={clientName}
              onSelectConversation={handleSelectConversation}
            />
          ) : (
            activeConversationId && (
              <ChatWidgetThread
                conversationId={activeConversationId}
                clientId={clientId}
                clientName={clientName}
              />
            )
          )}
        </ChatWidgetPanel>
      ) : (
        <ChatWidgetBubble unreadCount={unreadCount} onClick={handleExpand} />
      )}
    </div>
  )
}
