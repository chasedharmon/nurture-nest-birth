-- =====================================================
-- NAVIGATION CONFIGURATION
-- =====================================================
-- This migration creates the navigation_config table
-- that powers the dynamic admin portal navigation.
--
-- Key features:
-- - Per-organization navigation customization
-- - Support for standard and custom objects
-- - Role-based visibility
-- - Tool items (Reports, Dashboards, etc.)
-- - Future: App launcher support via app_id
-- =====================================================

-- =====================================================
-- NAVIGATION CONFIG TABLE
-- Stores navigation items per organization
-- =====================================================
CREATE TABLE IF NOT EXISTS navigation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- What to show (nullable for non-object items like Reports, Messages)
  object_definition_id UUID REFERENCES object_definitions(id) ON DELETE CASCADE,

  -- For non-object navigation items (reports, dashboards, messages, etc.)
  -- When object_definition_id is NULL, these define the nav item
  item_type TEXT, -- 'object', 'tool', 'external_link'
  item_key TEXT,  -- 'reports', 'dashboards', 'messages', 'workflows', 'team', 'setup'
  item_href TEXT, -- For external links or custom paths

  -- App grouping (for future app launcher)
  app_id TEXT DEFAULT 'default',

  -- Display overrides (null = use object_definition defaults)
  display_name TEXT,
  icon_name TEXT,

  -- Positioning
  nav_type TEXT NOT NULL CHECK (nav_type IN ('primary_tab', 'tools_menu', 'admin_menu')),
  sort_order INTEGER DEFAULT 100,

  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  visible_to_roles TEXT[], -- null = all roles, array of role names for restricted visibility

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure either object_definition_id OR item_key is set
  CONSTRAINT nav_config_item_check CHECK (
    (object_definition_id IS NOT NULL AND item_type = 'object')
    OR (object_definition_id IS NULL AND item_type IN ('tool', 'external_link') AND item_key IS NOT NULL)
  )
);

