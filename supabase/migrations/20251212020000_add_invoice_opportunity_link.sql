-- =====================================================
-- PHASE 10: LINK INVOICES TO CRM OPPORTUNITIES
-- =====================================================
-- This migration adds a foreign key relationship between
-- invoices and CRM opportunities, enabling automatic
-- invoice generation when opportunities close.
-- =====================================================

-- Add opportunity_id column to invoices if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'opportunity_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN opportunity_id UUID;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_opportunity_id_fkey'
  ) THEN
    ALTER TABLE invoices
    ADD CONSTRAINT invoices_opportunity_id_fkey
    FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_opportunity_id ON invoices(opportunity_id)
  WHERE opportunity_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN invoices.opportunity_id IS
'Links invoice to the CRM opportunity it was generated from. NULL for invoices created outside the CRM.';
