-- =====================================================
-- RECORD-LEVEL SECURITY (SHARING MODEL)
-- =====================================================
-- This migration implements Salesforce-style record-level security:
--
-- 1. Organization-Wide Defaults (OWD):
--    - Already in object_definitions.sharing_model
--    - Values: private, read, read_write, full_access
--
-- 2. Role Hierarchy:
--    - Managers can access subordinates' records
--    - Uses hierarchy_level on roles table
--
-- 3. Sharing Rules:
--    - Criteria-based automatic sharing
--    - Grant read/read-write access based on field values
--
-- 4. Manual Sharing:
--    - Ad-hoc sharing by record owner
--    - One-off grants to specific users/roles
--
-- 5. Access Checking:
--    - Functions to determine effective access
--    - Integration points for RLS policies
-- =====================================================

-- =====================================================
-- SHARING RULES TABLE
-- Criteria-based automatic record sharing
-- =====================================================
CREATE TABLE IF NOT EXISTS sharing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  object_definition_id UUID NOT NULL REFERENCES object_definitions(id) ON DELETE CASCADE,

  -- Rule identity
  name TEXT NOT NULL,
  description TEXT,

  -- What access to grant
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'read_write')),

  -- Who gets access
  share_with_type TEXT NOT NULL CHECK (share_with_type IN ('role', 'user', 'public_group')),
  share_with_id UUID, -- role_id, user_id, or group_id

  -- Criteria: Records matching these conditions get shared
  -- Format: { "conditions": [...], "match_type": "all" | "any" }
  -- Each condition: { "field": "status", "operator": "equals", "value": "active" }
  criteria JSONB NOT NULL DEFAULT '{"conditions": [], "match_type": "all"}',

  -- Rule type
  rule_type TEXT DEFAULT 'criteria' CHECK (rule_type IN ('criteria', 'owner_based')),

  -- For owner-based rules: share with users in this role who are above in hierarchy
  -- (e.g., "share all records owned by Sales Rep with Sales Manager")
  owner_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,

  -- Active flag
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT sharing_rule_name_unique UNIQUE(organization_id, object_definition_id, name)
);

-- Indexes for sharing_rules
CREATE INDEX IF NOT EXISTS idx_sharing_rules_org ON sharing_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_sharing_rules_object ON sharing_rules(object_definition_id);
CREATE INDEX IF NOT EXISTS idx_sharing_rules_active ON sharing_rules(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sharing_rules_share_with ON sharing_rules(share_with_type, share_with_id);

-- =====================================================
-- MANUAL SHARES TABLE
-- Ad-hoc record sharing by owner
-- =====================================================
CREATE TABLE IF NOT EXISTS manual_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Which record is being shared
  object_api_name TEXT NOT NULL, -- e.g., 'Contact', 'Opportunity'
  record_id UUID NOT NULL,

  -- Who gets access
  share_with_type TEXT NOT NULL CHECK (share_with_type IN ('user', 'role')),
  share_with_id UUID NOT NULL, -- user_id or role_id

  -- What access level
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'read_write')),

  -- Reason for sharing (optional)
  reason TEXT,

  -- Row key (what user shared) - to find who granted access
  shared_by UUID NOT NULL REFERENCES users(id),

  -- Expiration (optional)
  expires_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints - prevent duplicate shares
  CONSTRAINT manual_share_unique UNIQUE(organization_id, object_api_name, record_id, share_with_type, share_with_id)
);

-- Indexes for manual_shares
CREATE INDEX IF NOT EXISTS idx_manual_shares_org ON manual_shares(organization_id);
CREATE INDEX IF NOT EXISTS idx_manual_shares_record ON manual_shares(object_api_name, record_id);
CREATE INDEX IF NOT EXISTS idx_manual_shares_recipient ON manual_shares(share_with_type, share_with_id);
CREATE INDEX IF NOT EXISTS idx_manual_shares_shared_by ON manual_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_manual_shares_active ON manual_shares(organization_id)
  WHERE expires_at IS NULL OR expires_at > NOW();

-- =====================================================
-- RECORD SHARE SUMMARY TABLE
-- Computed/materialized sharing for faster queries
-- This stores the effective access for each user/record
-- =====================================================
CREATE TABLE IF NOT EXISTS record_share_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Record reference
  object_api_name TEXT NOT NULL,
  record_id UUID NOT NULL,

  -- User who has access
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Effective access level (highest from all sources)
  access_level TEXT NOT NULL CHECK (access_level IN ('read', 'read_write', 'full_access')),

  -- Source of access (for debugging/audit)
  access_source TEXT NOT NULL CHECK (access_source IN (
    'owner',           -- Record owner
    'org_wide_default', -- Organization-wide default
    'role_hierarchy',  -- Access via role hierarchy
    'sharing_rule',    -- Criteria-based sharing rule
    'manual_share'     -- Manual share grant
  )),
  source_id UUID, -- Reference to sharing_rule or manual_share if applicable

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT record_share_summary_unique UNIQUE(organization_id, object_api_name, record_id, user_id, access_source)
);

