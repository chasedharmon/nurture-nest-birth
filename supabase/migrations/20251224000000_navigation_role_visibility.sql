-- =====================================================
-- NAVIGATION ROLE VISIBILITY & USER PERSONALIZATION
-- =====================================================
-- This migration adds Salesforce-style navigation control:
-- 1. Three-state visibility per nav item per role (visible/available/hidden)
-- 2. User navigation preferences for personalization
-- 3. Enhanced navigation_config with required/removable flags
--
-- Key concepts:
-- - "visible" = Always shown (Default On)
-- - "available" = Can be added by user (Default Off)
-- - "hidden" = Not accessible at all
-- =====================================================

-- =====================================================
-- 1. NAVIGATION ROLE VISIBILITY TABLE
-- Stores three-state visibility per nav item per role
-- =====================================================
CREATE TABLE IF NOT EXISTS navigation_role_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  navigation_config_id UUID NOT NULL REFERENCES navigation_config(id) ON DELETE CASCADE,

  -- Role identifier (matches team_members.role)
  role_name TEXT NOT NULL CHECK (role_name IN ('owner', 'admin', 'provider', 'assistant', 'staff')),

  -- Three-state visibility
  visibility_state TEXT NOT NULL DEFAULT 'visible'
    CHECK (visibility_state IN ('visible', 'available', 'hidden')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each nav item can only have one visibility setting per role per org
  -- NULLS NOT DISTINCT ensures (NULL, x, y) is treated as unique
  CONSTRAINT nav_role_visibility_unique
    UNIQUE NULLS NOT DISTINCT (organization_id, navigation_config_id, role_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nav_role_visibility_nav_config
  ON navigation_role_visibility(navigation_config_id);
CREATE INDEX IF NOT EXISTS idx_nav_role_visibility_role
  ON navigation_role_visibility(role_name, visibility_state);
CREATE INDEX IF NOT EXISTS idx_nav_role_visibility_org
  ON navigation_role_visibility(organization_id);

-- =====================================================
-- 2. USER NAVIGATION PREFERENCES TABLE
-- Stores per-user navigation personalization
-- =====================================================
CREATE TABLE IF NOT EXISTS user_navigation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  app_id TEXT DEFAULT 'default',

  -- User's personalized navigation items
  -- Array of objects: [{ nav_config_id, sort_order, is_added }]
  -- is_added = true means user explicitly added an "available" item
  nav_items JSONB NOT NULL DEFAULT '[]',

  -- User UI preferences
  show_icons BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One preference record per user per org per app
  CONSTRAINT user_nav_pref_unique
    UNIQUE NULLS NOT DISTINCT (user_id, organization_id, app_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_nav_pref_user ON user_navigation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nav_pref_org ON user_navigation_preferences(organization_id);

-- =====================================================
-- 3. ENHANCE NAVIGATION_CONFIG TABLE
-- Add columns for required items and default visibility
-- =====================================================
ALTER TABLE navigation_config
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_be_removed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_visibility TEXT DEFAULT 'visible'
    CHECK (default_visibility IN ('visible', 'available', 'hidden'));

-- =====================================================
-- 4. UPDATED_AT TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_nav_role_visibility_updated_at ON navigation_role_visibility;
CREATE TRIGGER update_nav_role_visibility_updated_at
  BEFORE UPDATE ON navigation_role_visibility
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_nav_pref_updated_at ON user_navigation_preferences;
CREATE TRIGGER update_user_nav_pref_updated_at
  BEFORE UPDATE ON user_navigation_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE navigation_role_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_navigation_preferences ENABLE ROW LEVEL SECURITY;

-- Navigation role visibility: Anyone can read global or their org's config
CREATE POLICY "nav_role_visibility_select" ON navigation_role_visibility
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Only owners/admins can modify visibility settings
CREATE POLICY "nav_role_visibility_insert" ON navigation_role_visibility
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "nav_role_visibility_update" ON navigation_role_visibility
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "nav_role_visibility_delete" ON navigation_role_visibility
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- User preferences: Users own their own preferences
CREATE POLICY "user_nav_pref_select" ON user_navigation_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_nav_pref_insert" ON user_navigation_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_nav_pref_update" ON user_navigation_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_nav_pref_delete" ON user_navigation_preferences
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 6. HELPER FUNCTION: Get effective navigation for user
-- Combines role visibility + user preferences
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_navigation(
  p_user_id UUID,
  p_app_id TEXT DEFAULT 'default'
)
RETURNS TABLE (
  id UUID,
  nav_config_id UUID,
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
  visibility_state TEXT,
  is_user_added BOOLEAN,
  is_required BOOLEAN,
  can_be_removed BOOLEAN
) AS $$
DECLARE
  v_org_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get user's organization
  SELECT u.organization_id INTO v_org_id
  FROM users u WHERE u.id = p_user_id;

  -- Get user's role from team_members
  SELECT tm.role INTO v_user_role
  FROM team_members tm WHERE tm.user_id = p_user_id LIMIT 1;

  -- Default to 'staff' if no role found
  IF v_user_role IS NULL THEN
    v_user_role := 'staff';
  END IF;

  RETURN QUERY
  WITH base_nav AS (
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
  ),
  nav_with_objects AS (
    -- Join with object definitions
    SELECT
      bn.*,
      od.api_name as obj_api_name,
      od.label as obj_label,
      od.plural_label as obj_plural_label,
      COALESCE(od.is_custom, false) as is_custom
    FROM base_nav bn
    LEFT JOIN object_definitions od ON bn.object_definition_id = od.id
  ),
  role_visibility AS (
    -- Get role-based visibility, checking org-specific first, then global
    SELECT
      nwo.*,
      COALESCE(
        -- First try org-specific role visibility
        (SELECT nrv.visibility_state
         FROM navigation_role_visibility nrv
         WHERE nrv.navigation_config_id = nwo.id
           AND nrv.role_name = v_user_role
           AND nrv.organization_id = v_org_id
         LIMIT 1),
        -- Then try global role visibility
        (SELECT nrv.visibility_state
         FROM navigation_role_visibility nrv
         WHERE nrv.navigation_config_id = nwo.id
           AND nrv.role_name = v_user_role
           AND nrv.organization_id IS NULL
         LIMIT 1),
        -- Fall back to default_visibility on nav_config
        nwo.default_visibility,
        -- Ultimate fallback
        'visible'
      ) as vis_state
    FROM nav_with_objects nwo
  ),
  user_prefs AS (
    -- Get user's personal nav preferences
    SELECT
      (item->>'nav_config_id')::UUID as pref_nav_config_id,
      (item->>'sort_order')::INTEGER as user_sort_order,
      COALESCE((item->>'is_added')::BOOLEAN, false) as user_added
    FROM user_navigation_preferences unp,
      jsonb_array_elements(unp.nav_items) as item
    WHERE unp.user_id = p_user_id
      AND (unp.organization_id IS NULL OR unp.organization_id = v_org_id)
      AND unp.app_id = p_app_id
  )
  SELECT
    rv.id,
    rv.id as nav_config_id,
    rv.object_definition_id,
    rv.obj_api_name,
    rv.obj_label,
    rv.obj_plural_label,
    rv.item_type,
    rv.item_key,
    rv.item_href,
    rv.nav_type,
    COALESCE(up.user_sort_order, rv.sort_order) as sort_order,
    COALESCE(rv.display_name, rv.obj_plural_label, rv.obj_label) as display_name,
    COALESCE(rv.icon_name, 'file') as icon_name,
    rv.is_custom,
    rv.vis_state,
    COALESCE(up.user_added, false) as is_user_added,
    COALESCE(rv.is_required, false) as is_required,
    COALESCE(rv.can_be_removed, true) as can_be_removed
  FROM role_visibility rv
  LEFT JOIN user_prefs up ON up.pref_nav_config_id = rv.id
  WHERE
    -- Show if: visible, OR (available AND user added it)
    rv.vis_state = 'visible'
    OR (rv.vis_state = 'available' AND up.user_added = true)
  ORDER BY rv.nav_type, sort_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 7. HELPER FUNCTION: Get available items for user
-- Returns items user can add to their nav (state = 'available')
-- =====================================================
CREATE OR REPLACE FUNCTION get_available_nav_items(
  p_user_id UUID,
  p_app_id TEXT DEFAULT 'default'
)
RETURNS TABLE (
  id UUID,
  object_definition_id UUID,
  object_api_name TEXT,
  display_name TEXT,
  icon_name TEXT,
  nav_type TEXT,
  is_custom_object BOOLEAN
) AS $$
DECLARE
  v_org_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get user's organization and role
  SELECT u.organization_id INTO v_org_id
  FROM users u WHERE u.id = p_user_id;

  SELECT tm.role INTO v_user_role
  FROM team_members tm WHERE tm.user_id = p_user_id LIMIT 1;

  IF v_user_role IS NULL THEN
    v_user_role := 'staff';
  END IF;

  RETURN QUERY
  WITH base_nav AS (
    SELECT nc.*
    FROM navigation_config nc
    WHERE (nc.organization_id = v_org_id OR nc.organization_id IS NULL)
      AND nc.app_id = p_app_id
      AND nc.is_visible = true
  ),
  nav_with_visibility AS (
    SELECT
      bn.*,
      od.api_name as obj_api_name,
      od.label as obj_label,
      od.plural_label as obj_plural_label,
      COALESCE(od.is_custom, false) as is_custom,
      COALESCE(
        (SELECT nrv.visibility_state
         FROM navigation_role_visibility nrv
         WHERE nrv.navigation_config_id = bn.id
           AND nrv.role_name = v_user_role
           AND (nrv.organization_id = v_org_id OR nrv.organization_id IS NULL)
         ORDER BY nrv.organization_id NULLS LAST
         LIMIT 1),
        bn.default_visibility,
        'visible'
      ) as vis_state
    FROM base_nav bn
    LEFT JOIN object_definitions od ON bn.object_definition_id = od.id
  ),
  user_added_items AS (
    SELECT (item->>'nav_config_id')::UUID as added_nav_config_id
    FROM user_navigation_preferences unp,
      jsonb_array_elements(unp.nav_items) as item
    WHERE unp.user_id = p_user_id
      AND (unp.organization_id IS NULL OR unp.organization_id = v_org_id)
      AND unp.app_id = p_app_id
      AND (item->>'is_added')::BOOLEAN = true
  )
  SELECT
    nwv.id,
    nwv.object_definition_id,
    nwv.obj_api_name,
    COALESCE(nwv.display_name, nwv.obj_plural_label, nwv.obj_label) as display_name,
    COALESCE(nwv.icon_name, 'file') as icon_name,
    nwv.nav_type,
    nwv.is_custom
  FROM nav_with_visibility nwv
  WHERE nwv.vis_state = 'available'
    AND nwv.id NOT IN (SELECT added_nav_config_id FROM user_added_items)
  ORDER BY nwv.nav_type, nwv.sort_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 8. HELPER FUNCTION: Get all nav items for admin
-- Returns all items with visibility matrix data
-- =====================================================
CREATE OR REPLACE FUNCTION get_navigation_items_for_admin(
  p_organization_id UUID,
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
  is_required BOOLEAN,
  can_be_removed BOOLEAN,
  default_visibility TEXT,
  -- Role visibility as JSONB: { "owner": "visible", "admin": "visible", ... }
  role_visibility JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH base_nav AS (
    -- Get org-specific config
    SELECT nc.*, 'org' as source
    FROM navigation_config nc
    WHERE nc.organization_id = p_organization_id
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
        WHERE org_nc.organization_id = p_organization_id
          AND org_nc.app_id = p_app_id
          AND (
            (org_nc.object_definition_id IS NOT NULL AND org_nc.object_definition_id = nc.object_definition_id)
            OR (org_nc.item_key IS NOT NULL AND org_nc.item_key = nc.item_key)
          )
      )
  ),
  nav_with_objects AS (
    SELECT
      bn.*,
      od.api_name as obj_api_name,
      od.label as obj_label,
      od.plural_label as obj_plural_label,
      COALESCE(od.is_custom, false) as is_custom
    FROM base_nav bn
    LEFT JOIN object_definitions od ON bn.object_definition_id = od.id
  ),
  role_vis_agg AS (
    -- Aggregate role visibility into JSONB
    SELECT
      nrv.navigation_config_id,
      jsonb_object_agg(nrv.role_name, nrv.visibility_state) as vis_obj
    FROM navigation_role_visibility nrv
    WHERE nrv.organization_id = p_organization_id OR nrv.organization_id IS NULL
    GROUP BY nrv.navigation_config_id
  )
  SELECT
    nwo.id,
    nwo.object_definition_id,
    nwo.obj_api_name,
    nwo.obj_label,
    nwo.obj_plural_label,
    nwo.item_type,
    nwo.item_key,
    nwo.item_href,
    nwo.nav_type,
    nwo.sort_order,
    COALESCE(nwo.display_name, nwo.obj_plural_label, nwo.obj_label) as display_name,
    COALESCE(nwo.icon_name, 'file') as icon_name,
    nwo.is_custom,
    COALESCE(nwo.is_required, false) as is_required,
    COALESCE(nwo.can_be_removed, true) as can_be_removed,
    COALESCE(nwo.default_visibility, 'visible') as default_visibility,
    COALESCE(rva.vis_obj, '{}'::jsonb) as role_visibility
  FROM nav_with_objects nwo
  LEFT JOIN role_vis_agg rva ON rva.navigation_config_id = nwo.id
  ORDER BY nwo.nav_type, nwo.sort_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 9. SEED DEFAULT ROLE VISIBILITY
-- Set default visibility for existing nav items
-- =====================================================
DO $$
DECLARE
  v_nav_item RECORD;
BEGIN
  -- For each global nav config item, set default visibility per role
  FOR v_nav_item IN
    SELECT id FROM navigation_config WHERE organization_id IS NULL
  LOOP
    -- Standard objects and tools: visible to owner/admin, available to others
    INSERT INTO navigation_role_visibility (organization_id, navigation_config_id, role_name, visibility_state)
    VALUES
      (NULL, v_nav_item.id, 'owner', 'visible'),
      (NULL, v_nav_item.id, 'admin', 'visible'),
      (NULL, v_nav_item.id, 'provider', 'visible'),
      (NULL, v_nav_item.id, 'assistant', 'available'),
      (NULL, v_nav_item.id, 'staff', 'available')
    ON CONFLICT (organization_id, navigation_config_id, role_name) DO NOTHING;
  END LOOP;
END $$;

-- Mark core nav items as required (cannot be removed by users)
UPDATE navigation_config
SET is_required = true, can_be_removed = false
WHERE item_key IN ('setup', 'team') AND organization_id IS NULL;

-- =====================================================
-- 10. COMMENTS
-- =====================================================
COMMENT ON TABLE navigation_role_visibility IS 'Three-state visibility (visible/available/hidden) per navigation item per role. Visible items always show, available items can be added by users, hidden items are not accessible.';
COMMENT ON TABLE user_navigation_preferences IS 'Per-user navigation personalization including added items, custom sort order, and UI preferences.';
COMMENT ON FUNCTION get_user_navigation IS 'Returns effective navigation for a user combining role visibility rules with personal preferences.';
COMMENT ON FUNCTION get_available_nav_items IS 'Returns navigation items the user can add to their nav (items with "available" visibility that they have not yet added).';
COMMENT ON FUNCTION get_navigation_items_for_admin IS 'Returns all navigation items with their role visibility matrix for admin configuration UI.';
