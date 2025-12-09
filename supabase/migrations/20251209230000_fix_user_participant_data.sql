-- ============================================================================
-- Migration: Fix User and Participant Data
--
-- This migration fixes the issue where:
-- 1. The users table is empty (trigger didn't fire for existing users)
-- 2. team_members have null user_id (never linked to auth users)
-- 3. conversation_participants only have client participants (no team members)
--
-- This caused read receipts and unread badges to not work because:
-- - No user participant = no one to track "read" status for admin messages
-- - No user participant = increment_unread_counts trigger has no one to notify
-- ============================================================================

-- ============================================================================
-- 1. POPULATE USERS TABLE FROM AUTH.USERS
-- ============================================================================

-- Insert any missing users from auth.users
INSERT INTO public.users (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'admin'::user_role
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;

-- ============================================================================
-- 2. LINK TEAM MEMBERS TO AUTH USERS BY EMAIL
-- ============================================================================

-- Update team_members.user_id by matching email
UPDATE team_members tm
SET user_id = u.id
FROM users u
WHERE tm.email = u.email
  AND tm.user_id IS NULL;

-- ============================================================================
-- 3. ADD TEAM MEMBER PARTICIPANTS TO EXISTING CONVERSATIONS
-- ============================================================================

-- For each conversation that has a client participant but no team member participants,
-- add all active team members (with user_id) as participants

-- First, identify conversations missing team participants
WITH conversations_needing_team AS (
  SELECT DISTINCT c.id as conversation_id
  FROM conversations c
  WHERE c.conversation_type IN ('client-direct', 'direct')
    AND c.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
        AND cp.user_id IS NOT NULL
    )
),
-- Get team members with valid user_ids
active_team AS (
  SELECT tm.user_id, tm.display_name
  FROM team_members tm
  WHERE tm.is_active = true
    AND tm.user_id IS NOT NULL
)
-- Insert team participants for each conversation
INSERT INTO conversation_participants (conversation_id, user_id, display_name, role, unread_count)
SELECT
  cnt.conversation_id,
  at.user_id,
  at.display_name,
  'participant',
  -- Set unread_count based on number of unread messages from client
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = cnt.conversation_id
      AND m.sender_client_id IS NOT NULL  -- Message from client
  )
FROM conversations_needing_team cnt
CROSS JOIN active_team at
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Also handle conflict by client_id (shouldn't happen but be safe)
-- Note: The unique constraint might be on (conversation_id, user_id) AND (conversation_id, client_id)
-- so we need to make sure we're handling it correctly

-- ============================================================================
-- 4. FIX REALTIME PUBLICATION FOR CONVERSATION_PARTICIPANTS
-- ============================================================================

-- Ensure the table is part of the supabase_realtime publication
-- This allows subscriptions to receive UPDATE events
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Publication might not exist, that's OK
  NULL;
END
$$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After this migration:
-- - users table will have all auth users
-- - team_members.user_id will link to the correct auth user
-- - All client-direct conversations will have team member participants
-- - Real-time subscriptions should work for conversation_participants updates
-- ============================================================================
