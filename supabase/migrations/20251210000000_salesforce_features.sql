-- ============================================================================
-- Migration: Salesforce-Like Admin & Client Portal Features
-- This adds list views, user preferences, reports, dashboards, and client journey
-- ============================================================================

-- ============================================================================
-- PART 1: ADMIN PORTAL - USER PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- UI Preferences
  ui_density TEXT DEFAULT 'comfortable',
  theme TEXT DEFAULT 'system',
  sidebar_collapsed BOOLEAN DEFAULT false,

  -- Default views per object type (references list_views.id)
  default_lead_view_id UUID,
  default_client_view_id UUID,
  default_invoice_view_id UUID,
  default_meeting_view_id UUID,

  -- Dashboard preferences
  dashboard_layout JSONB DEFAULT '{}',
  default_dashboard_id UUID,
  pinned_reports TEXT[] DEFAULT '{}',

  -- Recent items (for quick access)
  recent_leads TEXT[] DEFAULT '{}',
  recent_clients TEXT[] DEFAULT '{}',

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id),
  CONSTRAINT ui_density_check CHECK (ui_density IN ('compact', 'comfortable', 'spacious')),
  CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'system'))
);

-- ============================================================================
-- PART 2: ADMIN PORTAL - LIST VIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS list_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- View metadata
  name TEXT NOT NULL,
  description TEXT,
  object_type TEXT NOT NULL,

  -- Visibility
  visibility TEXT DEFAULT 'private',
  is_default BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  -- View configuration (JSONB for flexibility)
  filters JSONB DEFAULT '[]',
  columns JSONB DEFAULT '[]',
  sort_config JSONB DEFAULT '{"field": "created_at", "direction": "desc"}',
  group_by TEXT,

  -- View mode
  view_mode TEXT DEFAULT 'table',
  kanban_config JSONB DEFAULT '{}',

  -- Quick filters (saved filter shortcuts)
  quick_filters JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT object_type_check CHECK (object_type IN ('leads', 'clients', 'invoices', 'meetings', 'team_members', 'payments', 'services')),
  CONSTRAINT visibility_check CHECK (visibility IN ('private', 'shared', 'org')),
  CONSTRAINT view_mode_check CHECK (view_mode IN ('table', 'kanban', 'calendar', 'cards'))
);

-- ============================================================================
-- PART 3: ADMIN PORTAL - SAVED FILTERS (Reusable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  object_type TEXT NOT NULL,
  filter_config JSONB NOT NULL,

  visibility TEXT DEFAULT 'private',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT saved_filter_object_type_check CHECK (object_type IN ('leads', 'clients', 'invoices', 'meetings', 'team_members', 'payments', 'services')),
  CONSTRAINT saved_filter_visibility_check CHECK (visibility IN ('private', 'shared'))
);

-- ============================================================================
-- PART 4: ADMIN PORTAL - REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Report configuration
  report_type TEXT NOT NULL,
  object_type TEXT NOT NULL,

  -- Data configuration
  columns JSONB NOT NULL DEFAULT '[]',
  filters JSONB DEFAULT '[]',
  groupings JSONB DEFAULT '[]',
  aggregations JSONB DEFAULT '[]',

  -- Chart configuration (for chart reports)
  chart_config JSONB DEFAULT '{}',

  -- Visibility
  visibility TEXT DEFAULT 'private',

  -- Scheduling (future: scheduled reports via email)
  schedule_config JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT report_type_check CHECK (report_type IN ('tabular', 'summary', 'matrix', 'chart')),
  CONSTRAINT report_object_type_check CHECK (object_type IN ('leads', 'clients', 'invoices', 'meetings', 'team_members', 'payments', 'services')),
  CONSTRAINT report_visibility_check CHECK (visibility IN ('private', 'shared', 'org'))
);

-- ============================================================================
-- PART 5: ADMIN PORTAL - DASHBOARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Dashboard layout (grid-based like Salesforce)
  layout JSONB NOT NULL DEFAULT '[]',

  -- Visibility
  visibility TEXT DEFAULT 'private',
  is_default BOOLEAN DEFAULT false,

  -- Refresh settings
  auto_refresh_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT dashboard_visibility_check CHECK (visibility IN ('private', 'shared', 'org'))
);

-- ============================================================================
-- PART 6: ADMIN PORTAL - DASHBOARD WIDGETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,

  -- Widget type
  widget_type TEXT NOT NULL,

  -- Widget configuration
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',

  -- Grid position (12-column grid)
  grid_x INTEGER NOT NULL DEFAULT 0,
  grid_y INTEGER NOT NULL DEFAULT 0,
  grid_width INTEGER NOT NULL DEFAULT 4,
  grid_height INTEGER NOT NULL DEFAULT 2,

  -- Data source
  data_source TEXT DEFAULT 'query',
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  query_config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT widget_type_check CHECK (widget_type IN ('metric', 'chart', 'table', 'report', 'list', 'funnel', 'gauge', 'calendar')),
  CONSTRAINT data_source_check CHECK (data_source IN ('report', 'query', 'static')),
  CONSTRAINT grid_width_check CHECK (grid_width >= 1 AND grid_width <= 12),
  CONSTRAINT grid_height_check CHECK (grid_height >= 1 AND grid_height <= 8)
);

