-- =====================================================
-- PHASE 10: ENHANCE CRM RLS POLICIES WITH SHARING RULES
-- =====================================================
-- This migration updates the CRM table RLS policies to incorporate
-- the record-level sharing model (private, read, read_write, full_access).
--
-- The sharing model uses:
-- 1. Organization-Wide Defaults (OWD) from object_definitions.sharing_model
-- 2. Role Hierarchy (managers can see subordinates' records)
-- 3. Sharing Rules (criteria-based access grants)
-- 4. Manual Shares (ad-hoc sharing with users/roles)
--
-- The check_record_access function evaluates all these layers.
-- =====================================================

-- =====================================================
-- HELPER: Check if sharing is enabled for an object
-- =====================================================
CREATE OR REPLACE FUNCTION get_object_sharing_model(p_object_api_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_sharing_model TEXT;
BEGIN
  SELECT sharing_model INTO v_sharing_model
  FROM object_definitions
  WHERE api_name = p_object_api_name
  AND is_active = true;

  -- Default to 'read' (everyone in org can read) if not found
  RETURN COALESCE(v_sharing_model, 'read');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- HELPER: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = p_user_id
    AND (
      r.name = 'admin'
      OR r.permissions ? '*'
    )
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- HELPER: Check record access via sharing model
-- This is a simplified check for RLS policies
-- =====================================================
CREATE OR REPLACE FUNCTION can_access_crm_record(
  p_object_api_name TEXT,
  p_record_id UUID,
  p_record_owner_id UUID,
  p_record_org_id UUID,
  p_access_type TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_user_org_id UUID;
  v_user_role_id UUID;
  v_sharing_model TEXT;
  v_is_admin BOOLEAN;
  v_hierarchy_level INTEGER;
  v_owner_hierarchy_level INTEGER;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get user's organization and role
  SELECT organization_id, role_id INTO v_user_org_id, v_user_role_id
  FROM users WHERE id = v_user_id;

  -- Must be in same organization
  IF v_user_org_id IS DISTINCT FROM p_record_org_id THEN
    RETURN false;
  END IF;

  -- Admin always has access
  IF is_user_admin(v_user_id) THEN
    RETURN true;
  END IF;

  -- Owner always has access
  IF p_record_owner_id = v_user_id THEN
    RETURN true;
  END IF;

  -- Get the object's sharing model
  v_sharing_model := get_object_sharing_model(p_object_api_name);

  -- Check based on sharing model
  CASE v_sharing_model
    WHEN 'full_access' THEN
      -- Everyone in org has full access
      RETURN true;
    WHEN 'read_write' THEN
      -- Everyone in org can read and write
      RETURN true;
    WHEN 'read' THEN
      -- Everyone can read, only owner/shared can write
      IF p_access_type = 'read' THEN
        RETURN true;
      END IF;
    WHEN 'private' THEN
      -- Only owner or explicitly shared users can access
      NULL; -- Fall through to sharing rule checks
  END CASE;

  -- Check role hierarchy (managers can see subordinates' records)
  IF v_user_role_id IS NOT NULL AND p_record_owner_id IS NOT NULL THEN
    SELECT r.hierarchy_level INTO v_hierarchy_level
    FROM roles r WHERE r.id = v_user_role_id;

    SELECT r.hierarchy_level INTO v_owner_hierarchy_level
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = p_record_owner_id;

    -- Lower hierarchy level = higher rank (managers have lower numbers)
    IF v_hierarchy_level IS NOT NULL
       AND v_owner_hierarchy_level IS NOT NULL
       AND v_hierarchy_level < v_owner_hierarchy_level THEN
      RETURN true;
    END IF;
  END IF;

  -- Check manual shares
  IF EXISTS (
    SELECT 1 FROM manual_shares ms
    WHERE ms.object_api_name = p_object_api_name
    AND ms.record_id = p_record_id
    AND (ms.expires_at IS NULL OR ms.expires_at > NOW())
    AND (
      (ms.share_with_type = 'user' AND ms.share_with_id = v_user_id)
      OR (ms.share_with_type = 'role' AND ms.share_with_id = v_user_role_id)
    )
    AND (
      p_access_type = 'read'
      OR ms.access_level IN ('read_write', 'full_access')
    )
  ) THEN
    RETURN true;
  END IF;

  -- Check sharing rules (simplified - checks if any active rule grants access)
  IF EXISTS (
    SELECT 1 FROM sharing_rules sr
    WHERE sr.object_definition_id = (
      SELECT id FROM object_definitions WHERE api_name = p_object_api_name
    )
    AND sr.is_active = true
    AND (
      (sr.share_with_type = 'user' AND sr.share_with_id = v_user_id)
      OR (sr.share_with_type = 'role' AND sr.share_with_id = v_user_role_id)
    )
    AND (
      p_access_type = 'read'
      OR sr.access_level IN ('read_write', 'full_access')
    )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- DROP EXISTING POLICIES
-- =====================================================
DROP POLICY IF EXISTS "crm_contacts_select" ON crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_update" ON crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_delete" ON crm_contacts;

DROP POLICY IF EXISTS "crm_accounts_select" ON crm_accounts;
DROP POLICY IF EXISTS "crm_accounts_update" ON crm_accounts;
DROP POLICY IF EXISTS "crm_accounts_delete" ON crm_accounts;

DROP POLICY IF EXISTS "crm_leads_select" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads_update" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete" ON crm_leads;

DROP POLICY IF EXISTS "crm_opportunities_select" ON crm_opportunities;
DROP POLICY IF EXISTS "crm_opportunities_update" ON crm_opportunities;
DROP POLICY IF EXISTS "crm_opportunities_delete" ON crm_opportunities;

DROP POLICY IF EXISTS "crm_activities_select" ON crm_activities;
DROP POLICY IF EXISTS "crm_activities_update" ON crm_activities;
DROP POLICY IF EXISTS "crm_activities_delete" ON crm_activities;

-- =====================================================
-- NEW POLICIES: CRM_CONTACTS
-- =====================================================
CREATE POLICY "crm_contacts_select" ON crm_contacts
  FOR SELECT USING (
    can_access_crm_record('Contact', id, owner_id, organization_id, 'read')
  );

CREATE POLICY "crm_contacts_update" ON crm_contacts
  FOR UPDATE USING (
    can_access_crm_record('Contact', id, owner_id, organization_id, 'write')
  );

CREATE POLICY "crm_contacts_delete" ON crm_contacts
  FOR DELETE USING (
    -- Only owner or admin can delete
    owner_id = auth.uid()
    OR is_user_admin(auth.uid())
  );

-- =====================================================
-- NEW POLICIES: CRM_ACCOUNTS
-- =====================================================
CREATE POLICY "crm_accounts_select" ON crm_accounts
  FOR SELECT USING (
    can_access_crm_record('Account', id, owner_id, organization_id, 'read')
  );

CREATE POLICY "crm_accounts_update" ON crm_accounts
  FOR UPDATE USING (
    can_access_crm_record('Account', id, owner_id, organization_id, 'write')
  );

CREATE POLICY "crm_accounts_delete" ON crm_accounts
  FOR DELETE USING (
    owner_id = auth.uid()
    OR is_user_admin(auth.uid())
  );

-- =====================================================
-- NEW POLICIES: CRM_LEADS
-- =====================================================
CREATE POLICY "crm_leads_select" ON crm_leads
  FOR SELECT USING (
    can_access_crm_record('Lead', id, owner_id, organization_id, 'read')
  );

CREATE POLICY "crm_leads_update" ON crm_leads
  FOR UPDATE USING (
    can_access_crm_record('Lead', id, owner_id, organization_id, 'write')
  );

CREATE POLICY "crm_leads_delete" ON crm_leads
  FOR DELETE USING (
    owner_id = auth.uid()
    OR is_user_admin(auth.uid())
  );

-- =====================================================
-- NEW POLICIES: CRM_OPPORTUNITIES
-- =====================================================
CREATE POLICY "crm_opportunities_select" ON crm_opportunities
  FOR SELECT USING (
    can_access_crm_record('Opportunity', id, owner_id, organization_id, 'read')
  );

CREATE POLICY "crm_opportunities_update" ON crm_opportunities
  FOR UPDATE USING (
    can_access_crm_record('Opportunity', id, owner_id, organization_id, 'write')
  );

CREATE POLICY "crm_opportunities_delete" ON crm_opportunities
  FOR DELETE USING (
    owner_id = auth.uid()
    OR is_user_admin(auth.uid())
  );

-- =====================================================
-- NEW POLICIES: CRM_ACTIVITIES
-- =====================================================
CREATE POLICY "crm_activities_select" ON crm_activities
  FOR SELECT USING (
    can_access_crm_record('Activity', id, owner_id, organization_id, 'read')
  );

CREATE POLICY "crm_activities_update" ON crm_activities
  FOR UPDATE USING (
    can_access_crm_record('Activity', id, owner_id, organization_id, 'write')
  );

CREATE POLICY "crm_activities_delete" ON crm_activities
  FOR DELETE USING (
    owner_id = auth.uid()
    OR is_user_admin(auth.uid())
  );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION can_access_crm_record IS
'Evaluates record-level access based on sharing model, role hierarchy, sharing rules, and manual shares';

COMMENT ON FUNCTION get_object_sharing_model IS
'Returns the organization-wide default sharing model for a CRM object';

COMMENT ON FUNCTION is_user_admin IS
'Checks if a user has admin privileges';
