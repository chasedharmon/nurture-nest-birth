'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canSendMessage, canDeleteMessage } from '@/lib/permissions/messaging'

// Types for messaging
export type ConversationType =
  | 'direct' // Legacy: direct message
  | 'group' // Legacy: group message
  | 'system' // System-generated messages
  | 'client-direct' // Client <-> Practice (client + all team can see)
  | 'team-internal' // Team-only discussion (no clients)
  | 'team-about-client' // Team discussing a specific client (client cannot see)

export interface Conversation {
  id: string
  subject: string | null
  conversation_type: ConversationType
  client_id: string | null
  status: 'active' | 'closed' | 'archived'
  is_archived: boolean
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
  updated_at: string
}

export interface ConversationWithDetails extends Conversation {
  client?: {
    id: string
    name: string
    email: string
  } | null
  participants: {
    id: string
    user_id: string | null
    client_id: string | null
    display_name: string | null
    unread_count: number
    last_read_at: string | null
  }[]
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_user_id: string | null
  sender_client_id: string | null
  sender_name: string
  content: string
  content_type: 'text' | 'html' | 'markdown'
  attachments: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  is_system_message: boolean
  is_read: boolean
  reply_to_id: string | null
  is_edited: boolean
  edited_at: string | null
  is_deleted: boolean
  created_at: string
}

// ============================================================================
// CONVERSATION ACTIONS
// ============================================================================

export async function getConversations(
  options: {
    status?: 'active' | 'closed' | 'archived' | 'all'
    limit?: number
    offset?: number
    includeTeam?: boolean // Include team-internal conversations
    filter?: 'all' | 'clients' | 'team' // Filter by type
  } = {}
) {
  const supabase = await createClient()
  const {
    status = 'active',
    limit = 50,
    offset = 0,
    includeTeam = true,
    filter = 'all',
  } = options

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  let query = supabase
    .from('conversations')
    .select(
      `
      *,
      client:leads!conversations_client_id_fkey(id, name, email),
      participants:conversation_participants(
        id, user_id, client_id, display_name, unread_count, last_read_at
      )
    `,
      { count: 'exact' }
    )
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply conversation type filter
  if (filter === 'clients') {
    query = query.in('conversation_type', ['client-direct', 'direct'])
  } else if (filter === 'team') {
    query = query.in('conversation_type', [
      'team-internal',
      'team-about-client',
    ])
  } else if (!includeTeam) {
    // Legacy behavior: exclude team conversations
    query = query.in('conversation_type', ['client-direct', 'direct', 'group'])
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching conversations:', error)
    return { success: false, error: error.message }
  }

  // For team conversations, filter to only those where user is a participant
  const filteredData = data?.filter(conv => {
    const isTeamConv =
      conv.conversation_type === 'team-internal' ||
      conv.conversation_type === 'team-about-client'

    if (isTeamConv) {
      // User must be a participant in team conversations
      return conv.participants?.some(
        (p: { user_id: string | null }) => p.user_id === user.id
      )
    }

    // For client conversations, RLS handles visibility
    return true
  })

  // Get unread count for current user
  const conversationsWithUnread = filteredData?.map(conv => {
    const userParticipant = conv.participants?.find(
      (p: { user_id: string | null }) => p.user_id === user.id
    )
    return {
      ...conv,
      unread_count: userParticipant?.unread_count || 0,
    }
  })

  return {
    success: true,
    conversations: conversationsWithUnread as ConversationWithDetails[],
    total: count || 0,
  }
}

export async function getConversationById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      client:leads!conversations_client_id_fkey(id, name, email),
      participants:conversation_participants(
        id, user_id, client_id, display_name, unread_count, last_read_at,
        user:users(id, full_name, email),
        lead:leads(id, name, email)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return { success: false, error: error.message }
  }

  return { success: true, conversation: data as ConversationWithDetails }
}

