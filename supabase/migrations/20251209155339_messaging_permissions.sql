-- ============================================================================
-- Migration: Messaging Permissions & Conversation Types
-- Implements Slack-style granular permissions for messaging
-- ============================================================================

-- ============================================================================
-- 1. UPDATE CONVERSATION TYPES
-- ============================================================================

-- The existing conversation_type column supports 'direct', 'group', 'system'
-- We'll keep this but add clarity with new types for permissions

-- Add new conversation types to support team-only and client conversations
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversation_type_check;

ALTER TABLE conversations
ADD CONSTRAINT conversation_type_check
CHECK (conversation_type IN (
  'direct',           -- Legacy: direct message (deprecated, use client-direct)
  'group',            -- Legacy: group message
  'system',           -- System-generated messages
  'client-direct',    -- Client <-> Practice (client + all team can see)
  'team-internal',    -- Team-only discussion (no clients)
  'team-about-client' -- Team discussing a specific client (client cannot see)
));

-- Migrate existing 'direct' conversations to 'client-direct' where applicable
UPDATE conversations
SET conversation_type = 'client-direct'
WHERE conversation_type = 'direct'
  AND client_id IS NOT NULL;

-- ============================================================================
-- 2. ADD MESSAGING PERMISSIONS TO ROLES
-- ============================================================================

-- Update admin role with full messaging permissions
UPDATE roles
SET permissions = permissions || '{
  "messaging": ["create", "read", "update", "delete", "read_all_client_conversations", "read_team_conversations", "delete_any_message"]
}'::jsonb
WHERE name = 'admin';

-- Update provider role with standard messaging permissions
UPDATE roles
SET permissions = permissions || '{
  "messaging": ["create", "read", "update", "delete", "read_all_client_conversations", "read_team_conversations"]
}'::jsonb
WHERE name = 'provider';

-- Update viewer role with read-only messaging
UPDATE roles
SET permissions = permissions || '{
  "messaging": ["read", "read_all_client_conversations"]
}'::jsonb
WHERE name = 'viewer';

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR CONVERSATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;

-- New policy: Team members can view ALL client conversations (continuity of care)
-- Clients can only view their own conversations
CREATE POLICY "conversation_select_policy" ON conversations
FOR SELECT TO authenticated
USING (
  -- Team members (users in users table) can see:
  -- 1. All client-direct conversations (continuity of care)
  -- 2. Team-internal conversations they participate in
  -- 3. Team-about-client conversations
  (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
    AND (
      conversation_type IN ('client-direct', 'team-about-client')
      OR (
        conversation_type = 'team-internal'
        AND EXISTS (
          SELECT 1 FROM conversation_participants
          WHERE conversation_id = conversations.id
          AND user_id = auth.uid()
        )
      )
    )
  )
  OR
  -- Clients can only see conversations where they are a participant
  -- AND it's a client-direct type (not team-about-client)
  (
    conversation_type = 'client-direct'
    AND client_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND client_id = conversations.client_id
    )
  )
);

-- Team members can create conversations
-- Clients CANNOT create conversations (team must initiate)
CREATE POLICY "conversation_insert_policy" ON conversations
FOR INSERT TO authenticated
WITH CHECK (
  -- Only team members (users in users table) can create conversations
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
);

-- Participants can update conversations (status changes, etc.)
CREATE POLICY "conversation_update_policy" ON conversations
FOR UPDATE TO authenticated
USING (
  -- Team members can update any client conversation
  (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
    AND conversation_type IN ('client-direct', 'team-internal', 'team-about-client')
  )
);

-- ============================================================================
-- 4. UPDATE RLS POLICIES FOR MESSAGES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;

-- Team members can view all messages in client conversations
-- Clients can only view messages in their own conversations
CREATE POLICY "message_select_policy" ON messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      -- Team members can see messages in any client/team conversation
      (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
        AND c.conversation_type IN ('client-direct', 'team-internal', 'team-about-client')
      )
      OR
      -- Clients can only see messages in client-direct conversations they're part of
      (
        c.conversation_type = 'client-direct'
        AND c.client_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.client_id = c.client_id
        )
      )
    )
  )
);

