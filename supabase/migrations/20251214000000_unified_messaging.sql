-- ============================================================================
-- Migration: Unified Messaging System
-- In-app messaging for doula-client communication
-- ============================================================================

-- ============================================================================
-- 1. CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversation metadata
  subject TEXT,
  conversation_type TEXT NOT NULL DEFAULT 'direct',

  -- Link to client (for easy querying)
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'active',
  is_archived BOOLEAN DEFAULT false,

  -- Last activity tracking (for sorting)
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT conversation_type_check
    CHECK (conversation_type IN ('direct', 'group', 'system')),
  CONSTRAINT conversation_status_check
    CHECK (status IN ('active', 'closed', 'archived'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status) WHERE status = 'active';

COMMENT ON TABLE conversations IS 'Message threads between doulas and clients';

-- ============================================================================
-- 2. CONVERSATION PARTICIPANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Participant can be either a user (admin/team) or a client
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Participant metadata
  role TEXT DEFAULT 'participant',
  display_name TEXT,

  -- Read tracking
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,

  -- Notification preferences for this conversation
  notifications_enabled BOOLEAN DEFAULT true,
  is_muted BOOLEAN DEFAULT false,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT participant_role_check
    CHECK (role IN ('owner', 'participant', 'observer')),
  CONSTRAINT participant_type_check
    CHECK (
      (user_id IS NOT NULL AND client_id IS NULL) OR
      (user_id IS NULL AND client_id IS NOT NULL)
    ),
  -- Ensure unique participation
  CONSTRAINT unique_user_conversation
    UNIQUE (conversation_id, user_id),
  CONSTRAINT unique_client_conversation
    UNIQUE (conversation_id, client_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id
  ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
  ON conversation_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_client_id
  ON conversation_participants(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread
  ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;

COMMENT ON TABLE conversation_participants IS 'Tracks who is part of each conversation';

-- ============================================================================
-- 3. MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender can be either a user (admin/team) or a client
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_client_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,

  -- Message content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',

  -- Attachments (stored as JSON array)
  attachments JSONB DEFAULT '[]',

  -- Message metadata
  is_system_message BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,

  -- For replies/threading
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Edit tracking
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  original_content TEXT,

  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT message_content_type_check
    CHECK (content_type IN ('text', 'html', 'markdown')),
  CONSTRAINT message_sender_check
    CHECK (
      is_system_message = true OR
      sender_user_id IS NOT NULL OR
      sender_client_id IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_user ON messages(sender_user_id) WHERE sender_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender_client ON messages(sender_client_id) WHERE sender_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON messages(conversation_id, created_at DESC) WHERE is_deleted = false;

COMMENT ON TABLE messages IS 'Individual messages within conversations';

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Authenticated users can see conversations they participate in
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

-- Conversations: Authenticated users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Conversations: Participants can update their conversations
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

-- Conversation Participants: Can see participants in their conversations
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Conversation Participants: Users can manage participants
CREATE POLICY "Users can manage participants"
  ON conversation_participants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Messages: Can view messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Messages: Can insert messages into their conversations
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Messages: Can update their own messages
CREATE POLICY "Users can edit their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_user_id = auth.uid());

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Update conversation's last_message_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_update_conversation ON messages;
CREATE TRIGGER message_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Increment unread count for other participants when message is sent
CREATE OR REPLACE FUNCTION increment_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND (
      (user_id IS NOT NULL AND user_id != NEW.sender_user_id) OR
      (client_id IS NOT NULL AND client_id != NEW.sender_client_id)
    )
    AND is_muted = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_increment_unread ON messages;
CREATE TRIGGER message_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.is_system_message = false)
  EXECUTE FUNCTION increment_unread_counts();

-- Log messaging activity
CREATE OR REPLACE FUNCTION log_message_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Get the client_id from the conversation
  SELECT client_id INTO v_client_id FROM conversations WHERE id = NEW.conversation_id;

  -- Only log if this conversation is linked to a client
  IF v_client_id IS NOT NULL AND NEW.is_system_message = false THEN
    INSERT INTO lead_activities (
      lead_id,
      activity_type,
      content,
      activity_category,
      related_record_type,
      related_record_id,
      created_by
    ) VALUES (
      v_client_id,
      'note',
      CASE
        WHEN NEW.sender_user_id IS NOT NULL THEN 'Message sent to client'
        ELSE 'Message received from client'
      END,
      'communication',
      'message',
      NEW.id,
      NEW.sender_user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_activity_log ON messages;
CREATE TRIGGER message_activity_log
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION log_message_activity();

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to mark messages as read and reset unread count
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update participant's last_read_at and reset unread count
  UPDATE conversation_participants
  SET
    last_read_at = NOW(),
    unread_count = 0
  WHERE conversation_id = p_conversation_id
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_client_id IS NOT NULL AND client_id = p_client_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total unread message count for a user
CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0)
  INTO total
  FROM conversation_participants
  WHERE user_id = p_user_id
    AND unread_count > 0;
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start or get existing conversation with a client
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
  -- Check for existing direct conversation with this client
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.client_id = p_client_id
    AND c.conversation_type = 'direct'
    AND c.status = 'active'
  LIMIT 1;

  -- If no conversation exists, create one
  IF v_conversation_id IS NULL THEN
    -- Get names for participants
    SELECT name INTO v_client_name FROM leads WHERE id = p_client_id;
    SELECT full_name INTO v_user_name FROM users WHERE id = p_user_id;

    -- Create conversation
    INSERT INTO conversations (client_id, subject, conversation_type)
    VALUES (p_client_id, COALESCE(p_subject, 'Direct Message'), 'direct')
    RETURNING id INTO v_conversation_id;

    -- Add client as participant
    INSERT INTO conversation_participants (conversation_id, client_id, display_name, role)
    VALUES (v_conversation_id, p_client_id, v_client_name, 'participant');

    -- Add user as participant
    INSERT INTO conversation_participants (conversation_id, user_id, display_name, role)
    VALUES (v_conversation_id, p_user_id, v_user_name, 'owner');
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. ENABLE REALTIME
-- ============================================================================

-- Enable realtime for messages table (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION mark_conversation_read IS 'Marks all messages in a conversation as read for a participant';
COMMENT ON FUNCTION get_user_unread_count IS 'Returns total unread message count for a user across all conversations';
COMMENT ON FUNCTION get_or_create_client_conversation IS 'Gets or creates a direct conversation with a client';
