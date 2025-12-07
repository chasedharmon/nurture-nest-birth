-- Phase 3.2 Safe Migration (handles existing objects)
-- Run this if the original migration partially failed

-- ============================================================================
-- 1. CREATE CLIENT AUTH TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_token ON client_auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_client_id ON client_auth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_expires_at ON client_auth_tokens(expires_at);

-- ============================================================================
-- 2. EXTEND LEADS TABLE
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- ============================================================================
-- 3. RLS POLICIES (DROP EXISTING FIRST)
-- ============================================================================

-- Drop existing client policies if they exist
DROP POLICY IF EXISTS "Clients can view own record" ON leads;
DROP POLICY IF EXISTS "Clients can view own services" ON client_services;
DROP POLICY IF EXISTS "Clients can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Clients can view own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can view own payments" ON payments;
DROP POLICY IF EXISTS "Clients can view own activities" ON lead_activities;

-- Create new client policies
CREATE POLICY "Clients can view own record"
  ON leads FOR SELECT
  USING (
    id = current_setting('app.current_client_id', true)::UUID
  );

CREATE POLICY "Clients can view own services"
  ON client_services FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
  );

CREATE POLICY "Clients can view own meetings"
  ON meetings FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
  );

CREATE POLICY "Clients can view own documents"
  ON client_documents FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
    AND is_client_visible = true
  );

CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
  );

CREATE POLICY "Clients can view own activities"
  ON lead_activities FOR SELECT
  USING (
    lead_id = current_setting('app.current_client_id', true)::UUID
    AND is_client_visible = true
  );

-- ============================================================================
-- 4. RLS POLICIES FOR CLIENT_AUTH_TOKENS (ADMIN ONLY)
-- ============================================================================

ALTER TABLE client_auth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can view all tokens" ON client_auth_tokens;
DROP POLICY IF EXISTS "Admin users can insert tokens" ON client_auth_tokens;
DROP POLICY IF EXISTS "Admin users can update tokens" ON client_auth_tokens;
DROP POLICY IF EXISTS "Admin users can delete tokens" ON client_auth_tokens;

CREATE POLICY "Admin users can view all tokens"
  ON client_auth_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert tokens"
  ON client_auth_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update tokens"
  ON client_auth_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete tokens"
  ON client_auth_tokens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 5. CLEANUP FUNCTION FOR EXPIRED TOKENS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM client_auth_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Phase 3.2 migration completed successfully!' as status;
