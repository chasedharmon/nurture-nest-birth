-- ============================================================================
-- Phase 4.3: Invoices & Contracts Migration
-- Run this migration to add invoice and contract functionality
-- ============================================================================

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,

  -- Invoice identification
  invoice_number TEXT UNIQUE NOT NULL, -- e.g., "INV-2024-001"

  -- Status tracking
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled, refunded

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0, -- e.g., 0.0825 for 8.25%
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total - amount_paid) STORED,

  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Content
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Line item format: [{ description: string, quantity: number, unit_price: number, total: number }]

  notes TEXT, -- Internal notes (admin only)
  client_notes TEXT, -- Notes visible to client (shown on invoice)
  terms TEXT, -- Payment terms

  -- Payment integration fields (for future Stripe)
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_link TEXT,
  payment_method TEXT, -- manual, stripe, check, cash, venmo, etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT invoice_status_check
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partial'))
);

-- Invoice sequence for generating invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_service_id ON invoices(service_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Enable RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
-- Admin can do everything
CREATE POLICY "Admin full access to invoices"
  ON invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Clients can view their own invoices (read-only)
-- Note: Client access is handled through server actions with admin client

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- ============================================================================
-- INVOICE PAYMENTS TABLE (for tracking multiple payments on an invoice)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, check, credit_card, bank_transfer, venmo, paypal, stripe
  payment_reference TEXT, -- Check number, transaction ID, etc.

  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,

  -- Stripe fields
  stripe_payment_id TEXT,
  stripe_charge_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for invoice payments
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- Enable RLS
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Admin access to invoice payments
CREATE POLICY "Admin full access to invoice_payments"
  ON invoice_payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- CONTRACT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT, -- birth_doula, postpartum, lactation, etc. (NULL = general)

  -- Content (supports Markdown)
  content TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default template for service type

  -- Version tracking
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for contract templates
CREATE INDEX IF NOT EXISTS idx_contract_templates_service_type ON contract_templates(service_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_active ON contract_templates(is_active);

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Admin access to contract templates
CREATE POLICY "Admin full access to contract_templates"
  ON contract_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_templates_updated_at ON contract_templates;
CREATE TRIGGER contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_templates_updated_at();

-- ============================================================================
-- CLIENT CONTRACT SIGNATURES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,

  -- Snapshot of signed contract (in case template changes)
  contract_content TEXT NOT NULL,
  contract_version INTEGER,

  -- Signature data
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signer_name TEXT NOT NULL, -- Name as typed by signer
  signer_email TEXT NOT NULL,

  -- Legal tracking
  ip_address INET,
  user_agent TEXT,

  -- For future: actual signature image/data
  signature_data JSONB,

  -- Status
  status TEXT DEFAULT 'signed', -- signed, voided
  voided_at TIMESTAMPTZ,
  voided_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contract signatures
CREATE INDEX IF NOT EXISTS idx_contract_signatures_client_id ON contract_signatures(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_service_id ON contract_signatures(service_id);

-- Enable RLS
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- Admin access to contract signatures
CREATE POLICY "Admin full access to contract_signatures"
  ON contract_signatures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- MODIFY CLIENT_SERVICES TABLE FOR CONTRACT TRACKING
-- ============================================================================

-- Add contract-related columns to client_services if they don't exist
ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS contract_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_signature_id UUID REFERENCES contract_signatures(id);

-- ============================================================================
-- DEFAULT CONTRACT TEMPLATE (Birth Doula)
-- ============================================================================

INSERT INTO contract_templates (name, description, service_type, content, is_default)
VALUES (
  'Birth Doula Services Agreement',
  'Standard contract for birth doula services',
  'birth_doula',
  E'# Birth Doula Services Agreement

## Parties

This agreement is between **Nurture Nest Birth** ("Doula") and the undersigned client ("Client").

## Services Provided

The Doula agrees to provide the following services:

1. **Prenatal Support**
   - Two (2) prenatal visits to discuss birth preferences, fears, and questions
   - Unlimited phone, text, and email support during pregnancy
   - Help creating or reviewing your birth plan

2. **Labor & Birth Support**
   - On-call availability from 38 weeks until birth
   - Continuous physical and emotional support during labor
   - Comfort measures including massage, positioning, breathing techniques
   - Support for your partner/support person
   - Advocacy and communication support with medical staff

3. **Postpartum Support**
   - One (1) postpartum visit within 2 weeks of birth
   - Birth story processing and debriefing
   - Initial breastfeeding support and referrals as needed

## Client Responsibilities

The Client agrees to:
- Communicate openly about preferences, concerns, and medical history
- Notify the Doula of any pregnancy complications
- Contact the Doula at the first signs of labor
- Understand that the Doula does not perform medical tasks

## Fees and Payment

- **Total Fee**: As specified in the service agreement
- **Deposit**: 50% due at signing to reserve your due date
- **Balance**: Due by 36 weeks of pregnancy

## Backup Doula

In the rare event that your Doula is unavailable (illness, another birth), a qualified backup Doula will attend your birth at no additional cost.

## Limitation of Liability

The Doula provides emotional and physical support only. The Doula does not provide medical advice or perform clinical tasks. All medical decisions are between the Client and their healthcare provider.

## Cancellation Policy

- Cancellation before 32 weeks: Full refund minus $100 administrative fee
- Cancellation 32-36 weeks: 50% refund
- Cancellation after 36 weeks: No refund

## Agreement

By signing below, both parties agree to the terms outlined in this agreement.

---

**This agreement is legally binding. Please read carefully before signing.**',
  true
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTION: Generate Invoice Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_part := nextval('invoice_number_seq');
  new_number := 'INV-' || year_part || '-' || LPAD(seq_part::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ACTIVITY LOG TRIGGER FOR INVOICES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_invoice_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'invoice',
      'Invoice ' || NEW.invoice_number || ' created ($' || NEW.total || ')',
      'payment',
      'invoice',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
      VALUES (
        NEW.client_id,
        'invoice',
        'Invoice ' || NEW.invoice_number || ' marked as ' || NEW.status,
        'payment',
        'invoice',
        NEW.id
      );
    END IF;
    -- Log payments
    IF COALESCE(OLD.amount_paid, 0) != COALESCE(NEW.amount_paid, 0) THEN
      INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
      VALUES (
        NEW.client_id,
        'payment',
        'Payment of $' || (NEW.amount_paid - COALESCE(OLD.amount_paid, 0)) || ' received for invoice ' || NEW.invoice_number,
        'payment',
        'invoice',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_activity_log ON invoices;
CREATE TRIGGER invoice_activity_log
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_activity();

-- ============================================================================
-- ACTIVITY LOG TRIGGER FOR CONTRACT SIGNATURES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_contract_signature_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
  VALUES (
    NEW.client_id,
    'contract',
    'Contract signed by ' || NEW.signer_name,
    'document',
    'contract_signature',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_signature_activity_log ON contract_signatures;
CREATE TRIGGER contract_signature_activity_log
  AFTER INSERT ON contract_signatures
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_signature_activity();

-- ============================================================================
-- DONE
-- ============================================================================

-- Verify tables were created
SELECT 'invoices' as table_name, COUNT(*) as row_count FROM invoices
UNION ALL
SELECT 'invoice_payments', COUNT(*) FROM invoice_payments
UNION ALL
SELECT 'contract_templates', COUNT(*) FROM contract_templates
UNION ALL
SELECT 'contract_signatures', COUNT(*) FROM contract_signatures;
