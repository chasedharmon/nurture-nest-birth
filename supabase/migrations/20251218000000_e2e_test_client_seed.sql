-- ============================================================================
-- Migration: E2E Test Client Seed
-- Creates a test client account for E2E testing purposes
-- This client can be used with password123 in development mode
-- ============================================================================

-- Insert test client for E2E testing
-- Note: The client auth system allows password123 as a fallback in dev mode
-- for any account that doesn't have a password_hash set

INSERT INTO leads (
  id,
  source,
  status,
  name,
  email,
  phone,
  message,
  organization_id
)
SELECT
  'e2e-test-client-00000000-0000-0000-0000'::UUID,
  'manual'::lead_source,
  'client'::lead_status,
  'E2E Test Client',
  'e2e-test-client@example.com',
  '(555) 123-4567',
  'Test client account for E2E automated testing',
  (SELECT id FROM organizations LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM leads WHERE email = 'e2e-test-client@example.com'
);

-- Also ensure the existing test client email exists (used in existing tests)
INSERT INTO leads (
  id,
  source,
  status,
  name,
  email,
  phone,
  message,
  organization_id
)
SELECT
  'e2e-mak-client-00000000-0000-0000-0001'::UUID,
  'manual'::lead_source,
  'client'::lead_status,
  'Mak Harmon (Test)',
  'makharmon@kearneycats.com',
  '(308) 440-5153',
  'Test client account for E2E automated testing',
  (SELECT id FROM organizations LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM leads WHERE email = 'makharmon@kearneycats.com'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE leads IS 'Leads/clients including E2E test accounts. Test clients can use password123 in dev mode.';
