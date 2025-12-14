-- ============================================================================
-- Migration: Add stripe_price_id to organizations
-- Tracks the current Stripe price ID for the organization's subscription
-- ============================================================================

-- Add stripe_price_id column to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add index for lookups by price ID (useful for analytics/reporting)
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_price_id
  ON organizations(stripe_price_id)
  WHERE stripe_price_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN organizations.stripe_price_id IS
  'The Stripe price ID for the current subscription plan. Used to track billing period (monthly/yearly) and plan tier.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
