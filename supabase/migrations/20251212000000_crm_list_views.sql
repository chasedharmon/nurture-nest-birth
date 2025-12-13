-- CRM List Views
-- Stores saved list view configurations for the metadata-driven CRM

CREATE TABLE IF NOT EXISTS crm_list_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Object reference (e.g., 'Contact', 'Lead', 'Opportunity')
  object_api_name TEXT NOT NULL,

  -- View identity
  name TEXT NOT NULL,
  description TEXT,

  -- Visibility: 'private' (only creator), 'shared' (link shareable), 'org' (everyone in org)
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'org')),

  -- Flags
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

  -- Configuration (stored as JSONB for flexibility)
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Sort configuration
  sort_field TEXT,
  sort_direction TEXT DEFAULT 'desc' CHECK (sort_direction IN ('asc', 'desc')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_crm_list_views_object ON crm_list_views(object_api_name);
CREATE INDEX idx_crm_list_views_created_by ON crm_list_views(created_by);
CREATE INDEX idx_crm_list_views_visibility ON crm_list_views(visibility);
CREATE INDEX idx_crm_list_views_org ON crm_list_views(organization_id);

-- Trigger to update updated_at
CREATE TRIGGER crm_list_views_updated_at
  BEFORE UPDATE ON crm_list_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE crm_list_views ENABLE ROW LEVEL SECURITY;

-- Users can see their own views
CREATE POLICY "Users can view own list views"
  ON crm_list_views FOR SELECT
  USING (created_by = auth.uid());

-- Users can see shared/org views
CREATE POLICY "Users can view shared and org list views"
  ON crm_list_views FOR SELECT
  USING (visibility IN ('shared', 'org'));

-- Users can create their own views
CREATE POLICY "Users can create list views"
  ON crm_list_views FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own views
CREATE POLICY "Users can update own list views"
  ON crm_list_views FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own views
CREATE POLICY "Users can delete own list views"
  ON crm_list_views FOR DELETE
  USING (created_by = auth.uid());

-- Grant permissions
GRANT ALL ON crm_list_views TO authenticated;

COMMENT ON TABLE crm_list_views IS 'Stores saved list view configurations for CRM objects including filters, columns, and visibility settings';
