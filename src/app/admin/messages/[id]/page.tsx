import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationById, getMessages } from '@/app/actions/messaging'
import { MessageThread } from '@/components/admin/messages/message-thread'
import { MessageComposer } from '@/components/admin/messages/message-composer'
import { ConversationHeader } from '@/components/admin/messages/conversation-header'

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

  // Get the current user's name from the users table
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const currentUserName =
    userData?.name || user.email?.split('@')[0] || 'Team Member'

  const [conversationResult, messagesResult, participantsResult] =
    await Promise.all([
      getConversationById(id),
      getMessages(id),
      supabase
        .from('conversation_participants')
        .select('id, user_id, client_id, display_name, last_read_at')
        .eq('conversation_id', id),
    ])

  if (!conversationResult.success || !conversationResult.conversation) {
    notFound()
  }

  const conversation = conversationResult.conversation
  const messages = messagesResult.messages || []
  const participants = participantsResult.data || []

  // Note: markConversationAsRead is called in the MessageThread component
  // via useEffect to avoid calling revalidatePath during render

  const client = conversation.client

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with online presence */}
      <ConversationHeader
        conversationId={id}
        currentUserId={user.id}
        currentUserName={currentUserName}
        client={
          client
            ? { id: client.id, name: client.name, email: client.email }
            : null
        }
        status={conversation.status}
      />

      {/* Message Thread */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl h-full flex flex-col px-4 sm:px-6 lg:px-8">
          <MessageThread
            messages={messages}
            currentUserId={user.id}
            currentUserName={currentUserName}
            conversationId={id}
            participants={participants}
          />

          {/* Composer */}
          {conversation.status === 'active' ? (
            <div className="border-t border-border bg-card py-4 shrink-0">
              <MessageComposer
                conversationId={id}
                userId={user.id}
                userName={currentUserName}
              />
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
