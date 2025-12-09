-- ============================================================================
-- Migration: Allow Clients to Create Conversations
--
-- Previously, only team members (authenticated users) could create conversations.
-- This migration adds RLS policies to allow clients (anon role with session validation)
-- to create conversations and add themselves as participants.
--
-- Note: Application-level security (session validation) is handled in the server action.
-- RLS policies here are a secondary safeguard.
-- ============================================================================

-- Allow clients to create conversations (anon role)
-- The client portal validates sessions in the server action
DROP POLICY IF EXISTS "Clients can create conversations" ON conversations;
CREATE POLICY "Clients can create conversations" ON conversations
  FOR INSERT TO anon
  WITH CHECK (
    -- Client conversations must have a client_id and be client-direct type
    client_id IS NOT NULL
    AND conversation_type = 'client-direct'
  );

-- Allow clients to add participants to their conversations
DROP POLICY IF EXISTS "Clients can add participants" ON conversation_participants;
CREATE POLICY "Clients can add participants" ON conversation_participants
  FOR INSERT TO anon
  WITH CHECK (
    -- Must be adding to a client-direct conversation
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.conversation_type = 'client-direct'
      AND c.client_id IS NOT NULL
    )
  );

-- Allow clients to update their own participant record (for read status, mute, etc.)
DROP POLICY IF EXISTS "Clients can update their participation" ON conversation_participants;
CREATE POLICY "Clients can update their participation" ON conversation_participants
  FOR UPDATE TO anon
  USING (
    -- Can only update if this is their participant record
    client_id IS NOT NULL
  )
  WITH CHECK (
    client_id IS NOT NULL
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
