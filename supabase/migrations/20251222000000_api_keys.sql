-- ============================================================================
-- Migration: API Keys Management
-- Creates tables for API key generation, permissions, and usage tracking
-- ============================================================================

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key identification
  name TEXT NOT NULL,
  description TEXT,

  -- The actual key - only the hash is stored, prefix for identification
  key_prefix TEXT NOT NULL, -- First 8 chars of key for identification (e.g., "nn_live_")
  key_hash TEXT NOT NULL,   -- SHA-256 hash of the full key

  -- Permissions (JSONB for flexibility)
  -- Format: { "leads": ["read", "create"], "invoices": ["read"], ... }
  permissions JSONB DEFAULT '{}'::jsonb,

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Status and lifecycle
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ, -- NULL means no expiration
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason TEXT
);

-- Create indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE api_keys IS 'API keys for external integrations. Keys are hashed, only prefix is stored for identification.';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of the key (e.g., "nn_live_") for display identification';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the complete API key';
COMMENT ON COLUMN api_keys.permissions IS 'JSON object mapping resources to allowed actions: {"leads": ["read","create"], "invoices": ["read"]}';

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view API keys for their organization
CREATE POLICY "Users can view org API keys"
  ON api_keys FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Users can create API keys for their organization
CREATE POLICY "Users can create org API keys"
  ON api_keys FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Users can update API keys for their organization
CREATE POLICY "Users can update org API keys"
  ON api_keys FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL)
  WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Users can delete API keys for their organization
CREATE POLICY "Users can delete org API keys"
  ON api_keys FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- ============================================================================
-- API Key Usage Tracking
-- Tracks every API call for rate limiting and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,

  -- Rate limiting window tracking
  request_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for usage tracking and rate limiting
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_id ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp ON api_key_usage(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_timestamp ON api_key_usage(api_key_id, request_timestamp DESC);

-- Partition-friendly index for time-based queries
CREATE INDEX IF NOT EXISTS idx_api_key_usage_minute ON api_key_usage(api_key_id, request_timestamp)
  WHERE request_timestamp > NOW() - INTERVAL '1 hour';

COMMENT ON TABLE api_key_usage IS 'Tracks API key usage for rate limiting and analytics. Consider partitioning for high volume.';

-- Enable RLS on api_key_usage
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- Users can view usage for API keys they own
CREATE POLICY "Users can view API key usage"
  ON api_key_usage FOR SELECT TO authenticated
  USING (
    api_key_id IN (
      SELECT id FROM api_keys
      WHERE organization_id = get_user_organization_id()
         OR organization_id IS NULL
    )
  );

-- Service role can insert usage records
CREATE POLICY "Service role can insert usage"
  ON api_key_usage FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check rate limits for an API key
CREATE OR REPLACE FUNCTION check_api_key_rate_limit(
  p_api_key_id UUID
) RETURNS TABLE (
  within_minute_limit BOOLEAN,
  within_hour_limit BOOLEAN,
  within_day_limit BOOLEAN,
  requests_this_minute INTEGER,
  requests_this_hour INTEGER,
  requests_this_day INTEGER,
  minute_limit INTEGER,
  hour_limit INTEGER,
  day_limit INTEGER
) AS $$
DECLARE
  v_minute_limit INTEGER;
  v_hour_limit INTEGER;
  v_day_limit INTEGER;
  v_minute_count INTEGER;
  v_hour_count INTEGER;
  v_day_count INTEGER;
BEGIN
  -- Get the rate limits for this key
  SELECT
    rate_limit_per_minute,
    rate_limit_per_hour,
    rate_limit_per_day
  INTO v_minute_limit, v_hour_limit, v_day_limit
  FROM api_keys
  WHERE id = p_api_key_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false, false, false,
      0, 0, 0,
      0, 0, 0;
    RETURN;
  END IF;

  -- Count requests in each window
  SELECT COUNT(*) INTO v_minute_count
  FROM api_key_usage
  WHERE api_key_id = p_api_key_id
    AND request_timestamp > NOW() - INTERVAL '1 minute';

  SELECT COUNT(*) INTO v_hour_count
  FROM api_key_usage
  WHERE api_key_id = p_api_key_id
    AND request_timestamp > NOW() - INTERVAL '1 hour';

  SELECT COUNT(*) INTO v_day_count
  FROM api_key_usage
  WHERE api_key_id = p_api_key_id
    AND request_timestamp > NOW() - INTERVAL '1 day';

  RETURN QUERY SELECT
    v_minute_count < v_minute_limit,
    v_hour_count < v_hour_limit,
    v_day_count < v_day_limit,
    v_minute_count,
    v_hour_count,
    v_day_count,
    v_minute_limit,
    v_hour_limit,
    v_day_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_api_key_rate_limit(UUID) IS 'Checks if an API key is within its rate limits. Returns current counts and whether limits are exceeded.';

-- Function to validate an API key and return its details
CREATE OR REPLACE FUNCTION validate_api_key(
  p_key_hash TEXT
) RETURNS TABLE (
  api_key_id UUID,
  organization_id UUID,
  permissions JSONB,
  is_valid BOOLEAN,
  rejection_reason TEXT
) AS $$
DECLARE
  v_key api_keys%ROWTYPE;
BEGIN
  -- Find the key by hash
  SELECT * INTO v_key
  FROM api_keys
  WHERE key_hash = p_key_hash;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::UUID, NULL::UUID, NULL::JSONB,
      false, 'Invalid API key'::TEXT;
    RETURN;
  END IF;

  -- Check if active
  IF NOT v_key.is_active THEN
    RETURN QUERY SELECT
      v_key.id, v_key.organization_id, v_key.permissions,
      false, 'API key is inactive'::TEXT;
    RETURN;
  END IF;

  -- Check if revoked
  IF v_key.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT
      v_key.id, v_key.organization_id, v_key.permissions,
      false, 'API key has been revoked'::TEXT;
    RETURN;
  END IF;

  -- Check if expired
  IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
    RETURN QUERY SELECT
      v_key.id, v_key.organization_id, v_key.permissions,
      false, 'API key has expired'::TEXT;
    RETURN;
  END IF;

  -- Update last used timestamp
  UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key.id;

  -- Key is valid
  RETURN QUERY SELECT
    v_key.id, v_key.organization_id, v_key.permissions,
    true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_api_key(TEXT) IS 'Validates an API key hash and returns its details. Updates last_used_at on successful validation.';

-- ============================================================================
-- Cleanup old usage data (for scheduled job)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_api_key_usage(
  p_retention_days INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_key_usage
  WHERE request_timestamp < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_api_key_usage(INTEGER) IS 'Removes API key usage records older than the specified retention period (default 30 days).';
