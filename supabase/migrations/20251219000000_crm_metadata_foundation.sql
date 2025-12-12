-- =====================================================
-- CRM METADATA FOUNDATION
-- =====================================================
-- This migration creates the metadata tables that power
-- the dynamic CRM object model (Salesforce-like architecture)
--
-- Tables created:
-- - object_definitions: Registry of all objects (standard + custom)
-- - field_definitions: All fields for all objects
-- - picklist_values: Valid values for picklist fields
-- - page_layouts: UI layout configuration per object
-- - record_types: Different record types per object
-- =====================================================

-- =====================================================
-- OBJECT DEFINITIONS
-- Defines both standard and custom objects
-- =====================================================
CREATE TABLE IF NOT EXISTS object_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Object identity
  api_name TEXT NOT NULL,
  label TEXT NOT NULL,
  plural_label TEXT NOT NULL,
  description TEXT,

  -- Object classification
  is_standard BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,

  -- Table information (for standard objects)
  table_name TEXT,

  -- Features
  has_record_types BOOLEAN DEFAULT false,
  has_activities BOOLEAN DEFAULT true,
  has_notes BOOLEAN DEFAULT true,
  has_attachments BOOLEAN DEFAULT true,

  -- Sharing model
  sharing_model TEXT DEFAULT 'private' CHECK (sharing_model IN ('private', 'read', 'read_write', 'full_access')),

  -- UI configuration
  icon_name TEXT DEFAULT 'file',
  color TEXT DEFAULT '#6B7280',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT object_api_name_unique UNIQUE(organization_id, api_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_object_definitions_org ON object_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_object_definitions_api_name ON object_definitions(api_name);
CREATE INDEX IF NOT EXISTS idx_object_definitions_standard ON object_definitions(is_standard) WHERE is_standard = true;

-- =====================================================
-- FIELD DEFINITIONS
-- Defines fields for all objects (standard and custom)
-- =====================================================
CREATE TABLE IF NOT EXISTS field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  object_definition_id UUID NOT NULL REFERENCES object_definitions(id) ON DELETE CASCADE,

  -- Field identity
  api_name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  help_text TEXT,

  -- Field type
  data_type TEXT NOT NULL CHECK (data_type IN (
    'text', 'textarea', 'rich_text',
    'number', 'currency', 'percent',
    'date', 'datetime',
    'checkbox',
    'picklist', 'multipicklist',
    'lookup', 'master_detail',
    'email', 'phone', 'url',
    'formula', 'auto_number'
  )),

  -- Type-specific configuration (JSON)
  -- For text: { "maxLength": 255 }
  -- For number: { "precision": 18, "scale": 2 }
  -- For picklist: { "values": [{"value": "New", "label": "New", "is_default": true}] }
  -- For lookup: { "related_object_id": "uuid", "related_object_api_name": "Account" }
  -- For formula: { "formula": "Amount * 0.1", "return_type": "currency" }
  type_config JSONB DEFAULT '{}',

  -- Column mapping
  column_name TEXT,
  is_custom_field BOOLEAN DEFAULT false,

  -- Constraints
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,

  -- UI behavior
  is_visible BOOLEAN DEFAULT true,
  is_read_only BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Audit
  is_audited BOOLEAN DEFAULT false,

  -- Classification
  is_standard BOOLEAN DEFAULT false,
  is_name_field BOOLEAN DEFAULT false,

  -- Sensitive data flag (for security)
  is_sensitive BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT field_api_name_per_object UNIQUE(object_definition_id, api_name)
);

-- Indexes for field definitions
CREATE INDEX IF NOT EXISTS idx_field_definitions_object ON field_definitions(object_definition_id);
CREATE INDEX IF NOT EXISTS idx_field_definitions_org ON field_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_field_definitions_type ON field_definitions(data_type);
CREATE INDEX IF NOT EXISTS idx_field_definitions_active ON field_definitions(object_definition_id, is_active) WHERE is_active = true;

-- =====================================================
-- PICKLIST VALUES
-- Stores valid values for picklist fields
-- =====================================================
CREATE TABLE IF NOT EXISTS picklist_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_definition_id UUID NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,

  -- Value data
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,

  -- Ordering and defaults
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Conditional visibility (dependent picklists)
  controlling_field_id UUID REFERENCES field_definitions(id),
  controlling_values TEXT[],

  -- Color coding (for badges in UI)
  color TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT picklist_value_unique UNIQUE(field_definition_id, value)
);

-- Index for picklist values
CREATE INDEX IF NOT EXISTS idx_picklist_values_field ON picklist_values(field_definition_id);
CREATE INDEX IF NOT EXISTS idx_picklist_values_active ON picklist_values(field_definition_id, is_active) WHERE is_active = true;

