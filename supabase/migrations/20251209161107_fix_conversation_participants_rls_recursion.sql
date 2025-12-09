-- Fix infinite recursion in conversation_participants RLS policies
-- The previous policy referenced the same table causing infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "participant_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participant_select_policy" ON conversation_participants;

-- Recreate SELECT policy without recursion
-- Team members can see all participants, clients can see their own conversations' participants
CREATE POLICY "participant_select_policy" ON conversation_participants
  FOR SELECT TO authenticated
  USING (
    -- Team members (authenticated users) can see all participants
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
    OR
    -- Or this is the user's own participation record
    user_id = auth.uid()
  );

-- Recreate UPDATE policy without recursion
-- Users can update their own participation (mark as read, mute, etc.)
CREATE POLICY "participant_update_policy" ON conversation_participants
  FOR UPDATE TO authenticated
  USING (
    -- Users can update their own participant record
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Fix client select policy - use conversation table instead of self-referencing
DROP POLICY IF EXISTS "Clients can view their participation" ON conversation_participants;
CREATE POLICY "Clients can view their participation" ON conversation_participants
  FOR SELECT TO anon
  USING (
    -- Client can view their own participation in client-direct conversations
    client_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.client_id = conversation_participants.client_id
      AND c.conversation_type IN ('client-direct', 'direct')
    )
  );

-- Also check and fix messages table policies if they have similar issues
DROP POLICY IF EXISTS "Clients can view messages in their conversations" ON messages;
CREATE POLICY "Clients can view messages in their conversations" ON messages
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.client_id IS NOT NULL
      AND c.conversation_type IN ('client-direct', 'direct')
    )
  );

DROP POLICY IF EXISTS "Clients can insert messages in their conversations" ON messages;
CREATE POLICY "Clients can insert messages in their conversations" ON messages
  FOR INSERT TO anon
  WITH CHECK (
    sender_client_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.client_id = messages.sender_client_id
      AND c.conversation_type IN ('client-direct', 'direct')
    )
  );

-- Verify conversations table policies don't have recursion issues
DROP POLICY IF EXISTS "Clients can view their conversations" ON conversations;
CREATE POLICY "Clients can view their conversations" ON conversations
  FOR SELECT TO anon
  USING (
    client_id IS NOT NULL
    AND conversation_type IN ('client-direct', 'direct')
  );
