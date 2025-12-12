-- ============================================================================
-- PHASE 11: Portal CRM Authentication Migration
-- ============================================================================
-- This migration switches client portal authentication from the legacy `leads`
-- table to the CRM tables (`crm_contacts` and `crm_leads`).
--
-- Changes:
-- 1. Add portal_access_enabled to crm_leads and crm_contacts
-- 2. Modify client_sessions to reference CRM records
-- 3. Update client_auth_tokens to work with CRM
-- 4. Add password_hash to CRM tables for password auth
-- ============================================================================

-- ============================================================================
-- 1. ADD PORTAL ACCESS COLUMNS TO CRM TABLES
-- ============================================================================

-- Add portal access flag to crm_leads
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false;

-- Add portal access flag to crm_contacts
ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false;

-- Add password hash columns for password authentication
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add indexes for portal access queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_portal_access
ON crm_leads(email, portal_access_enabled)
WHERE portal_access_enabled = true;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_portal_access
ON crm_contacts(email, portal_access_enabled)
WHERE portal_access_enabled = true;

COMMENT ON COLUMN crm_leads.portal_access_enabled IS 'Whether this lead can access the client portal';
COMMENT ON COLUMN crm_contacts.portal_access_enabled IS 'Whether this contact can access the client portal';
COMMENT ON COLUMN crm_leads.password_hash IS 'Bcrypt hash of client password for portal login';
COMMENT ON COLUMN crm_contacts.password_hash IS 'Bcrypt hash of client password for portal login';

-- ============================================================================
-- 2. MODIFY CLIENT_SESSIONS FOR CRM
-- ============================================================================

-- Add new CRM reference columns
ALTER TABLE client_sessions
ADD COLUMN IF NOT EXISTS crm_record_type TEXT CHECK (crm_record_type IN ('lead', 'contact'));

ALTER TABLE client_sessions
ADD COLUMN IF NOT EXISTS crm_record_id UUID;

-- Create index for CRM lookups
CREATE INDEX IF NOT EXISTS idx_client_sessions_crm_record
ON client_sessions(crm_record_type, crm_record_id);

COMMENT ON COLUMN client_sessions.crm_record_type IS 'Type of CRM record: lead or contact';
COMMENT ON COLUMN client_sessions.crm_record_id IS 'UUID of the CRM record (crm_leads.id or crm_contacts.id)';

-- ============================================================================
-- 3. MODIFY CLIENT_AUTH_TOKENS FOR CRM
-- ============================================================================

