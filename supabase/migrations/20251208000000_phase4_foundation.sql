-- Phase 4 Database Migration: Foundation for Self-Service & Notifications
-- This migration adds client sessions, notifications, intake forms, and invoices

-- ============================================================================
-- 1. CLIENT SESSIONS TABLE (Replaces cookie-only auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for client_sessions
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_id ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires_at ON client_sessions(expires_at);

-- RLS for client_sessions (service role only - managed server-side)
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sessions"
  ON client_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. EXTEND LEADS TABLE FOR AUTH
-- ============================================================================

-- Add password hash column for optional password auth
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ============================================================================
-- 3. NOTIFICATION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT notification_channel_check
    CHECK (channel IN ('email', 'sms')),
  CONSTRAINT notification_status_check
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'))
);

-- Indexes for notification_log
CREATE INDEX IF NOT EXISTS idx_notification_log_client_id ON notification_log(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at DESC);

-- RLS for notification_log
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage notifications"
  ON notification_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_reminders BOOLEAN DEFAULT true,
  document_notifications BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  reminder_hours_before INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. INTAKE FORM TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS intake_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_schema JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_intake_form_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_intake_form_templates_updated_at
  BEFORE UPDATE ON intake_form_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_intake_form_templates_updated_at();

-- RLS for intake_form_templates
ALTER TABLE intake_form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage templates"
  ON intake_form_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. INTAKE FORM SUBMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS intake_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_id UUID REFERENCES intake_form_templates(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT intake_submission_status_check
    CHECK (status IN ('draft', 'submitted', 'reviewed', 'archived'))
);

-- Indexes for intake_form_submissions
CREATE INDEX IF NOT EXISTS idx_intake_submissions_client_id ON intake_form_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_template_id ON intake_form_submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_status ON intake_form_submissions(status);

-- RLS for intake_form_submissions
ALTER TABLE intake_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage submissions"
  ON intake_form_submissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. INVOICES TABLE
-- ============================================================================

-- Create invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft',

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,

  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,

  -- Content
  line_items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  terms TEXT,

  -- Payment integration fields (for future Stripe)
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_link TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT invoice_status_check
    CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'))
);

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_part := LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
  RETURN 'INV-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_service_id ON invoices(service_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 8. CONTRACT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  service_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_templates_updated_at();

-- RLS for contract_templates
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contract templates"
  ON contract_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. EXTEND CLIENT_SERVICES FOR E-SIGNATURES
-- ============================================================================

ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS contract_signed_ip INET,
  ADD COLUMN IF NOT EXISTS contract_signed_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS contract_signature_data JSONB,
  ADD COLUMN IF NOT EXISTS contract_template_id UUID REFERENCES contract_templates(id);

-- ============================================================================
-- 10. INSERT DEFAULT INTAKE FORM TEMPLATE
-- ============================================================================

INSERT INTO intake_form_templates (name, description, form_schema, is_active, is_default, display_order)
VALUES (
  'New Client Intake',
  'Standard intake form for new doula clients',
  '{
    "sections": [
      {
        "id": "personal",
        "title": "Personal Information",
        "fields": [
          {"id": "preferred_name", "label": "Preferred Name/Nickname", "type": "text", "required": false},
          {"id": "pronouns", "label": "Pronouns", "type": "text", "required": false},
          {"id": "birth_date", "label": "Your Date of Birth", "type": "date", "required": false},
          {"id": "partner_name", "label": "Partner/Support Person Name", "type": "text", "required": false},
          {"id": "partner_phone", "label": "Partner/Support Person Phone", "type": "tel", "required": false}
        ]
      },
      {
        "id": "pregnancy",
        "title": "Pregnancy Information",
        "fields": [
          {"id": "due_date", "label": "Estimated Due Date", "type": "date", "required": true},
          {"id": "first_pregnancy", "label": "Is this your first pregnancy?", "type": "select", "options": ["Yes", "No"], "required": true},
          {"id": "previous_births", "label": "If no, please describe previous birth experiences", "type": "textarea", "required": false, "showIf": {"field": "first_pregnancy", "value": "No"}},
          {"id": "multiples", "label": "Are you expecting multiples?", "type": "select", "options": ["No", "Twins", "Triplets or more"], "required": true}
        ]
      },
      {
        "id": "medical",
        "title": "Medical Information",
        "fields": [
          {"id": "provider_name", "label": "OB/GYN or Midwife Name", "type": "text", "required": true},
          {"id": "provider_practice", "label": "Practice/Clinic Name", "type": "text", "required": false},
          {"id": "birth_location", "label": "Planned Birth Location", "type": "select", "options": ["Hospital", "Birth Center", "Home", "Undecided"], "required": true},
          {"id": "hospital_name", "label": "Hospital/Birth Center Name", "type": "text", "required": false},
          {"id": "high_risk", "label": "Has your pregnancy been classified as high-risk?", "type": "select", "options": ["No", "Yes"], "required": true},
          {"id": "high_risk_details", "label": "If yes, please explain", "type": "textarea", "required": false, "showIf": {"field": "high_risk", "value": "Yes"}},
          {"id": "health_conditions", "label": "Any health conditions we should know about?", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "preferences",
        "title": "Birth Preferences",
        "fields": [
          {"id": "pain_management", "label": "Pain management preferences", "type": "multiselect", "options": ["Natural/unmedicated", "Open to epidural", "Definitely want epidural", "Undecided"], "required": false},
          {"id": "important_aspects", "label": "What aspects of birth are most important to you?", "type": "textarea", "required": false},
          {"id": "concerns", "label": "What are your biggest concerns or fears about birth?", "type": "textarea", "required": false},
          {"id": "support_style", "label": "How do you like to be supported during stressful situations?", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "postpartum",
        "title": "Postpartum Planning",
        "fields": [
          {"id": "feeding_plan", "label": "Infant feeding plans", "type": "multiselect", "options": ["Breastfeeding/chestfeeding", "Formula feeding", "Combination", "Undecided"], "required": false},
          {"id": "lactation_support", "label": "Interested in lactation support?", "type": "select", "options": ["Yes", "No", "Maybe"], "required": false},
          {"id": "postpartum_support", "label": "Will you have support at home after birth?", "type": "textarea", "required": false},
          {"id": "other_children", "label": "Do you have other children at home?", "type": "text", "required": false}
        ]
      },
      {
        "id": "emergency",
        "title": "Emergency Contact",
        "fields": [
          {"id": "emergency_name", "label": "Emergency Contact Name", "type": "text", "required": true},
          {"id": "emergency_phone", "label": "Emergency Contact Phone", "type": "tel", "required": true},
          {"id": "emergency_relationship", "label": "Relationship to You", "type": "text", "required": true}
        ]
      },
      {
        "id": "additional",
        "title": "Additional Information",
        "fields": [
          {"id": "how_found", "label": "How did you hear about us?", "type": "select", "options": ["Google search", "Social media", "Friend/family referral", "Healthcare provider", "Other"], "required": false},
          {"id": "questions", "label": "Any questions or anything else you would like us to know?", "type": "textarea", "required": false}
        ]
      }
    ]
  }'::JSONB,
  true,
  true,
  1
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. FUNCTION TO CLEAN UP EXPIRED SESSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM client_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Phase 4 Migration - Self-Service & Notifications Foundation (20251208000000)';
