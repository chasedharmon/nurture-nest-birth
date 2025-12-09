'use client'

/**
 * ConversationHeader Component
 *
 * Client component wrapper for conversation header that displays:
 * - Client name and email OR team member names
 * - Conversation status badge
 * - Online presence indicator
 * - Action buttons
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, User, Users, ExternalLink, Lock } from 'lucide-react'
import { ConversationActions } from '@/components/admin/messages/conversation-actions'
import { OnlineStatus } from '@/components/ui/online-indicator'
import { usePresence } from '@/lib/hooks/use-presence'
import type { ConversationType } from '@/app/actions/messaging'

interface Participant {
  id: string
  user_id: string | null
  client_id: string | null
  display_name: string | null
}

interface ConversationHeaderProps {
  conversationId: string
  currentUserId: string
  currentUserName: string
  client: {
    id: string
    name: string
    email: string | null
  } | null
  participants?: Participant[]
  status: 'active' | 'closed' | 'archived'
  conversationType?: ConversationType
  subject?: string | null
}

const statusColors = {
  active:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  archived:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

export function ConversationHeader({
  conversationId,
  currentUserId,
  currentUserName,
  client,
  participants,
  status,
  conversationType,
  subject,
}: ConversationHeaderProps) {
  // Track own presence and get other users' presence
  const { isUserOnline, getLastSeen } = usePresence({
    userId: currentUserId,
    userName: currentUserName,
    isClient: false,
    room: `conversation:${conversationId}`,
  })

  const isTeamConversation =
    conversationType === 'team-internal' ||
    conversationType === 'team-about-client'
  const isAboutClient = conversationType === 'team-about-client'

  // For team conversations, show participant names
  // For client conversations, show client name
  let displayName: string
  let subText: string | null = null

  if (isTeamConversation && participants) {
    const otherParticipants = participants.filter(
      p => p.user_id !== currentUserId && p.display_name
    )
    if (otherParticipants.length > 0) {
      displayName = otherParticipants
        .map(p => p.display_name)
        .slice(0, 3)
        .join(', ')
      if (otherParticipants.length > 3) {
        displayName += ` +${otherParticipants.length - 3}`
      }
    } else {
      displayName = 'Team Discussion'
    }

    if (isAboutClient && client) {
      subText = `About: ${client.name}`
    } else if (subject) {
      subText = subject
    }
  } else {
    displayName = client?.name || 'Unknown Client'
    subText = client?.email || null
  }

  // Check if the client is online (if we have a client and it's a client conversation)
  const clientIsOnline =
    !isTeamConversation && client ? isUserOnline(client.id) : false
  const clientLastSeen =
    !isTeamConversation && client ? getLastSeen(client.id) : null

  return (
    <header className="border-b border-border bg-card shrink-0">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/messages">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Messages
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative rounded-full bg-primary/10 p-2">
                {isTeamConversation ? (
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
                {/* Online dot overlay */}
                {!isTeamConversation && clientIsOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-foreground">
                    {displayName}
                  </h1>
                  {isTeamConversation && (
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" />
                      Team Only
                    </Badge>
                  )}
                  <Badge variant="secondary" className={statusColors[status]}>
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {subText && (
                    <p className="text-sm text-muted-foreground">{subText}</p>
                  )}
                  {/* Online status text - only for client conversations */}
                  {!isTeamConversation &&
                    (clientIsOnline || clientLastSeen) && (
                      <>
                        {subText && (
                          <span className="text-muted-foreground">·</span>
                        )}
                        <OnlineStatus
                          isOnline={clientIsOnline}
                          lastSeenText={clientLastSeen}
                        />
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Show View Client link for client conversations or team-about-client */}
            {client && (
              <Link href={`/admin/leads/${client.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Client
                </Button>
              </Link>
            )}
            <ConversationActions
              conversationId={conversationId}
              status={status}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
