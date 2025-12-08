-- ============================================================================
-- Roles & Permissions System
-- ============================================================================

-- Roles table for granular access control
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,  -- Cannot delete system roles
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Anyone can read roles (needed for role selection)
CREATE POLICY "roles_select_policy" ON roles
  FOR SELECT TO authenticated USING (true);

-- Only admins can modify roles
CREATE POLICY "roles_insert_policy" ON roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "roles_update_policy" ON roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "roles_delete_policy" ON roles
  FOR DELETE TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default system roles
INSERT INTO roles (name, description, is_system, permissions) VALUES
(
  'admin',
  'Full system access - can manage all aspects of the CRM',
  true,
  '{"*": ["*"]}'::jsonb
),
(
  'provider',
  'Doula provider access - can manage their clients and appointments',
  true,
  '{
    "leads": ["read", "update"],
    "clients": ["read", "update"],
    "meetings": ["create", "read", "update", "delete"],
    "invoices": ["read"],
    "documents": ["create", "read", "update", "delete"],
    "services": ["read"],
    "reports": ["read"],
    "dashboards": ["read"]
  }'::jsonb
),
(
  'viewer',
  'Read-only access - can view data but not modify',
  true,
  '{
    "leads": ["read"],
    "clients": ["read"],
    "meetings": ["read"],
    "invoices": ["read"],
    "documents": ["read"],
    "services": ["read"],
    "reports": ["read"],
    "dashboards": ["read"]
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Extend users table
-- ============================================================================

-- Add role_id to users table (references the new roles table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- Add is_active flag for soft disable
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Track invitation info
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Track last login
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Set default role_id for existing admin users
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE role = 'admin' AND role_id IS NULL;

-- ============================================================================
-- User Invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  team_member_id UUID REFERENCES team_members(id),
  invited_by UUID REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations
CREATE POLICY "user_invitations_select_policy" ON user_invitations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "user_invitations_insert_policy" ON user_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "user_invitations_update_policy" ON user_invitations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "user_invitations_delete_policy" ON user_invitations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);

-- ============================================================================
-- Add drill_down_report_id to dashboard_widgets
-- ============================================================================

ALTER TABLE dashboard_widgets
ADD COLUMN IF NOT EXISTS drill_down_report_id UUID REFERENCES reports(id);

-- ============================================================================
-- Update timestamp trigger for roles
-- ============================================================================

CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roles_updated_at ON roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();