-- =====================================================
-- PAGE LAYOUTS
-- Defines field arrangement on detail/edit pages
-- =====================================================
CREATE TABLE IF NOT EXISTS page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  object_definition_id UUID NOT NULL REFERENCES object_definitions(id) ON DELETE CASCADE,

  -- Layout identity
  name TEXT NOT NULL,
  description TEXT,

  -- Layout configuration (JSON structure)
  -- {
  --   "sections": [
  --     {
  --       "id": "uuid",
  --       "name": "Contact Information",
  --       "columns": 2,
  --       "collapsed": false,
  --       "fields": ["first_name", "last_name", "email", "phone"]
  --     }
  --   ],
  --   "related_lists": ["Activities", "Opportunities"],
  --   "sidebar_components": ["activity_timeline", "similar_records"]
  -- }
  layout_config JSONB NOT NULL DEFAULT '{}',

  -- Flags
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT page_layout_unique UNIQUE(organization_id, object_definition_id, name)
);

-- Index for page layouts
CREATE INDEX IF NOT EXISTS idx_page_layouts_object ON page_layouts(object_definition_id);
CREATE INDEX IF NOT EXISTS idx_page_layouts_org ON page_layouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_page_layouts_default ON page_layouts(object_definition_id, is_default) WHERE is_default = true;

-- =====================================================
-- RECORD TYPES
-- Allows different record types per object
-- (e.g., "Birth Doula Lead" vs "Postpartum Lead")
-- =====================================================
CREATE TABLE IF NOT EXISTS record_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  object_definition_id UUID NOT NULL REFERENCES object_definitions(id) ON DELETE CASCADE,

  -- Record type identity
  name TEXT NOT NULL,
  description TEXT,

  -- Page layout for this record type
  page_layout_id UUID REFERENCES page_layouts(id),

  -- Flags
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT record_type_unique UNIQUE(organization_id, object_definition_id, name)
);

-- Index for record types
CREATE INDEX IF NOT EXISTS idx_record_types_object ON record_types(object_definition_id);
CREATE INDEX IF NOT EXISTS idx_record_types_org ON record_types(organization_id);

-- =====================================================
-- FIELD PERMISSIONS
-- Controls field visibility/editability per role
-- =====================================================
CREATE TABLE IF NOT EXISTS field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,

  -- Permissions
  is_visible BOOLEAN DEFAULT true,
  is_editable BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT field_permission_unique UNIQUE(role_id, field_definition_id)
);

-- Index for field permissions
CREATE INDEX IF NOT EXISTS idx_field_permissions_role ON field_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_field_permissions_field ON field_permissions(field_definition_id);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_object_definitions_updated_at ON object_definitions;
CREATE TRIGGER update_object_definitions_updated_at
  BEFORE UPDATE ON object_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_field_definitions_updated_at ON field_definitions;
CREATE TRIGGER update_field_definitions_updated_at
  BEFORE UPDATE ON field_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page_layouts_updated_at ON page_layouts;
CREATE TRIGGER update_page_layouts_updated_at
  BEFORE UPDATE ON page_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_record_types_updated_at ON record_types;
CREATE TRIGGER update_record_types_updated_at
  BEFORE UPDATE ON record_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_field_permissions_updated_at ON field_permissions;
CREATE TRIGGER update_field_permissions_updated_at
  BEFORE UPDATE ON field_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE object_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE picklist_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_permissions ENABLE ROW LEVEL SECURITY;

