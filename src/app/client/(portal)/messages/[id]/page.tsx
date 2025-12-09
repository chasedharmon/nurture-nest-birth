import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientSession } from '@/app/actions/client-auth'
import {
  getConversationById,
  getMessages,
  markClientConversationAsRead,
} from '@/app/actions/messaging'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import { ClientMessageThread } from '@/components/client/messages/client-message-thread'
import { ClientMessageComposer } from '@/components/client/messages/client-message-composer'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getConversationById(id)

  if (!result.success || !result.conversation) {
    return { title: 'Message Not Found | Client Portal' }
  }

  return {
    title: 'Conversation | Client Portal',
    description: 'Message conversation with your doula team',
  }
}

export default async function ClientConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getClientSession()
  const { id } = await params

  if (!session) {
    redirect('/client/login')
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

  // Verify the client has access to this conversation
  if (conversation.client_id !== session.clientId) {
    notFound()
  }

  // Mark conversation as read for this client
  await markClientConversationAsRead(id, session.clientId)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-border shrink-0">
        <Link href="/client/messages">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Messages
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">
              {conversation.subject || 'Conversation'}
            </h1>
            <p className="text-sm text-muted-foreground">
              With your Nurture Nest team
            </p>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ClientMessageThread
          messages={messages}
          clientId={session.clientId}
          conversationId={id}
        />

        {/* Composer */}
        {conversation.status === 'active' ? (
          <div className="border-t border-border bg-card py-4 shrink-0">
            <ClientMessageComposer
              conversationId={id}
              clientId={session.clientId}
              clientName={session.name}
            />
          </div>
        ) : (
          <div className="border-t border-border bg-muted/50 py-4 text-center shrink-0">
            <p className="text-sm text-muted-foreground">
              This conversation has been closed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
