import { redirect } from 'next/navigation'
import { getClientSession } from '@/app/actions/client-auth'
import {
  getClientConversations,
  getClientUnreadCount,
} from '@/app/actions/messaging'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Inbox } from 'lucide-react'
import { ClientConversationList } from '@/components/client/messages/client-conversation-list'

export const metadata = {
  title: 'Messages | Client Portal',
  description: 'View messages from your doula team',
}

export default async function ClientMessagesPage() {
  const session = await getClientSession()

  if (!session) {
    redirect('/client/login')
  }

  const [conversationsResult, unreadResult] = await Promise.all([
    getClientConversations(session.clientId),
    getClientUnreadCount(session.clientId),
  ])

  const conversations = conversationsResult.conversations || []
  const totalUnread = unreadResult.count || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with your doula team
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{conversations.length}</div>
                <p className="text-sm text-muted-foreground">Conversations</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalUnread}</div>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No messages yet</h3>
            <p className="text-muted-foreground text-center mt-1 max-w-sm">
              Your doula will reach out when they have updates or information to
              share with you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ClientConversationList
              conversations={conversations}
              clientId={session.clientId}
              clientName={session.name}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