-- Team members can send to any conversation they can view
-- Clients can only send to client-direct conversations they're part of
CREATE POLICY "message_insert_policy" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      -- Team members can send to any accessible conversation
      (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
        AND c.conversation_type IN ('client-direct', 'team-internal', 'team-about-client')
      )
      OR
      -- Clients can only send to their client-direct conversations
      (
        c.conversation_type = 'client-direct'
        AND c.client_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.client_id = c.client_id
        )
      )
    )
  )
);

-- Users can only edit their own messages
CREATE POLICY "message_update_policy" ON messages
FOR UPDATE TO authenticated
USING (
  -- Team members can edit their own messages
  (sender_user_id = auth.uid())
  OR
  -- Admins can edit any message
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Soft delete policy (same as update)
-- Note: We use soft deletes (is_deleted = true), not hard deletes

-- ============================================================================
-- 5. UPDATE RLS POLICIES FOR CONVERSATION_PARTICIPANTS
-- ============================================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can manage participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Team members can view participants in accessible conversations
CREATE POLICY "participant_select_policy" ON conversation_participants
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND (
      -- Team members can see participants in any client/team conversation
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
      OR
      -- Clients can see participants in their client-direct conversations
      (
        c.conversation_type = 'client-direct'
        AND c.client_id IS NOT NULL
        AND conversation_participants.client_id = c.client_id
      )
    )
  )
);

-- Only team members can add participants
CREATE POLICY "participant_insert_policy" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
);

-- Participants can update their own record (read status, mute settings)
CREATE POLICY "participant_update_policy" ON conversation_participants
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  -- Allow clients to update their own participant record
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.client_id IS NOT NULL
  )
);

-- ============================================================================
-- 6. HELPER FUNCTION: Check if user can access conversation
-- ============================================================================

CREATE OR REPLACE FUNCTION can_access_conversation(
  p_user_id UUID,
  p_client_id UUID,
  p_conversation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conversation_type TEXT;
  v_conversation_client_id UUID;
  v_is_team_member BOOLEAN;
BEGIN
  -- Get conversation details
  SELECT conversation_type, client_id
  INTO v_conversation_type, v_conversation_client_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if user is a team member
  v_is_team_member := EXISTS (SELECT 1 FROM users WHERE id = p_user_id);

  -- Team members can access all client/team conversations
  IF v_is_team_member THEN
    RETURN v_conversation_type IN ('client-direct', 'team-internal', 'team-about-client', 'direct', 'group');
  END IF;

  -- Clients can only access client-direct conversations they're part of
  IF p_client_id IS NOT NULL THEN
    RETURN v_conversation_type = 'client-direct'
      AND v_conversation_client_id = p_client_id;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. HELPER FUNCTION: Check if user can send message
-- ============================================================================

CREATE OR REPLACE FUNCTION can_send_message(
  p_user_id UUID,
  p_client_id UUID,
  p_conversation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conversation_type TEXT;
  v_conversation_client_id UUID;
  v_is_team_member BOOLEAN;
  v_is_participant BOOLEAN;
BEGIN
  -- Get conversation details
  SELECT conversation_type, client_id
  INTO v_conversation_type, v_conversation_client_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if user is a team member
  v_is_team_member := EXISTS (SELECT 1 FROM users WHERE id = p_user_id);

  -- Team members can send to any conversation they can access
  IF v_is_team_member THEN
    -- Check if they're a participant (for team-internal conversations)
    IF v_conversation_type = 'team-internal' THEN
      RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id
      );
    END IF;
    -- For client conversations, any team member can send
    RETURN v_conversation_type IN ('client-direct', 'team-about-client');
  END IF;

  -- Clients can only send to their client-direct conversations
  IF p_client_id IS NOT NULL THEN
    RETURN v_conversation_type = 'client-direct'
      AND v_conversation_client_id = p_client_id
      AND EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id
        AND client_id = p_client_id
      );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. INDEX FOR PERFORMANCE
-- ============================================================================

-- Index for conversation type filtering
CREATE INDEX IF NOT EXISTS idx_conversations_type
ON conversations(conversation_type);

-- Index for team conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_type_status
ON conversations(conversation_type, status)
WHERE status = 'active';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION can_access_conversation IS 'Checks if a user or client can access a specific conversation based on permissions';
COMMENT ON FUNCTION can_send_message IS 'Checks if a user or client can send messages to a specific conversation';
