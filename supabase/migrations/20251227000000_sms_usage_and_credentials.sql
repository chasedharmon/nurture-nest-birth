-- ============================================================================
-- Migration: SMS Usage Tracking and Hybrid Credential Storage
-- Phase 3: Communication Activation
-- ============================================================================
-- This migration adds:
-- 1. SMS usage tracking per billing period (for soft limits and overage billing)
-- 2. Hybrid credential storage (platform-provided OR tenant BYOT)
-- 3. SMS configuration per organization
-- ============================================================================

-- ============================================================================
-- 1. SMS CREDENTIALS TABLE (for BYOT - Bring Your Own Twilio)
-- ============================================================================
-- Stores encrypted Twilio credentials for organizations that want to use
-- their own Twilio account instead of platform-provided SMS.

CREATE TABLE IF NOT EXISTS sms_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Credential type
  provider TEXT NOT NULL DEFAULT 'twilio',

  -- Twilio credentials (encrypted at rest by Supabase)
  -- In production, consider using Vault for additional encryption
  account_sid TEXT NOT NULL,
  auth_token TEXT NOT NULL,  -- Should be encrypted
  phone_number TEXT NOT NULL,  -- E.164 format sending number

  -- Optional: Messaging Service SID for advanced features
  messaging_service_sid TEXT,

  -- Webhook configuration
  status_callback_url TEXT,

  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_verification_error TEXT,

  -- Usage mode
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One set of credentials per org
  UNIQUE(organization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_credentials_org_id ON sms_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_credentials_is_active ON sms_credentials(is_active);

-- Enable RLS
ALTER TABLE sms_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only org admins can manage credentials
CREATE POLICY "Org admins can manage sms_credentials"
  ON sms_credentials FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 2. SMS CONFIGURATION TABLE
-- ============================================================================
-- Stores SMS settings per organization (which provider to use, preferences, etc.)

CREATE TABLE IF NOT EXISTS sms_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider selection: 'platform' (use your Twilio) or 'byot' (use their own)
  provider_mode TEXT NOT NULL DEFAULT 'platform',

  -- Platform provider settings (when provider_mode = 'platform')
  -- These are billed through the subscription
  platform_sms_enabled BOOLEAN DEFAULT true,

  -- General SMS settings
  default_sender_name TEXT,  -- Optional: used in templates

  -- Compliance settings
  require_opt_in BOOLEAN DEFAULT true,
  auto_handle_opt_out BOOLEAN DEFAULT true,

  -- Rate limiting (messages per minute, 0 = no limit)
  rate_limit_per_minute INTEGER DEFAULT 60,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sms_config_provider_mode_check
    CHECK (provider_mode IN ('platform', 'byot')),

  -- One config per org
  UNIQUE(organization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_config_org_id ON sms_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_config_provider_mode ON sms_config(provider_mode);

-- Enable RLS
ALTER TABLE sms_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org members can read, admins can write
CREATE POLICY "Org members can read sms_config"
  ON sms_config FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can modify sms_config"
  ON sms_config FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. SMS USAGE TRACKING TABLE
-- ============================================================================
-- Tracks SMS usage per billing period for soft limits and overage billing.
-- Billing periods align with Stripe subscription periods.

CREATE TABLE IF NOT EXISTS sms_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Billing period (typically monthly, aligned with subscription)
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,

  -- Usage counters
  messages_sent INTEGER DEFAULT 0,
  segments_sent INTEGER DEFAULT 0,  -- SMS segments (1 SMS = 1-10 segments based on length)
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,

  -- For overage tracking
  segments_included INTEGER DEFAULT 0,  -- From subscription tier
  segments_overage INTEGER DEFAULT 0,   -- Segments beyond included

  -- Cost tracking (in cents, for overage billing)
  overage_cost_cents INTEGER DEFAULT 0,

  -- Provider mode during this period (for attribution)
  provider_mode TEXT DEFAULT 'platform',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per org per billing period
  UNIQUE(organization_id, billing_period_start)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sms_usage_org_id ON sms_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_usage_billing_period ON sms_usage(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_sms_usage_org_period ON sms_usage(organization_id, billing_period_start DESC);

-- Enable RLS
ALTER TABLE sms_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org members can read their usage
CREATE POLICY "Org members can read sms_usage"
  ON sms_usage FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Service role can insert/update (used by backend)
-- Note: Actual writes will use service role client

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create current billing period usage record
CREATE OR REPLACE FUNCTION get_or_create_sms_usage(
  p_organization_id UUID
)
RETURNS sms_usage AS $$
DECLARE
  v_usage sms_usage;
  v_period_start DATE;
  v_period_end DATE;
  v_included_segments INTEGER;
  v_org_tier TEXT;
BEGIN
  -- Calculate current billing period (assumes monthly, starting on subscription date or 1st)
  -- For simplicity, using calendar month. Enhance later to use actual subscription billing date.
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Get org tier to determine included segments
  SELECT subscription_tier INTO v_org_tier
  FROM organizations
  WHERE id = p_organization_id;

  -- Determine included segments based on tier
  v_included_segments := CASE v_org_tier
    WHEN 'starter' THEN 0
    WHEN 'professional' THEN 500
    WHEN 'enterprise' THEN -1  -- Unlimited
    ELSE 0
  END;

  -- Try to get existing record
  SELECT * INTO v_usage
  FROM sms_usage
  WHERE organization_id = p_organization_id
    AND billing_period_start = v_period_start;

  -- Create if not exists
  IF v_usage IS NULL THEN
    INSERT INTO sms_usage (
      organization_id,
      billing_period_start,
      billing_period_end,
      segments_included,
      provider_mode
    )
    VALUES (
      p_organization_id,
      v_period_start,
      v_period_end,
      v_included_segments,
      COALESCE(
        (SELECT provider_mode FROM sms_config WHERE organization_id = p_organization_id),
        'platform'
      )
    )
    RETURNING * INTO v_usage;
  END IF;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment SMS usage (called after sending)
CREATE OR REPLACE FUNCTION increment_sms_usage(
  p_organization_id UUID,
  p_segments INTEGER DEFAULT 1,
  p_delivered BOOLEAN DEFAULT false,
  p_failed BOOLEAN DEFAULT false
)
RETURNS sms_usage AS $$
DECLARE
  v_usage sms_usage;
  v_overage INTEGER;
BEGIN
  -- Get or create current period
  v_usage := get_or_create_sms_usage(p_organization_id);

  -- Update counters
  UPDATE sms_usage
  SET
    messages_sent = messages_sent + 1,
    segments_sent = segments_sent + p_segments,
    messages_delivered = messages_delivered + (CASE WHEN p_delivered THEN 1 ELSE 0 END),
    messages_failed = messages_failed + (CASE WHEN p_failed THEN 1 ELSE 0 END),
    updated_at = NOW()
  WHERE id = v_usage.id
  RETURNING * INTO v_usage;

  -- Calculate overage (if not unlimited)
  IF v_usage.segments_included >= 0 THEN
    v_overage := GREATEST(0, v_usage.segments_sent - v_usage.segments_included);

    -- Update overage tracking
    -- Overage cost: $0.01 per segment (1 cent)
    UPDATE sms_usage
    SET
      segments_overage = v_overage,
      overage_cost_cents = v_overage * 1  -- 1 cent per segment
    WHERE id = v_usage.id
    RETURNING * INTO v_usage;
  END IF;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if org can send SMS (soft limit check)
CREATE OR REPLACE FUNCTION check_sms_limit(
  p_organization_id UUID,
  p_segments_to_send INTEGER DEFAULT 1
)
RETURNS TABLE (
  can_send BOOLEAN,
  is_over_limit BOOLEAN,
  current_usage INTEGER,
  included_limit INTEGER,
  overage_segments INTEGER,
  warning_message TEXT
) AS $$
DECLARE
  v_usage sms_usage;
  v_can_send BOOLEAN;
  v_is_over_limit BOOLEAN;
  v_warning TEXT;
BEGIN
  -- Get current usage
  v_usage := get_or_create_sms_usage(p_organization_id);

  -- Check if SMS is enabled for this tier
  IF v_usage.segments_included = 0 THEN
    RETURN QUERY SELECT
      false,
      false,
      v_usage.segments_sent,
      v_usage.segments_included,
      0,
      'SMS is not available on your current plan. Upgrade to Professional or higher to enable SMS.'::TEXT;
    RETURN;
  END IF;

  -- Unlimited (-1) always can send
  IF v_usage.segments_included = -1 THEN
    RETURN QUERY SELECT
      true,
      false,
      v_usage.segments_sent,
      -1,
      0,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Soft limit: always allow, but warn if over
  v_can_send := true;
  v_is_over_limit := (v_usage.segments_sent + p_segments_to_send) > v_usage.segments_included;

  IF v_is_over_limit THEN
    v_warning := format(
      'You have used %s of %s included SMS segments this billing period. Additional segments will be billed at $0.01 each.',
      v_usage.segments_sent,
      v_usage.segments_included
    );
  ELSIF (v_usage.segments_sent + p_segments_to_send) > (v_usage.segments_included * 0.8) THEN
    v_warning := format(
      'You have used %s%% of your %s included SMS segments this billing period.',
      ROUND((v_usage.segments_sent::NUMERIC / v_usage.segments_included::NUMERIC) * 100),
      v_usage.segments_included
    );
  END IF;

  RETURN QUERY SELECT
    v_can_send,
    v_is_over_limit,
    v_usage.segments_sent,
    v_usage.segments_included,
    GREATEST(0, v_usage.segments_sent - v_usage.segments_included),
    v_warning;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SMS configuration with fallbacks
CREATE OR REPLACE FUNCTION get_sms_config(
  p_organization_id UUID
)
RETURNS TABLE (
  provider_mode TEXT,
  has_byot_credentials BOOLEAN,
  platform_sms_enabled BOOLEAN,
  require_opt_in BOOLEAN,
  auto_handle_opt_out BOOLEAN,
  rate_limit_per_minute INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(c.provider_mode, 'platform'),
    EXISTS(SELECT 1 FROM sms_credentials WHERE organization_id = p_organization_id AND is_active = true),
    COALESCE(c.platform_sms_enabled, true),
    COALESCE(c.require_opt_in, true),
    COALESCE(c.auto_handle_opt_out, true),
    COALESCE(c.rate_limit_per_minute, 60)
  FROM organizations o
  LEFT JOIN sms_config c ON c.organization_id = o.id
  WHERE o.id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ADD organization_id TO sms_messages IF MISSING
-- ============================================================================
-- The existing sms_messages table uses org_id, ensure we have proper FK

-- Check if org_id exists and add organization_id as alias if needed
DO $$
BEGIN
  -- Add index on sms_messages for workflow_execution_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_sms_messages_workflow_exec_id'
  ) THEN
    CREATE INDEX idx_sms_messages_workflow_exec_id ON sms_messages(workflow_execution_id);
  END IF;
END $$;

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_sms_credentials_updated_at
  BEFORE UPDATE ON sms_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_config_updated_at
  BEFORE UPDATE ON sms_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_usage_updated_at
  BEFORE UPDATE ON sms_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE sms_credentials IS 'Stores BYOT (Bring Your Own Twilio) credentials for organizations that want to use their own Twilio account';
COMMENT ON TABLE sms_config IS 'SMS configuration per organization - provider mode, compliance settings, rate limits';
COMMENT ON TABLE sms_usage IS 'Tracks SMS usage per billing period for soft limits and overage billing';

COMMENT ON FUNCTION get_or_create_sms_usage IS 'Gets or creates the SMS usage record for current billing period';
COMMENT ON FUNCTION increment_sms_usage IS 'Increments SMS usage counters after sending a message';
COMMENT ON FUNCTION check_sms_limit IS 'Checks if organization can send SMS (soft limit with overage)';
COMMENT ON FUNCTION get_sms_config IS 'Gets SMS configuration for an organization with defaults';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