-- ============================================================================
-- PART 7: CLIENT PORTAL - ACTION ITEM TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS action_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT,

  -- Default items (JSONB array of action items to create)
  default_items JSONB NOT NULL DEFAULT '[]',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT template_service_type_check CHECK (service_type IS NULL OR service_type IN ('birth_doula', 'postpartum_doula', 'lactation_consulting', 'childbirth_education', 'other'))
);

-- ============================================================================
-- PART 8: CLIENT PORTAL - CLIENT ACTION ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  template_id UUID REFERENCES action_item_templates(id) ON DELETE SET NULL,

  -- Item details
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,

  -- Status tracking
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Priority and ordering
  priority INTEGER DEFAULT 50,
  display_order INTEGER DEFAULT 0,
  due_date DATE,

  -- Auto-completion trigger (optional)
  auto_complete_trigger TEXT,

  -- Navigation
  action_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT action_type_check CHECK (action_type IN ('intake_form', 'sign_contract', 'upload_document', 'schedule_meeting', 'make_payment', 'review_document', 'custom')),
  CONSTRAINT action_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped'))
);

-- ============================================================================
-- PART 9: CLIENT PORTAL - JOURNEY MILESTONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_journey_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Milestone details
  milestone_type TEXT NOT NULL,
  milestone_label TEXT NOT NULL,
  phase TEXT NOT NULL,

  -- Completion tracking
  completed_at TIMESTAMPTZ,
  expected_date DATE,

  -- Order for display
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT milestone_phase_check CHECK (phase IN ('consultation', 'prenatal', 'birth', 'postpartum'))
);

-- ============================================================================
-- PART 10: EXTEND LEADS TABLE FOR JOURNEY TRACKING
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS journey_phase TEXT DEFAULT 'consultation',
  ADD COLUMN IF NOT EXISTS journey_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_portal_visit TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_provider_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add constraint for journey_phase (only if not exists - use DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_journey_phase_check'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_journey_phase_check
      CHECK (journey_phase IS NULL OR journey_phase IN ('consultation', 'prenatal', 'birth', 'postpartum'));
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- List views
CREATE INDEX IF NOT EXISTS idx_list_views_created_by ON list_views(created_by);
CREATE INDEX IF NOT EXISTS idx_list_views_object_type ON list_views(object_type);
CREATE INDEX IF NOT EXISTS idx_list_views_visibility ON list_views(visibility);

-- Saved filters
CREATE INDEX IF NOT EXISTS idx_saved_filters_created_by ON saved_filters(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_filters_object_type ON saved_filters(object_type);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_object_type ON reports(object_type);
CREATE INDEX IF NOT EXISTS idx_reports_visibility ON reports(visibility);

-- Dashboards
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_visibility ON dashboards(visibility);

-- Dashboard widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);

-- Action item templates
CREATE INDEX IF NOT EXISTS idx_action_item_templates_service_type ON action_item_templates(service_type);

-- Client action items
CREATE INDEX IF NOT EXISTS idx_client_action_items_client_id ON client_action_items(client_id);
CREATE INDEX IF NOT EXISTS idx_client_action_items_status ON client_action_items(status);
CREATE INDEX IF NOT EXISTS idx_client_action_items_due_date ON client_action_items(due_date);

-- Journey milestones
CREATE INDEX IF NOT EXISTS idx_client_journey_milestones_client_id ON client_journey_milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_milestones_phase ON client_journey_milestones(phase);

-- Leads journey
CREATE INDEX IF NOT EXISTS idx_leads_journey_phase ON leads(journey_phase);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_journey_milestones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- User preferences: users can only access their own
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- List views: own + shared/org views
CREATE POLICY "Users can view own and shared list views"
  ON list_views FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR visibility IN ('shared', 'org'));

CREATE POLICY "Users can manage own list views"
  ON list_views FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own list views"
  ON list_views FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own list views"
  ON list_views FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Saved filters: own + shared
CREATE POLICY "Users can view own and shared filters"
  ON saved_filters FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR visibility = 'shared');

CREATE POLICY "Users can manage own filters"
  ON saved_filters FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own filters"
  ON saved_filters FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own filters"
  ON saved_filters FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Reports: own + shared/org
CREATE POLICY "Users can view own and shared reports"
  ON reports FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR visibility IN ('shared', 'org'));

CREATE POLICY "Users can manage own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Dashboards: own + shared/org
CREATE POLICY "Users can view own and shared dashboards"
  ON dashboards FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR visibility IN ('shared', 'org'));

CREATE POLICY "Users can manage own dashboards"
  ON dashboards FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own dashboards"
  ON dashboards FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own dashboards"
  ON dashboards FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Dashboard widgets: inherit from dashboard visibility
CREATE POLICY "Users can view widgets of accessible dashboards"
  ON dashboard_widgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
      AND (d.created_by = auth.uid() OR d.visibility IN ('shared', 'org'))
    )
  );

