-- ============================================================================
-- Migration: Fix get_or_create_client_conversation function
--
-- Issue: The function was looking for 'direct' type conversations but the
-- permissions migration changed existing ones to 'client-direct'. This caused
-- the function to create duplicate conversations and potentially fail due to
-- RLS policies expecting 'client-direct' type.
-- ============================================================================

-- Replace the function to:
-- 1. Look for existing conversations with EITHER 'direct' OR 'client-direct' type
-- 2. Create new conversations with 'client-direct' type (the modern, preferred type)
CREATE OR REPLACE FUNCTION get_or_create_client_conversation(
  p_client_id UUID,
  p_user_id UUID,
  p_subject TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_client_name TEXT;
  v_user_name TEXT;
BEGIN
  -- Check for existing conversation with this client (both legacy 'direct' and new 'client-direct')
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.client_id = p_client_id
    AND c.conversation_type IN ('direct', 'client-direct')
    AND c.status = 'active'
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT 1;

  -- If no conversation exists, create one with the new 'client-direct' type
  IF v_conversation_id IS NULL THEN
    -- Get names for participants
    SELECT name INTO v_client_name FROM leads WHERE id = p_client_id;
    SELECT full_name INTO v_user_name FROM users WHERE id = p_user_id;

    -- Create conversation with 'client-direct' type (modern type)
    INSERT INTO conversations (client_id, subject, conversation_type)
    VALUES (p_client_id, COALESCE(p_subject, 'Direct Message'), 'client-direct')
    RETURNING id INTO v_conversation_id;

    -- Add client as participant
    INSERT INTO conversation_participants (conversation_id, client_id, display_name, role)
    VALUES (v_conversation_id, p_client_id, v_client_name, 'participant');

    -- Add user as participant
    INSERT INTO conversation_participants (conversation_id, user_id, display_name, role)
    VALUES (v_conversation_id, p_user_id, v_user_name, 'owner');
  ELSE
    -- Ensure the initiating user is a participant (for continuity of care)
    -- This handles the case where a different team member starts a conversation
    INSERT INTO conversation_participants (conversation_id, user_id, display_name, role)
    SELECT
      v_conversation_id,
      p_user_id,
      (SELECT full_name FROM users WHERE id = p_user_id),
      'participant'
    WHERE NOT EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = v_conversation_id AND user_id = p_user_id
    );
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_client_conversation IS 'Gets or creates a client-direct conversation with a client. Supports both legacy "direct" and new "client-direct" conversation types for backwards compatibility.';
