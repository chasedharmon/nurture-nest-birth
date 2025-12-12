-- =====================================================
-- LEAD MIGRATION TRACKING
-- =====================================================
-- This migration adds a column to the legacy leads table
-- to track which leads have been migrated to the CRM system.
-- This enables idempotent migration (can run multiple times safely).
-- =====================================================

-- Add migration tracking column to legacy leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS migrated_to_crm_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL;

-- Create index for efficient lookup of unmigrated leads
CREATE INDEX IF NOT EXISTS idx_leads_migrated_to_crm
ON leads(migrated_to_crm_id)
WHERE migrated_to_crm_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN leads.migrated_to_crm_id IS 'References the crm_leads record this legacy lead was migrated to. NULL means not yet migrated.';
