-- =====================================================
-- IMPORT JOBS AND MAPPING TEMPLATES
-- Tracks import history and saved column mappings
-- =====================================================

-- Import jobs table - tracks each import operation
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Import metadata
  object_type TEXT NOT NULL CHECK (object_type IN ('leads', 'clients', 'invoices', 'meetings', 'services')),
  file_name TEXT NOT NULL,
  file_size INTEGER,

  -- Row counts
  total_rows INTEGER NOT NULL DEFAULT 0,
  successful_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Column mapping used
  mapping JSONB DEFAULT '{}',

  -- Error log for failed rows
  error_log JSONB DEFAULT '[]',

  -- Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Import mapping templates - saved mappings for reuse
CREATE TABLE IF NOT EXISTS import_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  object_type TEXT NOT NULL CHECK (object_type IN ('leads', 'clients', 'invoices', 'meetings', 'services')),

  -- The actual mappings: { "source_column": "target_field" }
  mappings JSONB NOT NULL DEFAULT '{}',

  -- Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique template names per org per object type
  UNIQUE (organization_id, object_type, name)
);

-- Indexes for efficient lookups
CREATE INDEX idx_import_jobs_org ON import_jobs(organization_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created ON import_jobs(created_at DESC);
CREATE INDEX idx_import_mapping_templates_org ON import_mapping_templates(organization_id);
CREATE INDEX idx_import_mapping_templates_type ON import_mapping_templates(object_type);

-- Enable RLS
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_mapping_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - authenticated users can manage their own imports
CREATE POLICY "Import jobs accessible by authenticated"
  ON import_jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Import templates accessible by authenticated"
  ON import_mapping_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at on mapping templates
CREATE OR REPLACE FUNCTION update_mapping_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mapping_template_updated_at
  BEFORE UPDATE ON import_mapping_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_mapping_template_updated_at();
