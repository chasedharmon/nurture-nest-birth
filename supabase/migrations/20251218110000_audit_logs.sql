-- ============================================================================
-- Migration: Audit Logs Table
-- Creates audit_logs table for tracking user actions across the platform
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL,           -- create, read, update, delete, login, export, etc.
  entity_type TEXT NOT NULL,      -- lead, invoice, user, organization, etc.
  entity_id UUID,                 -- ID of the affected record

  -- Change tracking
  old_values JSONB,               -- Previous values (for updates)
  new_values JSONB,               -- New values (for creates/updates)

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Index for filtering by date range (common for audit reports)
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Audit trail of user actions for compliance and debugging. Retention: 90 days default.';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: create, read, update, delete, login, logout, export, import, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected: lead, invoice, user, meeting, payment, contract, etc.';

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for their organization
CREATE POLICY "Users can view org audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

-- Service role can insert audit logs (from server actions)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- This is intentional - audit logs should never be modified

-- ============================================================================
-- Configuration table for retention settings
-- ============================================================================

-- Add audit_log_retention_days to organizations settings
-- Default 90 days, but can be customized per organization
DO $$
BEGIN
  -- Update existing organizations to have default retention in settings
  UPDATE organizations
  SET settings = COALESCE(settings, '{}'::jsonb) || '{"audit_log_retention_days": 90}'::jsonb
  WHERE NOT (settings ? 'audit_log_retention_days');
END $$;

COMMENT ON COLUMN organizations.settings IS 'Organization settings including audit_log_retention_days (default: 90)';