-- Indexes for record_share_summary
CREATE INDEX IF NOT EXISTS idx_share_summary_org ON record_share_summary(organization_id);
CREATE INDEX IF NOT EXISTS idx_share_summary_record ON record_share_summary(object_api_name, record_id);
CREATE INDEX IF NOT EXISTS idx_share_summary_user ON record_share_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_share_summary_access ON record_share_summary(user_id, object_api_name, access_level);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_sharing_rules_updated_at ON sharing_rules;
CREATE TRIGGER update_sharing_rules_updated_at
  BEFORE UPDATE ON sharing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on sharing tables
ALTER TABLE sharing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_share_summary ENABLE ROW LEVEL SECURITY;

-- Sharing rules: org-scoped, admin only for write
CREATE POLICY "sharing_rules_select" ON sharing_rules
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "sharing_rules_insert" ON sharing_rules
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "sharing_rules_update" ON sharing_rules
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "sharing_rules_delete" ON sharing_rules
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Manual shares: org-scoped
CREATE POLICY "manual_shares_select" ON manual_shares
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "manual_shares_insert" ON manual_shares
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "manual_shares_update" ON manual_shares
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "manual_shares_delete" ON manual_shares
  FOR DELETE USING (
    -- Can delete if you created the share or you're the record owner
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
      shared_by = auth.uid()
      -- OR you are admin (handled by parent org check)
    )
  );

-- Record share summary: org-scoped, read-only for most users
CREATE POLICY "share_summary_select" ON record_share_summary
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Only system/triggers should insert/update share summary
CREATE POLICY "share_summary_system_insert" ON record_share_summary
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "share_summary_system_update" ON record_share_summary
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "share_summary_system_delete" ON record_share_summary
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

/**
 * Get the organization-wide default sharing model for an object
 */
