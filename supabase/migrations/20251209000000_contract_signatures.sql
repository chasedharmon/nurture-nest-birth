-- ============================================================================
-- Migration: Contract Signatures Table
-- This adds the missing contract_signatures table referenced by the Contracts tab
-- ============================================================================

-- ============================================================================
-- 1. CONTRACT SIGNATURES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,

  -- Snapshot of signed contract (in case template changes)
  contract_content TEXT NOT NULL,
  contract_version INTEGER DEFAULT 1,

  -- Signature data
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,

  -- Legal tracking
  ip_address INET,
  user_agent TEXT,

  -- For future: actual signature image/data
  signature_data JSONB,

  -- Status
  status TEXT DEFAULT 'signed',
  voided_at TIMESTAMPTZ,
  voided_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT contract_signature_status_check
    CHECK (status IN ('signed', 'voided'))
);

-- Indexes for contract signatures
CREATE INDEX IF NOT EXISTS idx_contract_signatures_client_id ON contract_signatures(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_service_id ON contract_signatures(service_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_template_id ON contract_signatures(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_status ON contract_signatures(status);

-- Enable RLS
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can manage contract signatures
CREATE POLICY "Authenticated users can manage contract_signatures"
  ON contract_signatures FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. ADD CONTRACT SIGNATURE REFERENCE TO CLIENT_SERVICES
-- ============================================================================

ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS contract_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS contract_signature_id UUID REFERENCES contract_signatures(id);

-- ============================================================================
-- 3. ACTIVITY LOG TRIGGER FOR CONTRACT SIGNATURES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_contract_signature_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'contract',
      'Contract signed by ' || NEW.signer_name,
      'document',
      'contract_signature',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'voided') THEN
    INSERT INTO lead_activities (lead_id, activity_type, content, activity_category, related_record_type, related_record_id)
    VALUES (
      NEW.client_id,
      'contract',
      'Contract voided: ' || COALESCE(NEW.voided_reason, 'No reason provided'),
      'document',
      'contract_signature',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_signature_activity_log ON contract_signatures;
CREATE TRIGGER contract_signature_activity_log
  AFTER INSERT OR UPDATE ON contract_signatures
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_signature_activity();

-- ============================================================================
-- 4. INSERT DEFAULT BIRTH DOULA CONTRACT TEMPLATE (if not exists)
-- ============================================================================

INSERT INTO contract_templates (name, description, service_type, content, is_active)
SELECT
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
WHERE NOT EXISTS (
  SELECT 1 FROM contract_templates WHERE service_type = 'birth_doula'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE contract_signatures IS 'Stores signed contracts with legal tracking (IP, user agent, timestamp)';