-- Partial unique indexes for proper uniqueness handling
-- For object-based nav items (only when object_definition_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS nav_config_object_unique_idx
  ON navigation_config (organization_id, app_id, object_definition_id)
  NULLS NOT DISTINCT
  WHERE object_definition_id IS NOT NULL;

-- For tool-based nav items (only when item_key IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS nav_config_tool_unique_idx
  ON navigation_config (organization_id, app_id, item_key)
  NULLS NOT DISTINCT
  WHERE item_key IS NOT NULL;

-- Indexes for fast navigation queries
CREATE INDEX IF NOT EXISTS idx_nav_config_org_app ON navigation_config(organization_id, app_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_nav_config_org_type ON navigation_config(organization_id, nav_type, sort_order);
CREATE INDEX IF NOT EXISTS idx_nav_config_object ON navigation_config(object_definition_id) WHERE object_definition_id IS NOT NULL;

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS update_navigation_config_updated_at ON navigation_config;
CREATE TRIGGER update_navigation_config_updated_at
  BEFORE UPDATE ON navigation_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;

-- Users can see nav config for their organization OR global defaults (org_id = NULL)
CREATE POLICY "navigation_config_select" ON navigation_config
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Only admins/owners can modify nav config
CREATE POLICY "navigation_config_insert" ON navigation_config
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "navigation_config_update" ON navigation_config
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "navigation_config_delete" ON navigation_config
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- SEED DEFAULT NAVIGATION CONFIG (GLOBAL DEFAULTS)
-- These are fallback defaults when no org-specific config exists
-- organization_id = NULL means these apply globally
-- =====================================================

-- Get standard object IDs for seeding
DO $$
DECLARE
  v_account_id UUID;
  v_contact_id UUID;
  v_lead_id UUID;
  v_opportunity_id UUID;
  v_activity_id UUID;
BEGIN
  -- Get standard object definition IDs
  SELECT id INTO v_account_id FROM object_definitions WHERE api_name = 'Account' AND is_standard = true LIMIT 1;
  SELECT id INTO v_contact_id FROM object_definitions WHERE api_name = 'Contact' AND is_standard = true LIMIT 1;
  SELECT id INTO v_lead_id FROM object_definitions WHERE api_name = 'Lead' AND is_standard = true LIMIT 1;
  SELECT id INTO v_opportunity_id FROM object_definitions WHERE api_name = 'Opportunity' AND is_standard = true LIMIT 1;
  SELECT id INTO v_activity_id FROM object_definitions WHERE api_name = 'Activity' AND is_standard = true LIMIT 1;

  -- Insert primary tabs (CRM objects)
  INSERT INTO navigation_config (organization_id, object_definition_id, item_type, nav_type, sort_order, icon_name)
  VALUES
    (NULL, v_account_id, 'object', 'primary_tab', 10, 'building-2'),
    (NULL, v_contact_id, 'object', 'primary_tab', 20, 'users'),
    (NULL, v_lead_id, 'object', 'primary_tab', 30, 'user-plus'),
    (NULL, v_opportunity_id, 'object', 'primary_tab', 40, 'target'),
    (NULL, v_activity_id, 'object', 'primary_tab', 50, 'activity')
  ON CONFLICT DO NOTHING;

  -- Insert tools menu items
  INSERT INTO navigation_config (organization_id, item_type, item_key, item_href, nav_type, sort_order, display_name, icon_name)
  VALUES
    (NULL, 'tool', 'messages', '/admin/messages', 'tools_menu', 10, 'Messages', 'message-square'),
    (NULL, 'tool', 'reports', '/admin/reports', 'tools_menu', 20, 'Reports', 'bar-chart-3'),
    (NULL, 'tool', 'dashboards', '/admin/dashboards', 'tools_menu', 30, 'Dashboards', 'layout-dashboard'),
    (NULL, 'tool', 'workflows', '/admin/workflows', 'tools_menu', 40, 'Workflows', 'workflow')
  ON CONFLICT DO NOTHING;

  -- Insert admin menu items
  INSERT INTO navigation_config (organization_id, item_type, item_key, item_href, nav_type, sort_order, display_name, icon_name)
  VALUES
    (NULL, 'tool', 'team', '/admin/team', 'admin_menu', 10, 'Team', 'users-2'),
    (NULL, 'tool', 'setup', '/admin/setup', 'admin_menu', 20, 'Setup', 'settings')
  ON CONFLICT DO NOTHING;

END $$;

-- =====================================================
-- HELPER FUNCTION: Get navigation config for a user
-- Returns combined global defaults + org overrides
-- =====================================================
CREATE OR REPLACE FUNCTION get_navigation_config(
  p_user_id UUID,
  p_app_id TEXT DEFAULT 'default'
)
RETURNS TABLE (
  id UUID,
  object_definition_id UUID,
  object_api_name TEXT,
  object_label TEXT,
  object_plural_label TEXT,
  item_type TEXT,
  item_key TEXT,
  item_href TEXT,
  nav_type TEXT,
  sort_order INTEGER,
  display_name TEXT,
  icon_name TEXT,
  is_custom_object BOOLEAN,
  visible_to_roles TEXT[]
) AS $$
DECLARE
  v_org_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get user's organization and role
  SELECT u.organization_id INTO v_org_id
  FROM users u WHERE u.id = p_user_id;

  SELECT tm.role INTO v_user_role
  FROM team_members tm WHERE tm.user_id = p_user_id;

  RETURN QUERY
  WITH nav_items AS (
    -- Get org-specific config (overrides global)
    SELECT nc.*, 'org' as source
    FROM navigation_config nc
    WHERE nc.organization_id = v_org_id
      AND nc.app_id = p_app_id
      AND nc.is_visible = true

    UNION ALL

    -- Get global defaults (where no org override exists)
    SELECT nc.*, 'global' as source
    FROM navigation_config nc
    WHERE nc.organization_id IS NULL
      AND nc.app_id = p_app_id
      AND nc.is_visible = true
      AND NOT EXISTS (
        SELECT 1 FROM navigation_config org_nc
        WHERE org_nc.organization_id = v_org_id
          AND org_nc.app_id = p_app_id
          AND (
            (org_nc.object_definition_id IS NOT NULL AND org_nc.object_definition_id = nc.object_definition_id)
            OR (org_nc.item_key IS NOT NULL AND org_nc.item_key = nc.item_key)
          )
      )
  )
  SELECT
    ni.id,
    ni.object_definition_id,
    od.api_name as object_api_name,
    od.label as object_label,
    od.plural_label as object_plural_label,
    ni.item_type,
    ni.item_key,
    ni.item_href,
    ni.nav_type,
    ni.sort_order,
    COALESCE(ni.display_name, od.label) as display_name,
    COALESCE(ni.icon_name, od.icon_name, 'file') as icon_name,
    COALESCE(od.is_custom, false) as is_custom_object,
    ni.visible_to_roles
  FROM nav_items ni
  LEFT JOIN object_definitions od ON ni.object_definition_id = od.id
  WHERE (
    -- Filter by role visibility
    ni.visible_to_roles IS NULL
    OR v_user_role = ANY(ni.visible_to_roles)
  )
  ORDER BY ni.nav_type, ni.sort_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- ADMIN APPS TABLE (Future - Schema Only)
-- Defines app groupings like Salesforce's App Launcher
-- Not seeded or used in initial implementation
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- App identity
  api_name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,

  -- UI
  icon_name TEXT DEFAULT 'grid',
  color TEXT DEFAULT '#6B7280',

  -- Ordering and defaults
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 100,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT admin_app_unique UNIQUE(organization_id, api_name)
);

-- RLS for admin_apps
ALTER TABLE admin_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_apps_select" ON admin_apps
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "admin_apps_insert" ON admin_apps
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "admin_apps_update" ON admin_apps
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "admin_apps_delete" ON admin_apps
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Seed default app (global)
INSERT INTO admin_apps (organization_id, api_name, label, description, is_default, sort_order)
VALUES (NULL, 'default', 'CRM', 'Customer Relationship Management', true, 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE navigation_config IS 'Configures navigation items for the admin portal. Supports both object-based tabs and tool items.';
COMMENT ON TABLE admin_apps IS 'Defines app groupings for the future app launcher feature. Apps group navigation items.';
COMMENT ON FUNCTION get_navigation_config IS 'Returns navigation configuration for a user, combining global defaults with org-specific overrides.';
