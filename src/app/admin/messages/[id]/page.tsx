import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getConversationById,
  getMessages,
  markConversationAsRead,
} from '@/app/actions/messaging'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, User, ExternalLink } from 'lucide-react'
import { MessageThread } from '@/components/admin/messages/message-thread'
import { MessageComposer } from '@/components/admin/messages/message-composer'
import { ConversationActions } from '@/components/admin/messages/conversation-actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getConversationById(id)

  if (!result.success || !result.conversation) {
    return { title: 'Message Not Found | Nurture Nest Birth' }
  }

  const clientName = result.conversation.client?.name || 'Unknown Client'
  return {
    title: `${clientName} - Messages | Nurture Nest Birth`,
    description: `Conversation with ${clientName}`,
  }
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [conversationResult, messagesResult] = await Promise.all([
    getConversationById(id),
    getMessages(id),
  ])

  if (!conversationResult.success || !conversationResult.conversation) {
    notFound()
  }

  const conversation = conversationResult.conversation
  const messages = messagesResult.messages || []

  // Mark conversation as read
  await markConversationAsRead(id)

  const client = conversation.client
  const statusColors = {
    active:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    archived:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
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
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-foreground">
                      {client?.name || 'Unknown Client'}
                    </h1>
                    <Badge
                      variant="secondary"
                      className={statusColors[conversation.status]}
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {client?.email || 'No email'}
                  </p>
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
                conversationId={conversation.id}
                status={conversation.status}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Message Thread */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl h-full flex flex-col px-4 sm:px-6 lg:px-8">
          <MessageThread
            messages={messages}
            currentUserId={user.id}
            conversationId={id}
          />

          {/* Composer */}
          {conversation.status === 'active' ? (
            <div className="border-t border-border bg-card py-4 shrink-0">
              <MessageComposer conversationId={id} />
            </div>
          ) : (
            <div className="border-t border-border bg-muted/50 py-4 text-center shrink-0">
              <p className="text-sm text-muted-foreground">
                This conversation is {conversation.status}. Reopen it to send
                messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
