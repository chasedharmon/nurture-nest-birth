-- ============================================================================
-- Migration: Subscription Plans & Feature Flags (Phase C.2)
-- Defines subscription tiers and their feature limits
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY, -- 'starter', 'professional', 'enterprise'

  -- Display info
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT, -- Short marketing tagline

  -- Pricing (in cents for precision)
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,

  -- Feature flags (JSONB for flexibility)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Plan metadata
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Only one plan should be default
  is_featured BOOLEAN DEFAULT false, -- Highlighted in pricing table
  display_order INTEGER DEFAULT 0,

  -- Stripe product/price IDs (rails only)
  stripe_product_id TEXT,
  stripe_price_monthly_id TEXT,
  stripe_price_yearly_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_display_order ON subscription_plans(display_order);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans (for pricing page)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

COMMENT ON TABLE subscription_plans IS 'SaaS subscription tiers with feature flags and pricing';

-- ============================================================================
-- 2. USAGE METRICS TABLE
-- Tracks usage for billing and limit enforcement
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What we're measuring
  metric_type TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,

  -- Time period (for monthly metrics like emails sent)
  period_start DATE,
  period_end DATE,

  -- Metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT usage_metric_type_check CHECK (
    metric_type IN (
      'team_members',
      'clients',
      'workflows',
      'storage_bytes',
      'emails_sent',
      'sms_sent',
      'api_calls'
    )
  )
);

-- Indexes for usage metrics
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_id ON usage_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON usage_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_recorded_at ON usage_metrics(recorded_at);

-- Unique constraint for current period metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_metrics_unique_period
  ON usage_metrics(organization_id, metric_type, period_start)
  WHERE period_start IS NOT NULL;

-- Enable RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own usage
CREATE POLICY "Organizations can view their usage"
  ON usage_metrics FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- System can insert/update usage (via service role)
CREATE POLICY "System can manage usage metrics"
  ON usage_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE usage_metrics IS 'Tracks organization usage for billing and limit enforcement';

-- ============================================================================
-- 3. SEED DEFAULT SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (id, name, description, tagline, price_monthly, price_yearly, features, is_active, is_default, is_featured, display_order)
VALUES
  (
    'starter',
    'Starter',
    'Perfect for solo doulas just getting started',
    'Everything you need to launch',
    0, -- Free
    0,
    '{
      "max_team_members": 3,
      "custom_roles": false,
      "max_clients": 50,
      "client_portal": true,
      "max_workflows": 5,
      "workflow_templates": true,
      "advanced_conditions": false,
      "email_enabled": true,
      "sms_enabled": false,
      "max_emails_per_month": 500,
      "max_sms_per_month": 0,
      "max_storage_mb": 500,
      "document_uploads": true,
      "custom_branding": false,
      "white_label": false,
      "custom_domain": false,
      "basic_reports": true,
      "advanced_reports": false,
      "custom_dashboards": false,
      "api_access": false,
      "webhook_access": false,
      "calendar_sync": false,
      "priority_support": false,
      "dedicated_account_manager": false
    }'::jsonb,
    true,
    true, -- Default plan
    false,
    1
  ),
  (
    'professional',
    'Professional',
    'For growing practices with a team',
    'Scale your doula business',
    4900, -- $49/month
    47000, -- $470/year (2 months free)
    '{
      "max_team_members": 10,
      "custom_roles": true,
      "max_clients": 500,
      "client_portal": true,
      "max_workflows": 50,
      "workflow_templates": true,
      "advanced_conditions": true,
      "email_enabled": true,
      "sms_enabled": true,
      "max_emails_per_month": 5000,
      "max_sms_per_month": 500,
      "max_storage_mb": 5000,
      "document_uploads": true,
      "custom_branding": true,
      "white_label": false,
      "custom_domain": false,
      "basic_reports": true,
      "advanced_reports": true,
      "custom_dashboards": true,
      "api_access": true,
      "webhook_access": true,
      "calendar_sync": true,
      "priority_support": true,
      "dedicated_account_manager": false
    }'::jsonb,
    true,
    false,
    true, -- Featured plan
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'For large organizations and birth centers',
    'Unlimited power for your team',
    14900, -- $149/month
    143000, -- $1430/year (2 months free)
    '{
      "max_team_members": -1,
      "custom_roles": true,
      "max_clients": -1,
      "client_portal": true,
      "max_workflows": -1,
      "workflow_templates": true,
      "advanced_conditions": true,
      "email_enabled": true,
      "sms_enabled": true,
      "max_emails_per_month": -1,
      "max_sms_per_month": -1,
      "max_storage_mb": -1,
      "document_uploads": true,
      "custom_branding": true,
      "white_label": true,
      "custom_domain": true,
      "basic_reports": true,
      "advanced_reports": true,
      "custom_dashboards": true,
      "api_access": true,
      "webhook_access": true,
      "calendar_sync": true,
      "priority_support": true,
      "dedicated_account_manager": true
    }'::jsonb,
    true,
    false,
    false,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- 4. HELPER FUNCTION: GET PLAN FEATURES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_plan_features(plan_id TEXT)