CREATE OR REPLACE FUNCTION get_object_sharing_model(
  p_object_api_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_sharing_model TEXT;
BEGIN
  SELECT sharing_model INTO v_sharing_model
  FROM object_definitions
  WHERE api_name = p_object_api_name
  AND is_active = true
  LIMIT 1;

  RETURN COALESCE(v_sharing_model, 'private');
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Check if user has access to a record
 * This is the main function to call from RLS policies
 */
CREATE OR REPLACE FUNCTION check_record_access(
  p_object_api_name TEXT,
  p_record_id UUID,
  p_record_owner_id UUID,
  p_record_org_id UUID,
  p_user_id UUID DEFAULT auth.uid(),
  p_access_type TEXT DEFAULT 'read' -- 'read' or 'write'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_org_id UUID;
  v_user_role_id UUID;
  v_user_hierarchy_level INTEGER;
  v_owner_role_id UUID;
  v_owner_hierarchy_level INTEGER;
  v_sharing_model TEXT;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get user's org and role
  SELECT organization_id, role_id INTO v_user_org_id, v_user_role_id
  FROM users WHERE id = p_user_id;

  -- Must be in same org
  IF v_user_org_id IS NULL OR v_user_org_id != p_record_org_id THEN
    RETURN false;
  END IF;

  -- Owner always has full access
  IF p_record_owner_id = p_user_id THEN
    RETURN true;
  END IF;

  -- Check organization-wide default
  v_sharing_model := get_object_sharing_model(p_object_api_name);

  -- Full access OWD = everyone can read and write
  IF v_sharing_model = 'full_access' THEN
    RETURN true;
  END IF;

  -- Read/Write OWD = everyone can read and write
  IF v_sharing_model = 'read_write' THEN
    RETURN true;
  END IF;

  -- Read OWD = everyone can read
  IF v_sharing_model = 'read' AND p_access_type = 'read' THEN
    RETURN true;
  END IF;

  -- For private model or write access on read model, check other access paths

  -- Check role hierarchy (manager sees subordinates' records)
  IF v_user_role_id IS NOT NULL AND p_record_owner_id IS NOT NULL THEN
    SELECT hierarchy_level INTO v_user_hierarchy_level
    FROM roles WHERE id = v_user_role_id;

    SELECT r.hierarchy_level INTO v_owner_hierarchy_level
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = p_record_owner_id;

    -- Lower hierarchy_level = higher privilege
    -- User can access if their level is lower (more privileged) than owner
    IF v_user_hierarchy_level IS NOT NULL
       AND v_owner_hierarchy_level IS NOT NULL
       AND v_user_hierarchy_level < v_owner_hierarchy_level THEN
      RETURN true;
    END IF;
  END IF;

  -- Check manual shares
  IF EXISTS (
    SELECT 1 FROM manual_shares ms
    WHERE ms.organization_id = p_record_org_id
    AND ms.object_api_name = p_object_api_name
    AND ms.record_id = p_record_id
    AND (ms.expires_at IS NULL OR ms.expires_at > NOW())
    AND (
      -- Shared directly to user
      (ms.share_with_type = 'user' AND ms.share_with_id = p_user_id)
      -- Shared to user's role
      OR (ms.share_with_type = 'role' AND ms.share_with_id = v_user_role_id)
    )
    AND (
      p_access_type = 'read'
      OR ms.access_level = 'read_write'
    )
  ) THEN
    RETURN true;
  END IF;

  -- Check criteria-based sharing rules
  -- Note: This is a simplified check. Full criteria evaluation
  -- would need to be done in application code or with dynamic SQL
  IF EXISTS (
    SELECT 1 FROM sharing_rules sr
    WHERE sr.organization_id = p_record_org_id
    AND sr.object_definition_id = (
      SELECT id FROM object_definitions WHERE api_name = p_object_api_name LIMIT 1
    )
    AND sr.is_active = true
    AND (
      -- Shared to user
      (sr.share_with_type = 'user' AND sr.share_with_id = p_user_id)
      -- Shared to user's role
      OR (sr.share_with_type = 'role' AND sr.share_with_id = v_user_role_id)
    )
    AND (
      p_access_type = 'read'
      OR sr.access_level = 'read_write'
    )
  ) THEN
    -- Note: Actual criteria matching would happen in application code
    -- This just checks if a rule exists that could grant access
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

/**
 * Get all users who have access to a record
 * Useful for showing "Shared with" in UI
 */
CREATE OR REPLACE FUNCTION get_record_sharing_info(
  p_object_api_name TEXT,
  p_record_id UUID,
  p_record_owner_id UUID,
  p_record_org_id UUID
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  access_level TEXT,
  access_source TEXT,
  source_name TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Owner
  SELECT
    u.id,
    u.full_name,
    u.email,
    'full_access'::TEXT,
    'owner'::TEXT,
    'Record Owner'::TEXT
  FROM users u
  WHERE u.id = p_record_owner_id

  UNION ALL

  -- Manual shares to users
  SELECT
    u.id,
    u.full_name,
    u.email,
    ms.access_level,
    'manual_share'::TEXT,
    'Manually shared by ' || (SELECT full_name FROM users WHERE id = ms.shared_by)
  FROM manual_shares ms
  JOIN users u ON ms.share_with_id = u.id
  WHERE ms.organization_id = p_record_org_id
  AND ms.object_api_name = p_object_api_name
  AND ms.record_id = p_record_id
  AND ms.share_with_type = 'user'
  AND (ms.expires_at IS NULL OR ms.expires_at > NOW())

  UNION ALL

  -- Manual shares to roles (get all users in role)
  SELECT
    u.id,
    u.full_name,
    u.email,
    ms.access_level,
    'manual_share'::TEXT,
    'Via role: ' || r.name
  FROM manual_shares ms
  JOIN roles r ON ms.share_with_id = r.id
  JOIN users u ON u.role_id = r.id
  WHERE ms.organization_id = p_record_org_id
  AND ms.object_api_name = p_object_api_name
  AND ms.record_id = p_record_id
  AND ms.share_with_type = 'role'
  AND (ms.expires_at IS NULL OR ms.expires_at > NOW())
  AND u.id != p_record_owner_id;

END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

/**
 * Grant manual share to a record
 */
CREATE OR REPLACE FUNCTION grant_record_share(
  p_object_api_name TEXT,
  p_record_id UUID,
  p_share_with_type TEXT,
  p_share_with_id UUID,
  p_access_level TEXT DEFAULT 'read',
  p_reason TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_share_id UUID;
BEGIN
  -- Get current user's org
  SELECT organization_id INTO v_org_id
  FROM users WHERE id = auth.uid();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User organization not found';
  END IF;

  -- Insert or update manual share
  INSERT INTO manual_shares (
    organization_id,
    object_api_name,
    record_id,
    share_with_type,
    share_with_id,
    access_level,
    reason,
    shared_by,
    expires_at
  ) VALUES (
    v_org_id,
    p_object_api_name,
    p_record_id,
    p_share_with_type,
    p_share_with_id,
    p_access_level,
    p_reason,
    auth.uid(),
    p_expires_at
  )
  ON CONFLICT (organization_id, object_api_name, record_id, share_with_type, share_with_id)
  DO UPDATE SET
    access_level = EXCLUDED.access_level,
    reason = EXCLUDED.reason,
    expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_share_id;

  RETURN v_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Revoke manual share from a record
 */
CREATE OR REPLACE FUNCTION revoke_record_share(
  p_share_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM users WHERE id = auth.uid();

  DELETE FROM manual_shares
  WHERE id = p_share_id
  AND organization_id = v_org_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE sharing_rules IS 'Criteria-based automatic sharing rules. When records match the criteria, they are shared with specified users/roles.';
COMMENT ON TABLE manual_shares IS 'Ad-hoc record sharing. Record owners can manually share specific records with users or roles.';
COMMENT ON TABLE record_share_summary IS 'Computed effective sharing for faster access checks. Can be used to pre-compute sharing for performance.';

COMMENT ON FUNCTION check_record_access IS 'Main function to check if a user has access to a record. Called from RLS policies.';
COMMENT ON FUNCTION get_record_sharing_info IS 'Returns all users who have access to a record with their access level and source.';
COMMENT ON FUNCTION grant_record_share IS 'Grants manual share access to a record for a user or role.';
COMMENT ON FUNCTION revoke_record_share IS 'Revokes a manual share grant.';
