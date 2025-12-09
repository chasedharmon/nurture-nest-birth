-- ============================================================================
-- Migration: SMS Templates and Opt-In Management
-- Phase D.1: SMS Infrastructure Rails
-- ============================================================================

-- ============================================================================
-- 1. SMS TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',

  -- Template content
  content TEXT NOT NULL,
  available_variables TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sms_template_category_check
    CHECK (category IN (
      'appointment', 'reminder', 'confirmation', 'follow_up',
      'payment', 'general', 'intake', 'welcome'
    )),
  CONSTRAINT sms_template_content_length
    CHECK (char_length(content) <= 1600)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_templates_org_id ON sms_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_active ON sms_templates(is_active);

-- Enable RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage templates in their organization
CREATE POLICY "Users can manage sms_templates in their organization"
  ON sms_templates FOR ALL
  TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. SMS OPT-IN/OPT-OUT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Phone number (E.164 format)
  phone_number TEXT NOT NULL,

  -- Consent status
  opted_in BOOLEAN NOT NULL DEFAULT false,
  opt_in_date TIMESTAMPTZ,
  opt_out_date TIMESTAMPTZ,

  -- Source of consent/withdrawal
  source TEXT NOT NULL DEFAULT 'web_form',

  -- Link to client if known
  client_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sms_consent_source_check
    CHECK (source IN ('web_form', 'sms_reply', 'manual', 'import')),

  -- Unique phone per org
  UNIQUE(org_id, phone_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_consent_org_id ON sms_consent(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_consent_phone ON sms_consent(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_consent_client_id ON sms_consent(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_consent_opted_in ON sms_consent(opted_in);

-- Enable RLS
ALTER TABLE sms_consent ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage sms_consent in their organization"
  ON sms_consent FOR ALL
  TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. SMS MESSAGE LOG (for tracking sent messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Message details
  to_phone TEXT NOT NULL,
  from_phone TEXT,
  body TEXT NOT NULL,

  -- Template reference (optional)
  template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,

  -- Client reference (optional)
  client_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Workflow reference (optional)
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,

  -- External provider details
  external_id TEXT, -- Twilio message SID
  segment_count INTEGER DEFAULT 1,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'queued',
  status_updated_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sms_message_status_check
    CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'undelivered'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_org_id ON sms_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_client_id ON sms_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_template_id ON sms_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sent_at ON sms_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_messages_external_id ON sms_messages(external_id);

-- Enable RLS
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view sms_messages in their organization"
  ON sms_messages FOR ALL
  TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to check SMS consent
CREATE OR REPLACE FUNCTION check_sms_consent(
  p_phone_number TEXT,
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sms_consent
    WHERE phone_number = p_phone_number
      AND (p_org_id IS NULL OR org_id = p_org_id)
      AND opted_in = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record SMS consent
CREATE OR REPLACE FUNCTION record_sms_consent(
  p_phone_number TEXT,
  p_opted_in BOOLEAN,
  p_source TEXT DEFAULT 'web_form',
  p_org_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO sms_consent (
    phone_number, opted_in, source, org_id, client_id,
    opt_in_date, opt_out_date
  )
  VALUES (
    p_phone_number,
    p_opted_in,
    p_source,
    p_org_id,
    p_client_id,
    CASE WHEN p_opted_in THEN NOW() ELSE NULL END,
    CASE WHEN NOT p_opted_in THEN NOW() ELSE NULL END
  )
  ON CONFLICT (org_id, phone_number) DO UPDATE SET
    opted_in = EXCLUDED.opted_in,
    source = EXCLUDED.source,
    client_id = COALESCE(EXCLUDED.client_id, sms_consent.client_id),
    opt_in_date = CASE WHEN EXCLUDED.opted_in AND NOT sms_consent.opted_in THEN NOW() ELSE sms_consent.opt_in_date END,
    opt_out_date = CASE WHEN NOT EXCLUDED.opted_in AND sms_consent.opted_in THEN NOW() ELSE sms_consent.opt_out_date END,
    updated_at = NOW()
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log SMS message
CREATE OR REPLACE FUNCTION log_sms_message(
  p_to_phone TEXT,
  p_body TEXT,
  p_org_id UUID DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_workflow_execution_id UUID DEFAULT NULL,
  p_external_id TEXT DEFAULT NULL,
  p_segment_count INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO sms_messages (
    to_phone, body, org_id, template_id, client_id,
    workflow_execution_id, external_id, segment_count, status
  )
  VALUES (
    p_to_phone, p_body, p_org_id, p_template_id, p_client_id,
    p_workflow_execution_id, p_external_id, p_segment_count, 'sent'
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. INSERT DEFAULT SMS TEMPLATES
-- ============================================================================

INSERT INTO sms_templates (name, description, category, content, available_variables, is_active, is_default)
SELECT
  'Appointment Reminder (24h)',
  'Sent 24 hours before an appointment',
  'reminder',
  'Hi {{first_name}}, this is a reminder of your appointment with {{doula_name}} tomorrow at {{appointment_time}}. Reply CONFIRM to confirm or call us to reschedule.',
  ARRAY['first_name', 'doula_name', 'appointment_time'],
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Appointment Reminder (24h)' AND org_id IS NULL
);

INSERT INTO sms_templates (name, description, category, content, available_variables, is_active, is_default)
SELECT
  'Appointment Confirmation',
  'Sent when an appointment is booked',
  'confirmation',
  'Hi {{first_name}}! Your appointment with {{doula_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Looking forward to seeing you!',
  ARRAY['first_name', 'doula_name', 'appointment_date', 'appointment_time'],
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Appointment Confirmation' AND org_id IS NULL
);

INSERT INTO sms_templates (name, description, category, content, available_variables, is_active, is_default)
SELECT
  'Welcome Message',
  'Sent to new clients after booking',
  'welcome',
  E'Welcome to {{doula_name}}, {{first_name}}! We''re so excited to support you on your journey. Access your client portal anytime: {{portal_url}}',
  ARRAY['first_name', 'doula_name', 'portal_url'],
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Welcome Message' AND org_id IS NULL
);

INSERT INTO sms_templates (name, description, category, content, available_variables, is_active, is_default)
SELECT
  'Payment Reminder',
  'Reminder for upcoming or overdue payments',
  'payment',
  'Hi {{first_name}}, this is a friendly reminder that {{amount_due}} is due for {{service_name}}. Pay securely here: {{payment_link}}',
  ARRAY['first_name', 'amount_due', 'service_name', 'payment_link'],
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Payment Reminder' AND org_id IS NULL
);

INSERT INTO sms_templates (name, description, category, content, available_variables, is_active, is_default)
SELECT
  'Intake Form Request',
  'Request to complete intake forms',
  'intake',
  'Hi {{first_name}}, please complete your intake forms before your first appointment. You can access them in your client portal: {{portal_url}}',
  ARRAY['first_name', 'portal_url'],
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Intake Form Request' AND org_id IS NULL
);

INSERT INTO sms_templates (name, description, category, content, available_variables, is_active, is_default)
SELECT
  'Post-Appointment Follow-up',
  'Sent after an appointment',
  'follow_up',
  E'Hi {{first_name}}, it was wonderful to meet with you today! If you have any questions, don''t hesitate to reach out. - {{doula_name}}',
  ARRAY['first_name', 'doula_name'],
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Post-Appointment Follow-up' AND org_id IS NULL
);

-- ============================================================================
-- 6. UPDATE TRIGGERS
-- ============================================================================

-- Updated_at trigger for sms_templates
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for sms_consent
CREATE TRIGGER update_sms_consent_updated_at
  BEFORE UPDATE ON sms_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE sms_templates IS 'SMS message templates with variable interpolation support';
COMMENT ON TABLE sms_consent IS 'Tracks SMS opt-in/opt-out consent by phone number';
COMMENT ON TABLE sms_messages IS 'Log of all SMS messages sent through the system';
