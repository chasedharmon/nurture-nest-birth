'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Loader2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PulsingBadge } from '@/components/ui/pulsing-badge'
import { useUnreadCount } from '@/lib/hooks/use-unread-count'
import { getConversations } from '@/app/actions/messaging'
import type { ConversationWithDetails } from '@/app/actions/messaging'
import { cn } from '@/lib/utils'

interface QuickMessagesSheetProps {
  /** Current user ID */
  userId: string
  /** Current user name (for presence tracking) */
  userName: string
  /** Initial unread count */
  initialUnreadCount?: number
}

/**
 * QuickMessagesSheet - Slide-out panel for quick message access from staff portal
 *
 * Features:
 * - Shows recent conversations with unread count
 * - Quick navigation to conversation
 * - Link to full messages page
 * - Real-time unread count updates
 */
export function QuickMessagesSheet({
  userId,
  userName: _userName,
  initialUnreadCount = 0,
}: QuickMessagesSheetProps) {
  // userName kept for future presence tracking in sheet
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(false)

  // Real-time unread count
  const { unreadCount } = useUnreadCount({
    userId,
    initialCount: initialUnreadCount,
  })

  // Fetch conversations function
  async function fetchConversations() {
    setIsLoading(true)
    const result = await getConversations({
      status: 'active',
      limit: 10,
      filter: 'all',
    })
    if (result.success && result.conversations) {
      // Sort by unread first, then by last message
      const sorted = [...result.conversations].sort((a, b) => {
        if ((a.unread_count || 0) > 0 && (b.unread_count || 0) === 0) return -1
        if ((a.unread_count || 0) === 0 && (b.unread_count || 0) > 0) return 1
        return 0
      })
      setConversations(sorted)
    }
    setIsLoading(false)
  }

  // Handle sheet open/close - fetch when opening
  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) {
      fetchConversations()
    }
  }

  // Get display info for a conversation
  function getConversationDisplay(conversation: ConversationWithDetails) {
    const isTeamConversation =
      conversation.conversation_type === 'team-internal' ||
      conversation.conversation_type === 'team-about-client'

    if (isTeamConversation) {
      const otherParticipants =
        conversation.participants?.filter(
          p => p.user_id !== userId && p.display_name
        ) || []

      let displayName: string
      if (otherParticipants.length > 0) {
        displayName = otherParticipants
          .map(p => p.display_name)
          .slice(0, 2)
          .join(', ')
        if (otherParticipants.length > 2) {
          displayName += ` +${otherParticipants.length - 2}`
        }
      } else {
        displayName = 'Team Discussion'
      }

      return {
        displayName,
        initials: 'TM',
        isTeam: true,
      }
    }

    const clientName = conversation.client?.name || 'Unknown Client'
    const initials = clientName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return {
      displayName: clientName,
      initials,
      isTeam: false,
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
          {unreadCount > 0 && (
            <PulsingBadge
              count={unreadCount}
              size="sm"
              className="absolute -top-1 -right-1"
            />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-lg">Messages</SheetTitle>
            <Link
              href="/admin/messages"
              className="text-sm text-primary hover:underline flex items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              View All
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No active conversations
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Unread Section */}
              {conversations.some(c => (c.unread_count || 0) > 0) && (
                <div className="py-2">
                  <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Unread
                  </p>
                  {conversations
                    .filter(c => (c.unread_count || 0) > 0)
                    .map(conversation => {
                      const { displayName, initials, isTeam } =
                        getConversationDisplay(conversation)
                      const hasUnread = (conversation.unread_count || 0) > 0

                      return (
                        <Link
                          key={conversation.id}
                          href={`/admin/messages/${conversation.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback
                              className={cn(
                                isTeam
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-primary text-primary-foreground'
                              )}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {displayName}
                              </span>
                              {hasUnread && (
                                <PulsingBadge
                                  count={conversation.unread_count}
                                  size="sm"
                                />
                              )}
                            </div>
                            {conversation.last_message_preview && (
                              <p className="text-sm text-foreground font-medium truncate mt-0.5">
                                {conversation.last_message_preview}
                              </p>
                            )}
                            {conversation.last_message_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(
                                  new Date(conversation.last_message_at),
                                  { addSuffix: true }
                                )}
                              </p>
                            )}
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </Link>
                      )
                    })}
                </div>
              )}

              {/* Recent Section */}
              {conversations.some(c => (c.unread_count || 0) === 0) && (
                <div className="py-2">
                  <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent
                  </p>
                  {conversations
                    .filter(c => (c.unread_count || 0) === 0)
                    .slice(0, 5)
                    .map(conversation => {
                      const { displayName, initials, isTeam } =
                        getConversationDisplay(conversation)

                      return (
                        <Link
                          key={conversation.id}
                          href={`/admin/messages/${conversation.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback
                              className={cn(
                                isTeam
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-muted'
                              )}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">
                              {displayName}
                            </span>
                            {conversation.last_message_preview && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {conversation.last_message_preview}
                              </p>
                            )}
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </Link>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
