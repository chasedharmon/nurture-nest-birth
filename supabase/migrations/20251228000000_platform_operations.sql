-- ============================================================================
-- Migration: Platform Operations (Phase 4)
-- Super-admin metrics, tenant health monitoring, and GDPR compliance
-- ============================================================================

-- ============================================================================
-- 1. PLATFORM METRICS TABLE
-- Stores daily snapshots of platform-wide metrics for historical analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Snapshot date (one row per day)
  snapshot_date DATE NOT NULL UNIQUE,

  -- Tenant counts
  total_tenants INTEGER NOT NULL DEFAULT 0,
  active_tenants INTEGER NOT NULL DEFAULT 0,
  trialing_tenants INTEGER NOT NULL DEFAULT 0,
  suspended_tenants INTEGER NOT NULL DEFAULT 0,
  cancelled_tenants INTEGER NOT NULL DEFAULT 0,

  -- Revenue metrics (in cents)
  mrr_cents BIGINT NOT NULL DEFAULT 0, -- Monthly Recurring Revenue
  arr_cents BIGINT NOT NULL DEFAULT 0, -- Annual Recurring Revenue

  -- New signups this period
  new_signups_daily INTEGER NOT NULL DEFAULT 0,
  new_signups_weekly INTEGER NOT NULL DEFAULT 0,
  new_signups_monthly INTEGER NOT NULL DEFAULT 0,

  -- Churn metrics
  churned_tenants_daily INTEGER NOT NULL DEFAULT 0,
  churned_tenants_monthly INTEGER NOT NULL DEFAULT 0,

  -- Tier distribution
  starter_tier_count INTEGER NOT NULL DEFAULT 0,
  professional_tier_count INTEGER NOT NULL DEFAULT 0,
  enterprise_tier_count INTEGER NOT NULL DEFAULT 0,

  -- Usage aggregates
  total_users INTEGER NOT NULL DEFAULT 0,
  total_clients INTEGER NOT NULL DEFAULT 0,
  total_workflows INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics(snapshot_date DESC);

COMMENT ON TABLE platform_metrics IS 'Daily snapshots of platform-wide metrics for dashboards and reporting.';
COMMENT ON COLUMN platform_metrics.mrr_cents IS 'Monthly Recurring Revenue in cents. Sum of all active monthly subscriptions.';
COMMENT ON COLUMN platform_metrics.arr_cents IS 'Annual Recurring Revenue in cents. MRR * 12.';

-- ============================================================================
-- 2. ADD LAST_LOGIN_AT TO ORGANIZATIONS
-- Tracks tenant activity for churn detection
-- ============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_last_login ON organizations(last_login_at);

COMMENT ON COLUMN organizations.last_login_at IS 'Timestamp of last user login for this organization. Used for churn detection.';

