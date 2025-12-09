/**
 * Messaging Permissions Utilities
 *
 * Implements Slack-style granular permissions for the messaging system.
 * Based on conversation types and user roles.
 *
 * Conversation Types:
 * - client-direct: Client <-> Practice (client + all team can see)
 * - team-internal: Team-only discussion (no clients)
 * - team-about-client: Team discussing a specific client (client cannot see)
 *
 * Permission Matrix:
 * | Role        | View Client | View Team | Create Client | Create Team | Delete |
 * |-------------|-------------|-----------|---------------|-------------|--------|
 * | Client      | Own only    | No        | No            | No          | Own    |
 * | Team Member | All         | Yes       | Yes           | Yes         | Own    |
 * | Admin       | All         | All       | Yes           | Yes         | Any    |
 */

import { createClient } from '@/lib/supabase/server'

// Types
export type ConversationType =
  | 'direct' // Legacy
  | 'group' // Legacy
  | 'system'
  | 'client-direct'
  | 'team-internal'
  | 'team-about-client'

export type UserRole = 'admin' | 'provider' | 'viewer'

export interface User {
  id: string
  role?: UserRole
  role_id?: string
}

export interface ClientSession {
  clientId: string
  name: string
  email: string
}

export interface Conversation {
  id: string
  conversation_type: ConversationType
  client_id: string | null
  status: 'active' | 'closed' | 'archived'
}

export interface Message {
  id: string
  conversation_id: string
  sender_user_id: string | null
  sender_client_id: string | null
}

// ============================================================================
// Permission Check Functions
// ============================================================================

/**
 * Check if a user can view a specific conversation
 *
 * Rules:
 * - Team members can view ALL client-direct and team-about-client conversations
 * - Team members can only view team-internal conversations they participate in
 * - Clients can only view client-direct conversations they're part of
 */
export async function canViewConversation(
  user: User | null,
  clientSession: ClientSession | null,
  conversationId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Get conversation details
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, conversation_type, client_id')
    .eq('id', conversationId)
    .single()

  if (error || !conversation) {
    return false
  }

  // Team member check
  if (user) {
    const convType = conversation.conversation_type

    // Team can see all client conversations (continuity of care)
    if (convType === 'client-direct' || convType === 'team-about-client') {
      return true
    }

    // Legacy direct/group - allow if user is participant
    if (convType === 'direct' || convType === 'group') {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

      return !!participant
    }

    // Team-internal - only if participant
    if (convType === 'team-internal') {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

      return !!participant
    }

    return false
  }

  // Client check
  if (clientSession) {
    // Clients can only see client-direct conversations they're part of
    // Support both new 'client-direct' and legacy 'direct' types
    const isClientConversation =
      conversation.conversation_type === 'client-direct' ||
      conversation.conversation_type === 'direct'

    if (
      isClientConversation &&
      conversation.client_id === clientSession.clientId
    ) {
      return true
    }
  }

  return false
}

/**
 * Check if a user can send messages to a specific conversation
 *
 * Rules:
 * - Team members can send to any client conversation
 * - Team members can only send to team-internal conversations they participate in
 * - Clients can only send to client-direct conversations they're part of
 */
export async function canSendMessage(
  user: User | null,
  clientSession: ClientSession | null,
  conversationId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Get conversation details
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, conversation_type, client_id, status')
    .eq('id', conversationId)
    .single()

  if (error || !conversation) {
    return false
  }

  // Can't send to closed/archived conversations
  if (conversation.status !== 'active') {
    return false
  }

  // Team member check
  if (user) {
    const convType = conversation.conversation_type

    // Team can send to client conversations
    if (convType === 'client-direct' || convType === 'team-about-client') {
      return true
    }

    // Legacy direct/group - allow if participant
    if (convType === 'direct' || convType === 'group') {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

      return !!participant
    }

    // Team-internal - only if participant
    if (convType === 'team-internal') {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

      return !!participant
    }

    return false
  }

  // Client check
  if (clientSession) {
    // Clients can only send to their client-direct conversations
    // Support both new 'client-direct' and legacy 'direct' types
    const isClientConversation =
      conversation.conversation_type === 'client-direct' ||
      conversation.conversation_type === 'direct'

    if (
      isClientConversation &&
      conversation.client_id === clientSession.clientId
    ) {
      return true
    }
  }

  return false
}

/**
 * Check if a user can start a conversation with a target
 *
 * Rules:
 * - Team members can start conversations with clients or other team members
 * - Clients CANNOT start conversations (team must initiate)
 * - Admins can start any type of conversation
 */