RETURNS JSONB AS $$
DECLARE
  plan_features JSONB;
BEGIN
  SELECT features INTO plan_features
  FROM subscription_plans
  WHERE id = plan_id AND is_active = true;

  IF plan_features IS NULL THEN
    -- Return starter features as fallback
    SELECT features INTO plan_features
    FROM subscription_plans
    WHERE id = 'starter';
  END IF;

  RETURN COALESCE(plan_features, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. HELPER FUNCTION: CHECK FEATURE ACCESS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_feature_access(
  org_id UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  org_tier TEXT;
  plan_features JSONB;
  feature_value JSONB;
BEGIN
  -- Get organization's subscription tier
  SELECT subscription_tier INTO org_tier
  FROM organizations
  WHERE id = org_id AND deleted_at IS NULL;

  IF org_tier IS NULL THEN
    org_tier := 'starter';
  END IF;

  -- Get plan features
  plan_features := get_plan_features(org_tier);

  -- Get the specific feature value
  feature_value := plan_features->feature_name;

  -- Boolean features
  IF jsonb_typeof(feature_value) = 'boolean' THEN
    RETURN feature_value::boolean;
  END IF;

  -- Numeric features: -1 means unlimited, 0 means disabled
  IF jsonb_typeof(feature_value) = 'number' THEN
    RETURN (feature_value::integer != 0);
  END IF;

  -- Default to false if feature not found
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. HELPER FUNCTION: CHECK USAGE LIMIT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_usage_limit(
  org_id UUID,
  limit_type TEXT,
  current_count INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  limit_value INTEGER,
  current_value INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  org_tier TEXT;
  plan_features JSONB;
  max_limit INTEGER;
BEGIN
  -- Get organization's subscription tier
  SELECT subscription_tier INTO org_tier
  FROM organizations
  WHERE id = org_id AND deleted_at IS NULL;

  IF org_tier IS NULL THEN
    org_tier := 'starter';
  END IF;

  -- Get plan features
  plan_features := get_plan_features(org_tier);

  -- Get the limit value
  max_limit := COALESCE((plan_features->>limit_type)::integer, 0);

  -- -1 means unlimited
  IF max_limit = -1 THEN
    RETURN QUERY SELECT
      true AS allowed,
      -1 AS limit_value,
      current_count AS current_value,
      -1 AS remaining;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    (current_count < max_limit) AS allowed,
    max_limit AS limit_value,
    current_count AS current_value,
    GREATEST(0, max_limit - current_count) AS remaining;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. FUNCTION: RECORD USAGE METRIC
-- ============================================================================

CREATE OR REPLACE FUNCTION record_usage_metric(
  p_org_id UUID,
  p_metric_type TEXT,
  p_value INTEGER,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- For period-based metrics (like emails_sent), upsert based on period
  IF p_period_start IS NOT NULL THEN
    INSERT INTO usage_metrics (organization_id, metric_type, metric_value, period_start, period_end)
    VALUES (p_org_id, p_metric_type, p_value, p_period_start, p_period_end)
    ON CONFLICT (organization_id, metric_type, period_start)
    DO UPDATE SET
      metric_value = usage_metrics.metric_value + EXCLUDED.metric_value,
      recorded_at = NOW();
  ELSE
    -- For current count metrics, just insert a new record
    INSERT INTO usage_metrics (organization_id, metric_type, metric_value)
    VALUES (p_org_id, p_metric_type, p_value);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. UPDATE TRIGGER FOR SUBSCRIPTION PLANS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_subscription_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_plan_updated_at ON subscription_plans;
CREATE TRIGGER subscription_plan_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plan_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION get_plan_features(TEXT) IS 'Returns the feature flags JSONB for a given plan ID';
COMMENT ON FUNCTION check_feature_access(UUID, TEXT) IS 'Checks if an organization has access to a specific feature';
COMMENT ON FUNCTION check_usage_limit(UUID, TEXT, INTEGER) IS 'Checks if an organization is within a usage limit';
COMMENT ON FUNCTION record_usage_metric(UUID, TEXT, INTEGER, DATE, DATE) IS 'Records a usage metric for billing/tracking';
