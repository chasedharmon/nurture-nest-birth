import { redirect, notFound } from 'next/navigation'
import { getClientSession } from '@/app/actions/client-auth'
import {
  getConversationById,
  getMessages,
  markClientConversationAsRead,
} from '@/app/actions/messaging'
import { ClientMessageThread } from '@/components/client/messages/client-message-thread'
import { ClientMessageComposer } from '@/components/client/messages/client-message-composer'
import { ClientConversationHeader } from '@/components/client/messages/client-conversation-header'

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
      {/* Header with online presence */}
      <ClientConversationHeader
        conversationId={id}
        clientId={session.clientId}
        clientName={session.name}
        subject={conversation.subject}
      />

      {/* Message Thread */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ClientMessageThread
          messages={messages}
          clientId={session.clientId}
          clientName={session.name}
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
