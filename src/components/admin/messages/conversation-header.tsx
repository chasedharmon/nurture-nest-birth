'use client'

/**
 * ConversationHeader Component
 *
 * Client component wrapper for conversation header that displays:
 * - Client name and email
 * - Conversation status badge
 * - Online presence indicator
 * - Action buttons
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, User, ExternalLink } from 'lucide-react'
import { ConversationActions } from '@/components/admin/messages/conversation-actions'
import { OnlineStatus } from '@/components/ui/online-indicator'
import { usePresence } from '@/lib/hooks/use-presence'

interface ConversationHeaderProps {
  conversationId: string
  currentUserId: string
  currentUserName: string
  client: {
    id: string
    name: string
    email: string | null
  } | null
  status: 'active' | 'closed' | 'archived'
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
  status,
}: ConversationHeaderProps) {
  // Track own presence and get other users' presence
  const { isUserOnline, getLastSeen } = usePresence({
    userId: currentUserId,
    userName: currentUserName,
    isClient: false,
    room: `conversation:${conversationId}`,
  })

  // Check if the client is online (if we have a client)
  const clientIsOnline = client ? isUserOnline(client.id) : false
  const clientLastSeen = client ? getLastSeen(client.id) : null

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
                <User className="h-5 w-5 text-primary" />
                {/* Online dot overlay */}
                {clientIsOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-foreground">
                    {client?.name || 'Unknown Client'}
                  </h1>
                  <Badge variant="secondary" className={statusColors[status]}>
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {client?.email || 'No email'}
                  </p>
                  {/* Online status text */}
                  {(clientIsOnline || clientLastSeen) && (
                    <>
                      <span className="text-muted-foreground">·</span>
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