export async function createConversation(data: {
  clientId: string
  subject?: string
  initialMessage?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Use the helper function to get or create conversation
  const { data: conversationId, error: fnError } = await supabase.rpc(
    'get_or_create_client_conversation',
    {
      p_client_id: data.clientId,
      p_user_id: user.id,
      p_subject: data.subject || null,
    }
  )

  if (fnError) {
    console.error('Error creating conversation:', fnError)
    return { success: false, error: fnError.message }
  }

  // If there's an initial message, send it
  if (data.initialMessage) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      sender_name: userData?.full_name || 'Team Member',
      content: data.initialMessage,
      content_type: 'text',
    })

    if (msgError) {
      console.error('Error sending initial message:', msgError)
      // Don't fail the whole operation, conversation was created
    }
  }

  revalidatePath('/admin/messages')

  return { success: true, conversationId }
}

export async function archiveConversation(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'archived', is_archived: true })
    .eq('id', id)

  if (error) {
    console.error('Error archiving conversation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/messages')

  return { success: true }
}

export async function closeConversation(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'closed' })
    .eq('id', id)

  if (error) {
    console.error('Error closing conversation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/messages')

  return { success: true }
}

export async function reopenConversation(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'active', is_archived: false })
    .eq('id', id)

  if (error) {
    console.error('Error reopening conversation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/messages')

  return { success: true }
}

// ============================================================================
// MESSAGE ACTIONS
// ============================================================================

export async function getMessages(
  conversationId: string,
  options: {
    limit?: number
    before?: string // cursor for pagination
  } = {}
) {
  const supabase = await createClient()
  const { limit = 50, before } = options

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching messages:', error)
    return { success: false, error: error.message }
  }

  // Reverse to get chronological order
  const messages = (data || []).reverse()

  return { success: true, messages: messages as Message[] }
}

export async function sendMessage(data: {
  conversationId: string
  content: string
  contentType?: 'text' | 'html' | 'markdown'
  attachments?: Array<{ name: string; url: string; type: string; size: number }>
  replyToId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get user's role for permission check
  const { data: userData } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Permission check: Can this user send to this conversation?
  const canSend = await canSendMessage(
    { id: user.id, role: userData?.role },
    null, // Not a client
    data.conversationId
  )

  if (!canSend) {
    return {
      success: false,
      error: 'You do not have permission to send messages to this conversation',
    }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: data.conversationId,
      sender_user_id: user.id,
      sender_name: userData?.full_name || 'Team Member',
      content: data.content,
      content_type: data.contentType || 'text',
      attachments: data.attachments || [],
      reply_to_id: data.replyToId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/messages')
  revalidatePath(`/admin/messages/${data.conversationId}`)

  return { success: true, message: message as Message }
}

export async function editMessage(id: string, content: string) {
  const supabase = await createClient()

  // First get the original message
  const { data: original, error: fetchError } = await supabase
    .from('messages')
    .select('content')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content,
      is_edited: true,
      edited_at: new Date().toISOString(),
      original_content: original.content,
    })
    .eq('id', id)

  if (error) {
    console.error('Error editing message:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteMessage(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get the message to check ownership
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_user_id, sender_client_id')
    .eq('id', id)
    .single()

  if (fetchError || !message) {
    return { success: false, error: 'Message not found' }
  }

  // Get user's role for permission check
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Permission check: Can this user delete this message?
  const canDelete = await canDeleteMessage(
    { id: user.id, role: userData?.role },
    null, // Not a client
    message
  )

  if (!canDelete) {
    return {
      success: false,
      error: 'You do not have permission to delete this message',
    }
  }

  const { error } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting message:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================================================
// READ STATUS ACTIONS
// ============================================================================

export async function markConversationAsRead(conversationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
    p_user_id: user.id,
    p_client_id: null,
  })

  if (error) {
    console.error('Error marking conversation as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/messages')

  return { success: true }
}

export async function getUnreadCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated', count: 0 }
  }

  const { data, error } = await supabase.rpc('get_user_unread_count', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error getting unread count:', error)
    return { success: false, error: error.message, count: 0 }
  }

  return { success: true, count: data || 0 }
}

/**
 * Get conversation for a specific client (admin view)
 * Used on the lead detail page to show client messages
 */
