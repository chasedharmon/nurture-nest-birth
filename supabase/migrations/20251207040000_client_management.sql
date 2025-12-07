-- Phase 3.3: Client Management Tables
-- This migration creates tables for managing client services, meetings, documents, and payments

-- ============================================================================
-- CLIENT SERVICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL,
  package_name VARCHAR(255),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  total_amount DECIMAL(10, 2),
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for client_services
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_status ON client_services(status);
CREATE INDEX IF NOT EXISTS idx_client_services_created_at ON client_services(created_at);

-- Enable RLS on client_services
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to client services" ON client_services;
DROP POLICY IF EXISTS "Clients can view own services" ON client_services;

-- RLS Policies for client_services
CREATE POLICY "Admin full access to client services"
  ON client_services FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can view own services"
  ON client_services FOR SELECT
  USING (client_id = current_setting('app.current_client_id', true)::UUID);

-- ============================================================================
-- MEETINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255),
  meeting_link VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for meetings
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);

-- Enable RLS on meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to meetings" ON meetings;
DROP POLICY IF EXISTS "Clients can view own meetings" ON meetings;

-- RLS Policies for meetings
CREATE POLICY "Admin full access to meetings"
  ON meetings FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can view own meetings"
  ON meetings FOR SELECT
  USING (client_id = current_setting('app.current_client_id', true)::UUID);

-- ============================================================================
-- CLIENT DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(100) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_size_bytes INTEGER,
  file_mime_type VARCHAR(100),
  is_visible_to_client BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for client_documents
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_document_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_at ON client_documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_client_documents_visible ON client_documents(is_visible_to_client);

-- Enable RLS on client_documents
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can view visible documents" ON client_documents;

-- RLS Policies for client_documents
CREATE POLICY "Admin full access to documents"
  ON client_documents FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can view visible documents"
  ON client_documents FOR SELECT
  USING (
    client_id = current_setting('app.current_client_id', true)::UUID
    AND is_visible_to_client = TRUE
  );

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL,
  payment_method VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255),
  payment_date DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_service_id ON payments(service_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to payments" ON payments;
DROP POLICY IF EXISTS "Clients can view own payments" ON payments;

-- RLS Policies for payments
CREATE POLICY "Admin full access to payments"
  ON payments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  USING (client_id = current_setting('app.current_client_id', true)::UUID);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_client_services_updated_at ON client_services;
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
DROP TRIGGER IF EXISTS update_client_documents_updated_at ON client_documents;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

-- Create triggers for updated_at columns
CREATE TRIGGER update_client_services_updated_at
  BEFORE UPDATE ON client_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_documents_updated_at
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE client_services IS 'Services provided to clients (packages, doula services, etc.)';
COMMENT ON TABLE meetings IS 'Scheduled meetings and appointments with clients';
COMMENT ON TABLE client_documents IS 'Documents shared with or from clients';
COMMENT ON TABLE payments IS 'Payment records and transactions for client services';