CREATE POLICY "Users can manage widgets of own dashboards"
  ON dashboard_widgets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
      AND d.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update widgets of own dashboards"
  ON dashboard_widgets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
      AND d.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete widgets of own dashboards"
  ON dashboard_widgets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
      AND d.created_by = auth.uid()
    )
  );

-- Action item templates: authenticated users can manage
CREATE POLICY "Authenticated users can manage action_item_templates"
  ON action_item_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Client action items: authenticated users can manage
CREATE POLICY "Authenticated users can manage client_action_items"
  ON client_action_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Journey milestones: authenticated users can manage
CREATE POLICY "Authenticated users can manage client_journey_milestones"
  ON client_journey_milestones FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- AUTO-COMPLETION TRIGGERS FOR ACTION ITEMS
-- ============================================================================

-- Trigger: Auto-complete intake form action when form is submitted
CREATE OR REPLACE FUNCTION auto_complete_intake_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND (OLD IS NULL OR OLD.status != 'submitted') THEN
    UPDATE client_action_items
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE client_id = NEW.client_id
      AND action_type = 'intake_form'
      AND status IN ('pending', 'in_progress');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS intake_submission_auto_complete ON intake_form_submissions;
CREATE TRIGGER intake_submission_auto_complete
  AFTER INSERT OR UPDATE ON intake_form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_intake_action();

-- Trigger: Auto-complete contract signing action when contract is signed
CREATE OR REPLACE FUNCTION auto_complete_contract_action()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_action_items
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE client_id = NEW.client_id
    AND action_type = 'sign_contract'
    AND status IN ('pending', 'in_progress');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_signature_auto_complete ON contract_signatures;
CREATE TRIGGER contract_signature_auto_complete
  AFTER INSERT ON contract_signatures
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_contract_action();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_list_views_updated_at ON list_views;
CREATE TRIGGER update_list_views_updated_at
  BEFORE UPDATE ON list_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboards_updated_at ON dashboards;
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_widgets_updated_at ON dashboard_widgets;
CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_action_item_templates_updated_at ON action_item_templates;
CREATE TRIGGER update_action_item_templates_updated_at
  BEFORE UPDATE ON action_item_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_action_items_updated_at ON client_action_items;
CREATE TRIGGER update_client_action_items_updated_at
  BEFORE UPDATE ON client_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT DEFAULT ACTION ITEM TEMPLATES
-- ============================================================================

INSERT INTO action_item_templates (name, description, service_type, default_items, is_active)
VALUES
  (
    'Birth Doula Onboarding',
    'Standard action items for new birth doula clients',
    'birth_doula',
    '[
      {"title": "Complete intake form", "action_type": "intake_form", "priority": 10, "action_url": "/client/intake"},
      {"title": "Sign service contract", "action_type": "sign_contract", "priority": 20, "action_url": "/client/services"},
      {"title": "Upload birth preferences", "action_type": "upload_document", "priority": 30, "action_url": "/client/documents"},
      {"title": "Schedule first prenatal visit", "action_type": "schedule_meeting", "priority": 40, "action_url": "/client/meetings"},
      {"title": "Review payment plan", "action_type": "review_document", "priority": 50, "action_url": "/client/invoices"}
    ]'::jsonb,
    true
  ),
  (
    'Postpartum Doula Onboarding',
    'Standard action items for new postpartum doula clients',
    'postpartum_doula',
    '[
      {"title": "Complete intake form", "action_type": "intake_form", "priority": 10, "action_url": "/client/intake"},
      {"title": "Sign service contract", "action_type": "sign_contract", "priority": 20, "action_url": "/client/services"},
      {"title": "Schedule consultation", "action_type": "schedule_meeting", "priority": 30, "action_url": "/client/meetings"},
      {"title": "Review payment plan", "action_type": "review_document", "priority": 40, "action_url": "/client/invoices"}
    ]'::jsonb,
    true
  ),
  (
    'General Client Onboarding',
    'Standard action items for any new client',
    NULL,
    '[
      {"title": "Complete intake form", "action_type": "intake_form", "priority": 10, "action_url": "/client/intake"},
      {"title": "Sign service contract", "action_type": "sign_contract", "priority": 20, "action_url": "/client/services"},
      {"title": "Schedule initial consultation", "action_type": "schedule_meeting", "priority": 30, "action_url": "/client/meetings"}
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_preferences IS 'Stores per-user UI preferences, default views, and dashboard settings';
COMMENT ON TABLE list_views IS 'Saved list views with filters, columns, and sort configuration (like Salesforce list views)';
COMMENT ON TABLE saved_filters IS 'Reusable filter configurations that can be applied to list views';
COMMENT ON TABLE reports IS 'Report configurations for tabular, summary, and chart reports';
COMMENT ON TABLE dashboards IS 'Dashboard definitions with widget layout';
COMMENT ON TABLE dashboard_widgets IS 'Individual widgets within dashboards (metrics, charts, tables, etc.)';
COMMENT ON TABLE action_item_templates IS 'Templates for auto-generating client action items based on service type';
COMMENT ON TABLE client_action_items IS 'Client-facing to-do items with status tracking and auto-completion';
COMMENT ON TABLE client_journey_milestones IS 'Tracks completed milestones in the client journey';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