-- Object definitions: Standard objects visible to all, custom objects org-scoped
CREATE POLICY "object_definitions_select" ON object_definitions
  FOR SELECT USING (
    is_standard = true
    OR organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "object_definitions_insert" ON object_definitions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "object_definitions_update" ON object_definitions
  FOR UPDATE USING (
    is_standard = false
    AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "object_definitions_delete" ON object_definitions
  FOR DELETE USING (
    is_standard = false
    AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Field definitions: Standard fields visible to all, custom fields org-scoped
CREATE POLICY "field_definitions_select" ON field_definitions
  FOR SELECT USING (
    is_standard = true
    OR organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "field_definitions_insert" ON field_definitions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "field_definitions_update" ON field_definitions
  FOR UPDATE USING (
    is_standard = false
    AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "field_definitions_delete" ON field_definitions
  FOR DELETE USING (
    is_standard = false
    AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Picklist values: Access based on field definition access
CREATE POLICY "picklist_values_select" ON picklist_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM field_definitions fd
      WHERE fd.id = picklist_values.field_definition_id
      AND (
        fd.is_standard = true
        OR fd.organization_id IS NULL
        OR fd.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "picklist_values_insert" ON picklist_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM field_definitions fd
      WHERE fd.id = picklist_values.field_definition_id
      AND fd.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "picklist_values_update" ON picklist_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM field_definitions fd
      WHERE fd.id = picklist_values.field_definition_id
      AND fd.is_standard = false
      AND fd.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "picklist_values_delete" ON picklist_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM field_definitions fd
      WHERE fd.id = picklist_values.field_definition_id
      AND fd.is_standard = false
      AND fd.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Page layouts: Org-scoped
CREATE POLICY "page_layouts_select" ON page_layouts
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "page_layouts_insert" ON page_layouts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "page_layouts_update" ON page_layouts
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "page_layouts_delete" ON page_layouts
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Record types: Org-scoped
CREATE POLICY "record_types_select" ON record_types
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "record_types_insert" ON record_types
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "record_types_update" ON record_types
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "record_types_delete" ON record_types
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Field permissions: Org-scoped
CREATE POLICY "field_permissions_select" ON field_permissions
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "field_permissions_insert" ON field_permissions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "field_permissions_update" ON field_permissions
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "field_permissions_delete" ON field_permissions
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- SEED STANDARD OBJECT DEFINITIONS
-- These are global (organization_id = NULL) and read-only
-- =====================================================
INSERT INTO object_definitions (
  organization_id, api_name, label, plural_label, description,
  is_standard, table_name, has_activities, has_notes, has_attachments,
  sharing_model, icon_name, color
) VALUES
  -- Contact - Person records
  (NULL, 'Contact', 'Contact', 'Contacts',
   'Individual person records with demographic and contact information',
   true, 'crm_contacts', true, true, true,
   'private', 'user', '#3B82F6'),

  -- Account - Household/Family
  (NULL, 'Account', 'Account', 'Accounts',
   'Household or family unit that groups related contacts',
   true, 'crm_accounts', true, true, true,
   'private', 'users', '#8B5CF6'),

  -- Lead - Unqualified prospects
  (NULL, 'Lead', 'Lead', 'Leads',
   'Unqualified prospects that can be converted to Contact + Account + Opportunity',
   true, 'crm_leads', true, true, false,
   'private', 'user-plus', '#F59E0B'),

  -- Opportunity - Deals/Sales
  (NULL, 'Opportunity', 'Opportunity', 'Opportunities',
   'Sales opportunities and service engagements',
   true, 'crm_opportunities', true, true, true,
   'private', 'trending-up', '#10B981'),

  -- Activity - Unified activity log
  (NULL, 'Activity', 'Activity', 'Activities',
   'Tasks, events, calls, emails, and notes',
   true, 'crm_activities', false, false, false,
   'private', 'activity', '#6B7280')
ON CONFLICT (organization_id, api_name) DO NOTHING;

-- =====================================================
-- HELPER FUNCTION: Get field definitions for an object
-- =====================================================
CREATE OR REPLACE FUNCTION get_object_fields(
  p_object_api_name TEXT,
  p_organization_id UUID DEFAULT NULL
)
RETURNS SETOF field_definitions AS $$
BEGIN
  RETURN QUERY
  SELECT fd.*
  FROM field_definitions fd
  JOIN object_definitions od ON fd.object_definition_id = od.id
  WHERE od.api_name = p_object_api_name
    AND fd.is_active = true
    AND (
      fd.is_standard = true
      OR fd.organization_id IS NULL
      OR fd.organization_id = p_organization_id
    )
  ORDER BY fd.display_order, fd.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- HELPER FUNCTION: Check field-level permission
-- =====================================================
CREATE OR REPLACE FUNCTION can_access_field(
  p_field_id UUID,
  p_user_id UUID,
  p_access_type TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_id UUID;
  v_permission RECORD;
BEGIN
  -- Get user's role
  SELECT role_id INTO v_role_id
  FROM users WHERE id = p_user_id;

  -- If no role, deny access
  IF v_role_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check for explicit permission
  SELECT * INTO v_permission
  FROM field_permissions
  WHERE role_id = v_role_id
    AND field_definition_id = p_field_id;

  -- If no explicit permission, default to visible/editable
  IF v_permission IS NULL THEN
    RETURN true;
  END IF;

  -- Check based on access type
  IF p_access_type = 'read' THEN
    RETURN v_permission.is_visible;
  ELSIF p_access_type = 'write' THEN
    RETURN v_permission.is_editable;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE object_definitions IS 'Registry of all CRM objects (standard and custom). Standard objects have organization_id = NULL.';
COMMENT ON TABLE field_definitions IS 'Field definitions for all objects. Custom fields are stored in the custom_fields JSONB column of each object table.';
COMMENT ON TABLE picklist_values IS 'Valid values for picklist and multipicklist fields. Supports dependent picklists via controlling_field_id.';
COMMENT ON TABLE page_layouts IS 'Page layout configurations defining how fields are arranged on record detail/edit pages.';
COMMENT ON TABLE record_types IS 'Different record types per object, allowing different page layouts and picklist values.';
COMMENT ON TABLE field_permissions IS 'Field-level security controlling which roles can view/edit specific fields.';