export async function getConversationForClient(clientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get the conversation for this client
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      client:leads(id, name, email),
      participants:conversation_participants(
        id, user_id, client_id, display_name, unread_count, last_read_at
      )
    `
    )
    .eq('client_id', clientId)
    .in('conversation_type', ['client-direct', 'direct'])
    .eq('status', 'active')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching client conversation:', error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: true, conversation: null }
  }

  // Get unread count for admin user
  const adminParticipant = data.participants?.find(
    (p: { user_id: string | null }) => p.user_id === user.id
  )

  const conversationWithUnread: ConversationWithDetails = {
    ...data,
    unread_count: adminParticipant?.unread_count || 0,
  }

  return { success: true, conversation: conversationWithUnread }
}

/**
 * Get recent messages for a client conversation (admin view)
 */
export async function getRecentMessagesForClient(
  clientId: string,
  limit: number = 5
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', messages: [] }
  }

  // First find the conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .in('conversation_type', ['client-direct', 'direct'])
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!conversation) {
    return { success: true, messages: [] }
  }

  // Get recent messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent messages:', error)
    return { success: false, error: error.message, messages: [] }
  }

  // Return in chronological order
  return {
    success: true,
    messages: (messages || []).reverse() as Message[],
  }
}

// ============================================================================
// CLIENT PORTAL ACTIONS
// ============================================================================

export async function getClientConversations(clientId: string) {
  // SECURITY: Validate client session server-side
  const { getClientSession } = await import('./client-auth')
  const session = await getClientSession()

  if (!session || session.clientId !== clientId) {
    return { success: false, error: 'Unauthorized' }
  }

  // Use regular client - RLS policies allow anon access for client portal
  // Security is enforced above via session validation
  const supabase = await createClient()

  // Clients can only see client-direct conversations
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      participants:conversation_participants(
        id, user_id, client_id, display_name, unread_count, last_read_at
      )
    `
    )
    .eq('client_id', clientId)
    .in('conversation_type', ['client-direct', 'direct']) // Only client-visible types
    .eq('status', 'active')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching client conversations:', error)
    return { success: false, error: error.message }
  }

  // Get unread count for client
  const conversationsWithUnread = data?.map(conv => {
    const clientParticipant = conv.participants?.find(
      (p: { client_id: string | null }) => p.client_id === clientId
    )
    return {
      ...conv,
      unread_count: clientParticipant?.unread_count || 0,
    }
  })

  return { success: true, conversations: conversationsWithUnread }
}

export async function sendClientMessage(data: {
  conversationId: string
  clientId: string
  clientName: string
  content: string
}) {
  // SECURITY: Validate client session server-side
  // Import dynamically to avoid circular dependencies
  const { getClientSession } = await import('./client-auth')
  const session = await getClientSession()

  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // SECURITY: Verify the session's clientId matches the provided clientId
  if (session.clientId !== data.clientId) {
    console.error('[Security] Client ID mismatch:', {
      sessionClientId: session.clientId,
      providedClientId: data.clientId,
    })
    return { success: false, error: 'Unauthorized' }
  }

  // Permission check: Can this client send to this conversation?
  const canSend = await canSendMessage(
    null, // Not a team user
    { clientId: data.clientId, name: data.clientName, email: '' },
    data.conversationId
  )

  if (!canSend) {
    return {
      success: false,
      error: 'You do not have permission to send messages to this conversation',
    }
  }

  // Use regular client - RLS policies allow anon access for client portal
  // Security is enforced above via session validation
  const supabase = await createClient()

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: data.conversationId,
      sender_client_id: data.clientId,
      sender_name: data.clientName,
      content: data.content,
      content_type: 'text',
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending client message:', error)
    return { success: false, error: error.message }
  }

  return { success: true, message: message as Message }
}

