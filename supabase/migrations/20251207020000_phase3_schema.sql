-- Phase 3.1 Database Migration: Enhanced CRM Schema
-- This migration extends the existing schema for comprehensive client management

-- ============================================================================
-- 1. EXTEND LEADS TABLE (Make it the complete client record)
-- ============================================================================

-- Add new columns to leads table for comprehensive client information
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS birth_preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medical_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expected_due_date DATE,
  ADD COLUMN IF NOT EXISTS actual_birth_date DATE,
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'lead';

-- Rename due_date to expected_due_date for existing rows (if needed)
-- First check if expected_due_date is null and due_date exists
UPDATE leads
SET expected_due_date = due_date
WHERE expected_due_date IS NULL AND due_date IS NOT NULL;

-- Add check constraints
ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS client_type_check
    CHECK (client_type IN ('lead', 'expecting', 'postpartum', 'past_client')),
  ADD CONSTRAINT IF NOT EXISTS lifecycle_stage_check
    CHECK (lifecycle_stage IN ('lead', 'consultation_scheduled', 'active_client', 'past_client', 'inactive'));

-- Create index for lifecycle_stage for dashboard queries
CREATE INDEX IF NOT EXISTS idx_leads_lifecycle_stage ON leads(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_leads_client_type ON leads(client_type);

-- ============================================================================
-- 2. CLIENT SERVICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  package_name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  contract_signed BOOLEAN DEFAULT false,
  contract_url TEXT,
  price DECIMAL(10,2),
  payment_status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT service_type_check
    CHECK (service_type IN ('birth_doula', 'postpartum_doula', 'lactation_consulting', 'childbirth_education', 'other')),
  CONSTRAINT service_status_check
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  CONSTRAINT payment_status_check
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded'))
);

-- Indexes for client_services
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_status ON client_services(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_client_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_services_updated_at
  BEFORE UPDATE ON client_services
  FOR EACH ROW
  EXECUTE FUNCTION update_client_services_updated_at();

-- RLS Policies for client_services
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all services"
  ON client_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert services"
  ON client_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update services"
  ON client_services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete services"
  ON client_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 3. MEETINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  meeting_notes TEXT,
  preparation_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT meeting_type_check
    CHECK (meeting_type IN ('consultation', 'prenatal', 'birth', 'postpartum', 'follow_up', 'other')),
  CONSTRAINT meeting_status_check
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
);

-- Indexes for meetings
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- RLS Policies for meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all meetings"
  ON meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update meetings"
  ON meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete meetings"
  ON meetings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 4. CLIENT DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_client_visible BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT document_type_check
    CHECK (document_type IN ('contract', 'birth_plan', 'resource', 'photo', 'invoice', 'form', 'other'))
);

-- Indexes for client_documents
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_visible ON client_documents(is_client_visible);

-- RLS Policies for client_documents
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all documents"
  ON client_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert documents"
  ON client_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update documents"
  ON client_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete documents"
  ON client_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 5. PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT payment_method_check
    CHECK (payment_method IN ('stripe', 'check', 'cash', 'venmo', 'zelle', 'other')),
  CONSTRAINT payment_status_check
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_service_id ON payments(service_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- RLS Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete payments"
  ON payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 6. ENHANCE ACTIVITY STREAM
-- ============================================================================

-- Add new columns to lead_activities for enhanced activity stream
ALTER TABLE lead_activities
  ADD COLUMN IF NOT EXISTS activity_category TEXT DEFAULT 'communication',
  ADD COLUMN IF NOT EXISTS related_record_type TEXT,
  ADD COLUMN IF NOT EXISTS related_record_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_client_visible BOOLEAN DEFAULT false;

-- Add constraint for activity_category
ALTER TABLE lead_activities
  ADD CONSTRAINT IF NOT EXISTS activity_category_check
    CHECK (activity_category IN ('communication', 'milestone', 'system', 'document', 'payment', 'meeting'));

-- Add constraint for related_record_type
ALTER TABLE lead_activities
  ADD CONSTRAINT IF NOT EXISTS related_record_type_check
    CHECK (related_record_type IS NULL OR related_record_type IN ('service', 'meeting', 'payment', 'document'));

-- Create index for pinned activities
CREATE INDEX IF NOT EXISTS idx_lead_activities_pinned ON lead_activities(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_lead_activities_category ON lead_activities(activity_category);

-- ============================================================================
-- 7. AUTOMATED ACTIVITY LOGGING TRIGGERS
-- ============================================================================

-- Function to log service activities
CREATE OR REPLACE FUNCTION log_service_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'system',
      'New service added: ' || NEW.service_type || COALESCE(' - ' || NEW.package_name, ''),
      'milestone',
      'service',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'system',
      'Service status changed: ' || OLD.status || ' → ' || NEW.status,
      'milestone',
      'service',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.contract_signed = false AND NEW.contract_signed = true) THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'system',
      'Contract signed for ' || NEW.service_type,
      'milestone',
      'service',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_service_activity
  AFTER INSERT OR UPDATE ON client_services
  FOR EACH ROW
  EXECUTE FUNCTION log_service_activity();

-- Function to log meeting activities
CREATE OR REPLACE FUNCTION log_meeting_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'meeting',
      NEW.meeting_type || ' scheduled for ' || TO_CHAR(NEW.scheduled_at, 'Mon DD, YYYY at HH12:MI AM'),
      'meeting',
      'meeting',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'meeting',
      NEW.meeting_type || ' ' || NEW.status,
      'meeting',
      'meeting',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_meeting_activity
  AFTER INSERT OR UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION log_meeting_activity();

-- Function to log document activities
CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'system',
      'Document uploaded: ' || NEW.title || ' (' || NEW.document_type || ')',
      'document',
      'document',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_document_activity
  AFTER INSERT ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_activity();

-- Function to log payment activities
CREATE OR REPLACE FUNCTION log_payment_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'system',
      'Payment ' || NEW.status || ': $' || NEW.amount || COALESCE(' via ' || NEW.payment_method, ''),
      'payment',
      'payment',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'system',
      'Payment status changed: ' || OLD.status || ' → ' || NEW.status || ' ($' || NEW.amount || ')',
      'payment',
      'payment',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_payment_activity
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_activity();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add a comment to track migration version
COMMENT ON SCHEMA public IS 'Phase 3.1 Migration - Enhanced CRM Schema (20251207020000)';
