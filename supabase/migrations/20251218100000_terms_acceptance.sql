-- ============================================================================
-- Migration: Terms of Service Acceptance Tracking
-- Adds fields to track user acceptance of Terms of Service and Privacy Policy
-- ============================================================================

-- Add terms acceptance columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT DEFAULT '1.0';

-- Create index for querying users who haven't accepted terms
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted
  ON users(terms_accepted_at)
  WHERE terms_accepted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user accepted Terms of Service. NULL means not yet accepted.';
COMMENT ON COLUMN users.terms_version IS 'Version of Terms of Service that was accepted. Used to prompt re-acceptance when terms change.';
COMMENT ON COLUMN users.privacy_accepted_at IS 'Timestamp when user accepted Privacy Policy. NULL means not yet accepted.';
COMMENT ON COLUMN users.privacy_version IS 'Version of Privacy Policy that was accepted.';

-- ============================================================================
-- Helper function to check if user has accepted current terms
-- ============================================================================

CREATE OR REPLACE FUNCTION has_accepted_current_terms(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_terms_version TEXT := '1.0';  -- Update this when terms change
  user_terms_version TEXT;
  user_terms_accepted TIMESTAMPTZ;
BEGIN
  SELECT terms_version, terms_accepted_at INTO user_terms_version, user_terms_accepted
  FROM users
  WHERE id = user_id;

  -- User must have accepted AND their version must match current version
  RETURN user_terms_accepted IS NOT NULL AND user_terms_version = current_terms_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION has_accepted_current_terms(UUID) IS 'Checks if user has accepted the current version of Terms of Service.';

-- ============================================================================
-- Migration complete - update existing users to have accepted terms
-- (existing users are grandfathered in since they used the platform before terms existed)
-- ============================================================================

-- Note: We do NOT auto-accept for existing users. They will be prompted on next login.
-- If you want to grandfather existing users, uncomment the following:
--
-- UPDATE users
-- SET
--   terms_accepted_at = created_at,
--   terms_version = '1.0',
--   privacy_accepted_at = created_at,
--   privacy_version = '1.0'
-- WHERE terms_accepted_at IS NULL;