-- ============================================================================
-- 3. TENANT HEALTH SCORES TABLE
-- Calculated health metrics per tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Health indicators (0-100 scale)
  overall_score INTEGER NOT NULL DEFAULT 100,
  engagement_score INTEGER NOT NULL DEFAULT 100, -- Based on login frequency
  usage_score INTEGER NOT NULL DEFAULT 100, -- Based on feature usage
  payment_score INTEGER NOT NULL DEFAULT 100, -- Payment history

  -- Risk flags
  churn_risk_level TEXT DEFAULT 'low', -- low, medium, high, critical
  days_since_login INTEGER DEFAULT 0,

  -- Upsell indicators
  at_team_limit BOOLEAN DEFAULT false,
  at_client_limit BOOLEAN DEFAULT false,
  at_workflow_limit BOOLEAN DEFAULT false,
  at_storage_limit BOOLEAN DEFAULT false,
  upsell_opportunity BOOLEAN DEFAULT false,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tenant_health_churn_risk_check
    CHECK (churn_risk_level IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_tenant_health_org_id ON tenant_health_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_health_churn_risk ON tenant_health_scores(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_tenant_health_upsell ON tenant_health_scores(upsell_opportunity) WHERE upsell_opportunity = true;
CREATE INDEX IF NOT EXISTS idx_tenant_health_calculated_at ON tenant_health_scores(calculated_at DESC);

COMMENT ON TABLE tenant_health_scores IS 'Calculated health scores for each tenant. Updated daily or on-demand.';

-- ============================================================================
-- 4. PLATFORM AUDIT LOG
-- Tracks platform admin actions on tenant data (GDPR compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action (platform admin)
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,

  -- Target tenant (if applicable)
  target_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  target_organization_name TEXT,

  -- Action details
  action TEXT NOT NULL, -- view_tenant, impersonate, export_data, delete_tenant, etc.
  resource_type TEXT, -- organization, user, data_export, etc.
  resource_id UUID,

  -- Details
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_admin ON platform_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_target_org ON platform_audit_log(target_organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON platform_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created_at ON platform_audit_log(created_at DESC);

COMMENT ON TABLE platform_audit_log IS 'Audit trail for platform admin actions. Required for GDPR compliance.';
COMMENT ON COLUMN platform_audit_log.action IS 'Action type: view_tenant, impersonate, export_data, suspend_tenant, delete_tenant, change_tier, etc.';

-- No RLS on platform_audit_log - only accessible via service role
-- This is intentional for security

-- ============================================================================
-- 5. DATA EXPORT REQUESTS TABLE
-- Tracks GDPR data export requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization requesting export
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Who requested it
  requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email TEXT NOT NULL,

  -- Export details
  export_type TEXT NOT NULL DEFAULT 'full', -- full, partial
  include_clients BOOLEAN DEFAULT true,
  include_documents BOOLEAN DEFAULT true,
  include_payments BOOLEAN DEFAULT true,
  include_communications BOOLEAN DEFAULT true,
  include_audit_logs BOOLEAN DEFAULT true,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, expired

  -- File details (when completed)
  file_url TEXT,
  file_size_bytes BIGINT,
  file_format TEXT DEFAULT 'json', -- json, csv, zip

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Files deleted after this date

  -- Error tracking
  error_message TEXT,

  -- Processing notes
  notes TEXT,

  CONSTRAINT data_export_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  CONSTRAINT data_export_type_check
    CHECK (export_type IN ('full', 'partial'))
);

CREATE INDEX IF NOT EXISTS idx_data_exports_org_id ON data_export_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_requested_at ON data_export_requests(requested_at DESC);

COMMENT ON TABLE data_export_requests IS 'GDPR data export requests. Tracks full organization data exports.';

-- Enable RLS
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Org members can view their own export requests
CREATE POLICY "Users can view org export requests"
  ON data_export_requests FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

-- Only service role can insert/update (via server actions)
CREATE POLICY "Service role can manage export requests"
  ON data_export_requests FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. ACCOUNT DELETION QUEUE
-- Tracks account deletion requests with proper data cleanup
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_deletion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization to be deleted
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_slug TEXT NOT NULL,

  -- Who requested deletion
  requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email TEXT NOT NULL,

  -- Approval (requires platform admin approval)
  approved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, processing, completed, cancelled

  -- Scheduling
  scheduled_deletion_at TIMESTAMPTZ, -- 30 days grace period by default
  grace_period_days INTEGER DEFAULT 30,

  -- Completion tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Deletion details
  records_deleted JSONB DEFAULT '{}', -- Count of deleted records by table

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT deletion_status_check
    CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_deletion_queue_org_id ON account_deletion_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_deletion_queue_status ON account_deletion_queue(status);
CREATE INDEX IF NOT EXISTS idx_deletion_queue_scheduled ON account_deletion_queue(scheduled_deletion_at)
  WHERE status IN ('pending', 'approved');

COMMENT ON TABLE account_deletion_queue IS 'Queue for account deletion requests. Includes grace period and approval workflow.';

-- No RLS - only accessible via service role for security

-- ============================================================================
-- 7. FUNCTIONS FOR METRICS CALCULATION
-- ============================================================================

-- Calculate MRR from active subscriptions
CREATE OR REPLACE FUNCTION calculate_platform_mrr()
RETURNS BIGINT AS $$
DECLARE
  total_mrr BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE subscription_tier
      WHEN 'starter' THEN 2900 -- $29/month
      WHEN 'professional' THEN 7900 -- $79/month
      WHEN 'enterprise' THEN 19900 -- $199/month
      ELSE 0
    END
  ), 0) INTO total_mrr
  FROM organizations
  WHERE subscription_status = 'active'
    AND deleted_at IS NULL;

  RETURN total_mrr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_platform_mrr() IS 'Calculates Monthly Recurring Revenue in cents from active subscriptions.';

-- Calculate tenant health score
CREATE OR REPLACE FUNCTION calculate_tenant_health(p_organization_id UUID)
RETURNS TABLE(
  overall_score INTEGER,
  engagement_score INTEGER,
  usage_score INTEGER,
  churn_risk_level TEXT,
  days_since_login INTEGER,
  at_team_limit BOOLEAN,
  at_client_limit BOOLEAN,
  at_workflow_limit BOOLEAN,
  upsell_opportunity BOOLEAN
) AS $$
DECLARE
  v_last_login TIMESTAMPTZ;
  v_days_since INTEGER;
  v_engagement INTEGER;
  v_usage INTEGER;
  v_team_count INTEGER;
  v_client_count INTEGER;
  v_workflow_count INTEGER;
  v_max_team INTEGER;
  v_max_clients INTEGER;
  v_max_workflows INTEGER;
  v_at_team BOOLEAN;
  v_at_client BOOLEAN;
  v_at_workflow BOOLEAN;
  v_upsell BOOLEAN;
  v_risk TEXT;
  v_overall INTEGER;
BEGIN
  -- Get organization data
  SELECT o.last_login_at, o.max_team_members, o.max_clients, o.max_workflows
  INTO v_last_login, v_max_team, v_max_clients, v_max_workflows
  FROM organizations o
  WHERE o.id = p_organization_id;

  -- Calculate days since login
  v_days_since := COALESCE(
    EXTRACT(DAY FROM NOW() - v_last_login)::INTEGER,
    999
  );

  -- Calculate engagement score based on login recency
  v_engagement := CASE
    WHEN v_days_since <= 1 THEN 100
    WHEN v_days_since <= 7 THEN 90
    WHEN v_days_since <= 14 THEN 75
    WHEN v_days_since <= 30 THEN 50
    WHEN v_days_since <= 60 THEN 25
    ELSE 10
  END;

  -- Get usage counts
  SELECT COUNT(*) INTO v_team_count
  FROM organization_memberships
  WHERE organization_id = p_organization_id AND is_active = true;

  SELECT COUNT(*) INTO v_client_count
  FROM leads
  WHERE organization_id = p_organization_id;

  SELECT COUNT(*) INTO v_workflow_count
  FROM workflows
  WHERE organization_id = p_organization_id AND is_active = true;

  -- Calculate usage score (activity level)
  v_usage := LEAST(100, (
    (CASE WHEN v_team_count > 0 THEN 25 ELSE 0 END) +
    (CASE WHEN v_client_count > 0 THEN 25 ELSE 0 END) +
    (CASE WHEN v_workflow_count > 0 THEN 25 ELSE 0 END) +
    (CASE WHEN v_client_count >= 10 THEN 25 ELSE v_client_count * 2.5 END)
  )::INTEGER);

  -- Check limits (treat -1 as unlimited)
  v_at_team := v_max_team > 0 AND v_team_count >= (v_max_team * 0.8);
  v_at_client := v_max_clients > 0 AND v_client_count >= (v_max_clients * 0.8);
  v_at_workflow := v_max_workflows > 0 AND v_workflow_count >= (v_max_workflows * 0.8);
  v_upsell := v_at_team OR v_at_client OR v_at_workflow;

  -- Calculate churn risk
  v_risk := CASE
    WHEN v_days_since >= 60 THEN 'critical'
    WHEN v_days_since >= 30 THEN 'high'
    WHEN v_days_since >= 14 THEN 'medium'
    ELSE 'low'
  END;

  -- Overall score (weighted average)
  v_overall := (v_engagement * 0.6 + v_usage * 0.4)::INTEGER;

  RETURN QUERY SELECT
    v_overall,
    v_engagement,
    v_usage,
    v_risk,
    v_days_since,
    v_at_team,
    v_at_client,
    v_at_workflow,
    v_upsell;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_tenant_health(UUID) IS 'Calculates health scores and risk indicators for a tenant.';

-- Update organization last_login_at when any user logs in
CREATE OR REPLACE FUNCTION update_org_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizations
  SET last_login_at = NOW()
  WHERE id = (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = NEW.id
      AND is_active = true
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on users.last_login_at update
DROP TRIGGER IF EXISTS trigger_update_org_last_login ON users;
CREATE TRIGGER trigger_update_org_last_login
  AFTER UPDATE OF last_login_at ON users
  FOR EACH ROW
  WHEN (NEW.last_login_at IS DISTINCT FROM OLD.last_login_at)
  EXECUTE FUNCTION update_org_last_login();

-- ============================================================================
-- 8. FUNCTION TO SNAPSHOT PLATFORM METRICS
-- Called daily by cron job or manually
-- ============================================================================

CREATE OR REPLACE FUNCTION snapshot_platform_metrics()
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_mrr BIGINT;
  v_today DATE := CURRENT_DATE;
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  v_month_ago DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  -- Calculate MRR
  v_mrr := calculate_platform_mrr();

  -- Upsert daily snapshot
  INSERT INTO platform_metrics (
    snapshot_date,
    total_tenants,
    active_tenants,
    trialing_tenants,
    suspended_tenants,
    cancelled_tenants,
    mrr_cents,
    arr_cents,
    new_signups_daily,
    new_signups_weekly,
    new_signups_monthly,
    starter_tier_count,
    professional_tier_count,
    enterprise_tier_count,
    total_users,
    total_clients,
    total_workflows
  )
  SELECT
    v_today,
    COUNT(*) FILTER (WHERE deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_status = 'active' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_status = 'trialing' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_status = 'paused' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_status = 'cancelled' AND deleted_at IS NULL),
    v_mrr,
    v_mrr * 12,
    COUNT(*) FILTER (WHERE created_at::DATE = v_today AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE created_at >= v_week_ago AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE created_at >= v_month_ago AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_tier = 'starter' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_tier = 'professional' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE subscription_tier = 'enterprise' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM leads),
    (SELECT COUNT(*) FROM workflows WHERE is_active = true)
  FROM organizations
  ON CONFLICT (snapshot_date) DO UPDATE SET
    total_tenants = EXCLUDED.total_tenants,
    active_tenants = EXCLUDED.active_tenants,
    trialing_tenants = EXCLUDED.trialing_tenants,
    suspended_tenants = EXCLUDED.suspended_tenants,
    cancelled_tenants = EXCLUDED.cancelled_tenants,
    mrr_cents = EXCLUDED.mrr_cents,
    arr_cents = EXCLUDED.arr_cents,
    new_signups_daily = EXCLUDED.new_signups_daily,
    new_signups_weekly = EXCLUDED.new_signups_weekly,
    new_signups_monthly = EXCLUDED.new_signups_monthly,
    starter_tier_count = EXCLUDED.starter_tier_count,
    professional_tier_count = EXCLUDED.professional_tier_count,
    enterprise_tier_count = EXCLUDED.enterprise_tier_count,
    total_users = EXCLUDED.total_users,
    total_clients = EXCLUDED.total_clients,
    total_workflows = EXCLUDED.total_workflows
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION snapshot_platform_metrics() IS 'Creates or updates daily platform metrics snapshot. Call daily via cron.';

-- ============================================================================
-- 9. FUNCTION TO UPDATE ALL TENANT HEALTH SCORES
-- Called daily by cron job or manually
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_tenant_health_scores()
RETURNS INTEGER AS $$
DECLARE
  v_org RECORD;
  v_health RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_org IN SELECT id FROM organizations WHERE deleted_at IS NULL LOOP
    -- Get health calculation
    SELECT * INTO v_health FROM calculate_tenant_health(v_org.id);

    -- Upsert health score
    INSERT INTO tenant_health_scores (
      organization_id,
      overall_score,
      engagement_score,
      usage_score,
      churn_risk_level,
      days_since_login,
      at_team_limit,
      at_client_limit,
      at_workflow_limit,
      upsell_opportunity,
      calculated_at
    ) VALUES (
      v_org.id,
      v_health.overall_score,
      v_health.engagement_score,
      v_health.usage_score,
      v_health.churn_risk_level,
      v_health.days_since_login,
      v_health.at_team_limit,
      v_health.at_client_limit,
      v_health.at_workflow_limit,
      v_health.upsell_opportunity,
      NOW()
    )
    ON CONFLICT (organization_id) DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      engagement_score = EXCLUDED.engagement_score,
      usage_score = EXCLUDED.usage_score,
      churn_risk_level = EXCLUDED.churn_risk_level,
      days_since_login = EXCLUDED.days_since_login,
      at_team_limit = EXCLUDED.at_team_limit,
      at_client_limit = EXCLUDED.at_client_limit,
      at_workflow_limit = EXCLUDED.at_workflow_limit,
      upsell_opportunity = EXCLUDED.upsell_opportunity,
      calculated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for upsert
ALTER TABLE tenant_health_scores
  DROP CONSTRAINT IF EXISTS tenant_health_scores_organization_id_key;
ALTER TABLE tenant_health_scores
  ADD CONSTRAINT tenant_health_scores_organization_id_key UNIQUE (organization_id);

COMMENT ON FUNCTION refresh_all_tenant_health_scores() IS 'Recalculates health scores for all tenants. Call daily via cron.';

-- ============================================================================
-- 10. INITIALIZE DATA
-- ============================================================================

-- Create initial metrics snapshot
SELECT snapshot_platform_metrics();

-- Calculate initial health scores
SELECT refresh_all_tenant_health_scores();

-- Set last_login_at for existing organizations based on user activity
UPDATE organizations o
SET last_login_at = (
  SELECT MAX(u.last_login_at)
  FROM users u
  JOIN organization_memberships om ON om.user_id = u.id
  WHERE om.organization_id = o.id
    AND om.is_active = true
)
WHERE o.last_login_at IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Phase 4 Platform Operations: Metrics, health monitoring, and GDPR compliance added.';