export async function canStartConversationWith(
  user: User | null,
  clientSession: ClientSession | null,
  _targetId: string,
  targetType: 'user' | 'client'
): Promise<boolean> {
  // Clients cannot initiate conversations
  if (clientSession && !user) {
    return false
  }

  // Team members can create conversations
  if (user) {
    // Team can start conversations with clients
    if (targetType === 'client') {
      return true
    }

    // Team can start conversations with other team members
    if (targetType === 'user') {
      return true
    }
  }

  return false
}

/**
 * Check if a user can delete a specific message
 *
 * Rules:
 * - Users can delete their own messages
 * - Admins can delete any message
 * - Clients can only delete their own messages
 */
export async function canDeleteMessage(
  user: User | null,
  clientSession: ClientSession | null,
  message: Message
): Promise<boolean> {
  // Team member check
  if (user) {
    // Users can delete their own messages
    if (message.sender_user_id === user.id) {
      return true
    }

    // Admins can delete any message
    if (user.role === 'admin') {
      return true
    }

    return false
  }

  // Client check
  if (clientSession) {
    // Clients can only delete their own messages
    return message.sender_client_id === clientSession.clientId
  }

  return false
}

/**
 * Get all conversations accessible to a user
 *
 * Returns filtered list based on user role:
 * - Team members: All client conversations + team conversations they participate in
 * - Clients: Only their own client-direct conversations
 */
export async function getAccessibleConversations(
  user: User | null,
  clientSession: ClientSession | null,
  options: {
    status?: 'active' | 'closed' | 'archived' | 'all'
    limit?: number
    offset?: number
  } = {}
): Promise<{
  conversations: Conversation[]
  total: number
}> {
  const supabase = await createClient()
  const { status = 'active', limit = 50, offset = 0 } = options

  // Team member - get all accessible conversations
  if (user) {
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
      .in('conversation_type', [
        'client-direct',
        'team-about-client',
        'team-internal',
        'direct',
        'group',
      ])
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return { conversations: [], total: 0 }
    }

    // Filter team-internal to only those user participates in
    const filtered =
      data?.filter(conv => {
        if (conv.conversation_type === 'team-internal') {
          return conv.participants?.some(
            (p: { user_id: string | null }) => p.user_id === user.id
          )
        }
        return true
      }) || []

    return {
      conversations: filtered as Conversation[],
      total: count || 0,
    }
  }

  // Client - get only their conversations
  if (clientSession) {
    let query = supabase
      .from('conversations')
      .select(
        `
        *,
        participants:conversation_participants(
          id, user_id, client_id, display_name, unread_count, last_read_at
        )
      `,
        { count: 'exact' }
      )
      .eq('conversation_type', 'client-direct')
      .eq('client_id', clientSession.clientId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching client conversations:', error)
      return { conversations: [], total: 0 }
    }

    return {
      conversations: (data || []) as Conversation[],
      total: count || 0,
    }
  }

  return { conversations: [], total: 0 }
}

// ============================================================================
// Role-Based Permission Helpers
// ============================================================================

/**
 * Check if user has a specific messaging permission
 */
export function hasMessagingPermission(
  user: User | null,
  permission:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'read_all_client_conversations'
    | 'read_team_conversations'
    | 'delete_any_message'
): boolean {
  if (!user) return false

  // Admins have all permissions
  if (user.role === 'admin') return true

  // Provider permissions
  if (user.role === 'provider') {
    return [
      'create',
      'read',
      'update',
      'delete',
      'read_all_client_conversations',
      'read_team_conversations',
    ].includes(permission)
  }

  // Viewer permissions
  if (user.role === 'viewer') {
    return ['read', 'read_all_client_conversations'].includes(permission)
  }

  return false
}

/**
 * Check if the current user is a team member (vs a client)
 */
export async function isTeamMember(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  return !!data
}

// ============================================================================
// Conversation Type Helpers
// ============================================================================

/**
 * Get the appropriate conversation type for a new conversation
 */
export function getConversationType(
  hasClient: boolean,
  isTeamOnly: boolean,
  isAboutClient: boolean
): ConversationType {
  if (hasClient && !isTeamOnly) {
    return 'client-direct'
  }
  if (isTeamOnly && isAboutClient) {
    return 'team-about-client'
  }
  if (isTeamOnly) {
    return 'team-internal'
  }
  return 'client-direct' // Default
}

/**
 * Check if a conversation type is visible to clients
 */
export function isVisibleToClients(
  conversationType: ConversationType
): boolean {
  return conversationType === 'client-direct'
}

/**
 * Check if a conversation type is team-only
 */
export function isTeamOnly(conversationType: ConversationType): boolean {
  return (
    conversationType === 'team-internal' ||
    conversationType === 'team-about-client'
  )
}
