-- ============================================================================
-- Migration: Stripe Payment Rails for Client Invoices
-- Phase D.2: Invoice Payment Link Infrastructure
-- ============================================================================

-- ============================================================================
-- 1. ADD STRIPE CHECKOUT SESSION TO INVOICES
-- ============================================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS checkout_expires_at TIMESTAMPTZ;

-- Index for checkout session lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout_session_id
  ON invoices(stripe_checkout_session_id);

-- ============================================================================
-- 2. PAYMENT EVENTS LOG (for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Reference to invoice
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Stripe event data
  stripe_event_id TEXT UNIQUE,
  stripe_event_type TEXT NOT NULL,

  -- Event details
  event_data JSONB NOT NULL DEFAULT '{}',

  -- Status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_invoice_id ON payment_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event_id ON payment_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(stripe_event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON payment_events(processed);

-- Enable RLS
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view payment_events in their organization"
  ON payment_events FOR ALL
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
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to create a checkout session record
CREATE OR REPLACE FUNCTION create_invoice_checkout_session(
  p_invoice_id UUID,
  p_checkout_session_id TEXT,
  p_checkout_url TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  UPDATE invoices SET
    stripe_checkout_session_id = p_checkout_session_id,
    checkout_url = p_checkout_url,
    checkout_expires_at = COALESCE(p_expires_at, NOW() + INTERVAL '24 hours'),
    status = 'pending'
  WHERE id = p_invoice_id;

  RETURN p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process successful payment
CREATE OR REPLACE FUNCTION process_invoice_payment(
  p_invoice_id UUID,
  p_payment_intent_id TEXT DEFAULT NULL,
  p_amount_paid DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_invoice RECORD;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
  END IF;

  -- Update invoice
  UPDATE invoices SET
    status = 'paid',
    stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
    amount_paid = COALESCE(p_amount_paid, total),
    paid_at = NOW()
  WHERE id = p_invoice_id;

  -- Log activity
  INSERT INTO lead_activities (
    lead_id, activity_type, content, activity_category,
    related_record_type, related_record_id
  )
  VALUES (
    v_invoice.client_id,
    'payment',
    'Invoice ' || v_invoice.invoice_number || ' paid',
    'financial',
    'invoice',
    p_invoice_id
  );

  -- Update client service status if linked
  IF v_invoice.service_id IS NOT NULL THEN
    UPDATE client_services SET
      payment_status = 'paid'
    WHERE id = v_invoice.service_id;
  END IF;

  RETURN p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle checkout expiration
CREATE OR REPLACE FUNCTION expire_checkout_session(
  p_invoice_id UUID
)
RETURNS UUID AS $$
BEGIN
  UPDATE invoices SET
    stripe_checkout_session_id = NULL,
    checkout_url = NULL,
    checkout_expires_at = NULL,
    status = CASE WHEN status = 'pending' THEN 'draft' ELSE status END
  WHERE id = p_invoice_id;

  RETURN p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE payment_events IS 'Audit log of all Stripe payment webhook events';
COMMENT ON COLUMN invoices.stripe_checkout_session_id IS 'Stripe Checkout session ID for payment links';
COMMENT ON COLUMN invoices.checkout_url IS 'Active checkout URL for client payment';
COMMENT ON COLUMN invoices.checkout_expires_at IS 'When the checkout session expires';