-- Check if client_auth_tokens exists and modify it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_auth_tokens') THEN
    -- Add CRM reference columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'client_auth_tokens' AND column_name = 'crm_record_type') THEN
      ALTER TABLE client_auth_tokens
      ADD COLUMN crm_record_type TEXT CHECK (crm_record_type IN ('lead', 'contact'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'client_auth_tokens' AND column_name = 'crm_record_id') THEN
      ALTER TABLE client_auth_tokens
      ADD COLUMN crm_record_id UUID;
    END IF;

    -- Create index for CRM lookups
    CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_crm_record
    ON client_auth_tokens(crm_record_type, crm_record_id);
  END IF;
END $$;

-- ============================================================================
-- 4. HELPER FUNCTION TO FIND CRM CLIENT BY EMAIL
-- ============================================================================

CREATE OR REPLACE FUNCTION find_crm_client_by_email(
  p_email TEXT,
  p_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
  record_type TEXT,
  record_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  portal_access_enabled BOOLEAN,
  password_hash TEXT
) AS $$
BEGIN
  -- First check crm_contacts (converted customers take priority)
  RETURN QUERY
  SELECT
    'contact'::TEXT as record_type,
    c.id as record_id,
    c.first_name,
    c.last_name,
    c.email,
    c.portal_access_enabled,
    c.password_hash
  FROM crm_contacts c
  WHERE c.email ILIKE p_email
    AND c.portal_access_enabled = true
    AND (p_organization_id IS NULL OR c.organization_id = p_organization_id)
  LIMIT 1;

  -- If no contact found, check crm_leads
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      'lead'::TEXT as record_type,
      l.id as record_id,
      l.first_name,
      l.last_name,
      l.email,
      l.portal_access_enabled,
      l.password_hash
    FROM crm_leads l
    WHERE l.email ILIKE p_email
      AND l.portal_access_enabled = true
      AND l.is_converted = false  -- Don't allow login as converted lead
      AND (p_organization_id IS NULL OR l.organization_id = p_organization_id)
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_crm_client_by_email IS 'Find a CRM client (contact or lead) by email for portal authentication. Contacts take priority over leads.';

-- ============================================================================
-- 5. GRANT PORTAL ACCESS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_portal_access(
  p_record_type TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := false;
BEGIN
  IF p_record_type = 'contact' THEN
    UPDATE crm_contacts
    SET portal_access_enabled = true,
        updated_at = NOW()
    WHERE id = p_record_id;
    v_updated := FOUND;
  ELSIF p_record_type = 'lead' THEN
    UPDATE crm_leads
    SET portal_access_enabled = true,
        updated_at = NOW()
    WHERE id = p_record_id;
    v_updated := FOUND;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. REVOKE PORTAL ACCESS FUNCTION (invalidates sessions too)
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_portal_access(
  p_record_type TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := false;
BEGIN
  -- Revoke access
  IF p_record_type = 'contact' THEN
    UPDATE crm_contacts
    SET portal_access_enabled = false,
        updated_at = NOW()
    WHERE id = p_record_id;
    v_updated := FOUND;
  ELSIF p_record_type = 'lead' THEN
    UPDATE crm_leads
    SET portal_access_enabled = false,
        updated_at = NOW()
    WHERE id = p_record_id;
    v_updated := FOUND;
  END IF;

  -- Invalidate all sessions for this CRM record
  IF v_updated THEN
    DELETE FROM client_sessions
    WHERE crm_record_type = p_record_type
      AND crm_record_id = p_record_id;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GET CRM CLIENT SESSION DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION get_crm_client_data(
  p_record_type TEXT,
  p_record_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_record_type = 'contact' THEN
    SELECT jsonb_build_object(
      'record_type', 'contact',
      'id', c.id,
      'first_name', c.first_name,
      'last_name', c.last_name,
      'email', c.email,
      'phone', c.phone,
      'mobile_phone', c.mobile_phone,
      'mailing_street', c.mailing_street,
      'mailing_city', c.mailing_city,
      'mailing_state', c.mailing_state,
      'mailing_postal_code', c.mailing_postal_code,
      'partner_name', c.partner_name,
      'expected_due_date', c.expected_due_date,
      'actual_birth_date', c.actual_birth_date,
      'account_id', c.account_id,
      'lead_source', c.lead_source,
      'portal_access_enabled', c.portal_access_enabled,
      'created_at', c.created_at
    ) INTO v_result
    FROM crm_contacts c
    WHERE c.id = p_record_id;
  ELSIF p_record_type = 'lead' THEN
    SELECT jsonb_build_object(
      'record_type', 'lead',
      'id', l.id,
      'first_name', l.first_name,
      'last_name', l.last_name,
      'email', l.email,
      'phone', l.phone,
      'lead_status', l.lead_status,
      'lead_source', l.lead_source,
      'service_interest', l.service_interest,
      'expected_due_date', l.expected_due_date,
      'message', l.message,
      'portal_access_enabled', l.portal_access_enabled,
      'created_at', l.created_at
    ) INTO v_result
    FROM crm_leads l
    WHERE l.id = p_record_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_crm_client_data IS 'Get client data from CRM for portal session';

-- ============================================================================
-- 8. CLEANUP: DROP OLD CONSTRAINT (defer to allow gradual migration)
-- ============================================================================

-- Note: We keep the old client_id column for now to support gradual migration
-- Once all sessions are using CRM references, run:
-- ALTER TABLE client_sessions DROP CONSTRAINT client_sessions_client_id_fkey;
-- ALTER TABLE client_sessions DROP COLUMN client_id;

-- For now, make client_id nullable to support new CRM-based sessions
ALTER TABLE client_sessions
ALTER COLUMN client_id DROP NOT NULL;

-- ============================================================================
-- 9. INDEX FOR PERFORMANCE
-- ============================================================================

-- Ensure we have good indexes for portal login queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_email_lower
ON crm_leads(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email_lower
ON crm_contacts(LOWER(email));
