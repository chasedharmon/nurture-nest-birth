-- Phase 3.2 Database Migration: Client Portal Authentication
-- This migration adds client authentication via magic links

-- ============================================================================
-- 1. CLIENT AUTH TOKENS TABLE
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

-- Indexes for client_auth_tokens
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_token ON client_auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_client_id ON client_auth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_expires_at ON client_auth_tokens(expires_at);

-- ============================================================================
-- 2. EXTEND LEADS TABLE FOR CLIENT AUTH
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- ============================================================================
-- 3. RLS POLICIES FOR CLIENT ACCESS
-- ============================================================================

-- Note: Client authentication will use a custom session approach
-- We'll store client_id in a cookie and validate it server-side

-- Clients can read their own lead record
CREATE POLICY "Clients can view own record"
  ON leads FOR SELECT
  USING (
    -- This will be validated server-side via session
    id = current_setting('app.current_client_id', true)::UUID
  );

-- Clients can update their own limited fields
CREATE POLICY "Clients can update own profile"
  ON leads FOR UPDATE
  USING (
    id = current_setting('app.current_client_id', true)::UUID
  )
  WITH CHECK (
    id = current_setting('app.current_client_id', true)::UUID
  );

-- Clients can read their own services
CREATE POLICY "Clients can view own services"
  ON client_services FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
  );

-- Clients can read their own meetings
CREATE POLICY "Clients can view own meetings"
  ON meetings FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
  );

-- Clients can read their own client-visible documents
CREATE POLICY "Clients can view own visible documents"
  ON client_documents FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
    AND is_client_visible = true
  );

-- Clients can read their own payments
CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
  );

-- Clients can read their own client-visible activities
CREATE POLICY "Clients can view own visible activities"
  ON lead_activities FOR SELECT
  USING (
    lead_id = current_setting('app.current_client_id', true)::UUID
    AND is_client_visible = true
  );

-- ============================================================================
-- 4. FUNCTION TO CLEAN UP EXPIRED TOKENS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_client_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM client_auth_tokens
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. RLS FOR CLIENT AUTH TOKENS (Admin only)
-- ============================================================================

ALTER TABLE client_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage tokens (system creates them via server actions)
CREATE POLICY "Admins can manage client auth tokens"
  ON client_auth_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE client_auth_tokens IS 'Magic link authentication tokens for client portal access';
COMMENT ON SCHEMA public IS 'Phase 3.2 Migration - Client Portal Auth (20251207030000)';