export async function markClientConversationAsRead(
  conversationId: string,
  clientId: string
) {
  // SECURITY: Validate client session server-side
  const { getClientSession } = await import('./client-auth')
  const session = await getClientSession()

  if (!session || session.clientId !== clientId) {
    return { success: false, error: 'Unauthorized' }
  }

  // Use regular client - RLS policies allow anon access for client portal
  const supabase = await createClient()

  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
    p_user_id: null,
    p_client_id: clientId,
  })

  if (error) {
    console.error('Error marking conversation as read:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getClientUnreadCount(clientId: string) {
  // SECURITY: Validate client session server-side
  const { getClientSession } = await import('./client-auth')
  const session = await getClientSession()

  if (!session || session.clientId !== clientId) {
    return { success: false, error: 'Unauthorized', count: 0 }
  }

  // Use regular client - RLS policies allow anon access for client portal
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversation_participants')
    .select('unread_count')
    .eq('client_id', clientId)

  if (error) {
    console.error('Error getting client unread count:', error)
    return { success: false, error: error.message, count: 0 }
  }

  const total = data?.reduce((sum, p) => sum + (p.unread_count || 0), 0) || 0

  return { success: true, count: total }
}

// ============================================================================
// SEARCH & UTILITIES
// ============================================================================

// ============================================================================
// TEAM CONVERSATION ACTIONS
// ============================================================================

export async function createTeamConversation(data: {
  participantUserIds: string[]
  subject?: string
  initialMessage?: string
  aboutClientId?: string // For team-about-client conversations
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Ensure current user is in participants list
  const participantIds = Array.from(
    new Set([user.id, ...data.participantUserIds])
  )

  if (participantIds.length < 2) {
    return {
      success: false,
      error: 'Team conversations require at least 2 participants',
    }
  }

  // Determine conversation type
  const conversationType = data.aboutClientId
    ? 'team-about-client'
    : 'team-internal'

  // Create the conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      subject: data.subject || null,
      conversation_type: conversationType,
      client_id: data.aboutClientId || null,
      status: 'active',
    })
    .select()
    .single()

  if (convError) {
    console.error('Error creating team conversation:', convError)
    return { success: false, error: convError.message }
  }

  // Get user names for participants
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', participantIds)

  if (usersError) {
    console.error('Error fetching user names:', usersError)
    // Continue anyway - we'll use fallback names
  }

  const userMap = new Map(users?.map(u => [u.id, u.full_name]) || [])

  // Add all participants
  const participantRecords = participantIds.map(userId => ({
    conversation_id: conversation.id,
    user_id: userId,
    display_name: userMap.get(userId) || 'Team Member',
    unread_count: userId === user.id ? 0 : 1, // Creator has 0 unread
  }))

  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(participantRecords)

  if (partError) {
    console.error('Error adding participants:', partError)
    // Clean up conversation
    await supabase.from('conversations').delete().eq('id', conversation.id)
    return { success: false, error: partError.message }
  }

  // If there's an initial message, send it
  if (data.initialMessage) {
    const senderName = userMap.get(user.id) || 'Team Member'

    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_user_id: user.id,
      sender_name: senderName,
      content: data.initialMessage,
      content_type: 'text',
    })

    if (msgError) {
      console.error('Error sending initial message:', msgError)
      // Don't fail the whole operation, conversation was created
    }
  }

  revalidatePath('/admin/messages')

  return { success: true, conversationId: conversation.id }
}

export async function getTeamConversations(
  options: {
    status?: 'active' | 'closed' | 'archived' | 'all'
    limit?: number
    offset?: number
  } = {}
) {
  const supabase = await createClient()
  const { status = 'active', limit = 50, offset = 0 } = options

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get team conversations where user is a participant
  let query = supabase
    .from('conversations')
    .select(
      `
      *,
      client:leads!conversations_client_id_fkey(id, name, email),
      participants:conversation_participants(
        id, user_id, client_id, display_name, unread_count, last_read_at
      )
    `,
      { count: 'exact' }
    )
    .in('conversation_type', ['team-internal', 'team-about-client'])
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching team conversations:', error)
    return { success: false, error: error.message }
  }

  // Filter to only conversations where user is a participant
  const userConversations = data?.filter(conv =>
    conv.participants?.some(
      (p: { user_id: string | null }) => p.user_id === user.id
    )
  )

  // Get unread count for current user
  const conversationsWithUnread = userConversations?.map(conv => {
    const userParticipant = conv.participants?.find(
      (p: { user_id: string | null }) => p.user_id === user.id
    )
    return {
      ...conv,
      unread_count: userParticipant?.unread_count || 0,
    }
  })

  return {
    success: true,
    conversations: conversationsWithUnread as ConversationWithDetails[],
    total: count || 0,
  }
}

export async function searchConversations(query: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Search in conversation subjects and client names
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      client:leads!conversations_client_id_fkey(id, name, email),
      participants:conversation_participants(
        id, user_id, client_id, display_name, unread_count
      )
    `
    )
    .or(`subject.ilike.%${query}%`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(20)

  if (error) {
    console.error('Error searching conversations:', error)
    return { success: false, error: error.message }
  }

  return { success: true, conversations: data }
}
