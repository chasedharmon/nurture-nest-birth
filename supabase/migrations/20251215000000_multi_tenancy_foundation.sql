-- ============================================================================
-- Migration: Multi-Tenancy Foundation (Phase C.1)
-- Adds organizations table and organization_id to all tenant-scoped tables
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- Core table for SaaS multi-tenancy
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#E8A87C',
  secondary_color TEXT DEFAULT '#85CDCA',

  -- Settings (flexible JSONB for future expansion)
  settings JSONB DEFAULT '{}'::jsonb,

  -- Stripe billing integration (rails only - no live integration)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Subscription status
  subscription_status TEXT DEFAULT 'trialing',
  subscription_tier TEXT DEFAULT 'starter',
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Usage limits (enforced at application layer)
  max_team_members INTEGER DEFAULT 3,
  max_clients INTEGER DEFAULT 50,
  max_storage_mb INTEGER DEFAULT 500,
  max_workflows INTEGER DEFAULT 5,

  -- Contact info
  billing_email TEXT,
  billing_name TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Owner reference (first admin user)
  owner_user_id UUID,

  -- Soft delete support
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT organization_subscription_status_check
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  CONSTRAINT organization_subscription_tier_check
    CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'custom'))
);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE organizations IS 'SaaS organizations/tenants. Each organization has isolated data via RLS policies.';

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ORGANIZATION MEMBERSHIPS TABLE
-- Links users to organizations (supports multi-org in future)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role within this organization
  role TEXT DEFAULT 'member',

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only be in an org once
  UNIQUE(organization_id, user_id),

  -- Role constraints
  CONSTRAINT org_membership_role_check
    CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- Indexes for organization memberships
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_active ON organization_memberships(is_active) WHERE is_active = true;

COMMENT ON TABLE organization_memberships IS 'Links users to organizations. Supports future multi-org membership.';

-- Enable RLS on organization_memberships
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. ADD ORGANIZATION_ID TO ALL TENANT-SCOPED TABLES
-- Adding foreign key to organizations table for data isolation
-- ============================================================================

-- Users table (admin users, not clients)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Team members
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Leads (clients/prospects)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client services
ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Lead activities
ALTER TABLE lead_activities
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client documents
ALTER TABLE client_documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Contract templates
ALTER TABLE contract_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Contract signatures
ALTER TABLE contract_signatures
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Intake form templates
ALTER TABLE intake_form_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Intake form submissions
ALTER TABLE intake_form_submissions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Notification preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Notification log
ALTER TABLE notification_log
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client sessions (for portal auth)
ALTER TABLE client_sessions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client auth tokens
ALTER TABLE client_auth_tokens
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client assignments
ALTER TABLE client_assignments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Service assignments
ALTER TABLE service_assignments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Time entries
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- On-call schedule
ALTER TABLE oncall_schedule
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Roles
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- User invitations
ALTER TABLE user_invitations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- User preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- List views
ALTER TABLE list_views
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Saved filters
ALTER TABLE saved_filters
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Reports
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Dashboards
ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Dashboard widgets
ALTER TABLE dashboard_widgets
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Action item templates
ALTER TABLE action_item_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client action items
ALTER TABLE client_action_items
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Client journey milestones
ALTER TABLE client_journey_milestones
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Company settings (becomes per-org settings)
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Service packages
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Workflows
ALTER TABLE workflows
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Workflow steps
ALTER TABLE workflow_steps
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Workflow executions
ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Workflow step executions
ALTER TABLE workflow_step_executions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Workflow templates (can be global or org-specific)
ALTER TABLE workflow_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Conversations (messaging)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Conversation participants
ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. CREATE ORGANIZATION-SCOPED INDEXES
-- Critical for performance with multi-tenant queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_services_org_id ON client_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org_id ON meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_org_id ON lead_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_org_id ON client_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_org_id ON contract_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_org_id ON contract_signatures(organization_id);
CREATE INDEX IF NOT EXISTS idx_intake_form_templates_org_id ON intake_form_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_intake_form_submissions_org_id ON intake_form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org_id ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_org_id ON workflow_steps(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_id ON workflow_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_org_id ON company_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_org_id ON service_packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_org_id ON dashboards(organization_id);

-- ============================================================================
-- 5. HELPER FUNCTION: GET CURRENT USER'S ORGANIZATION
-- Used in RLS policies and application queries
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- First try to get from user's primary organization membership
  SELECT om.organization_id INTO org_id
  FROM organization_memberships om
  WHERE om.user_id = auth.uid()
    AND om.is_active = true
  ORDER BY om.created_at ASC
  LIMIT 1;

  -- If no membership found, try users table (for backward compatibility during migration)
  IF org_id IS NULL THEN
    SELECT u.organization_id INTO org_id
    FROM users u
    WHERE u.id = auth.uid();
  END IF;

  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_organization_id() IS 'Returns the current authenticated user''s primary organization ID. Used in RLS policies.';

-- ============================================================================
-- 6. HELPER FUNCTION: CHECK IF USER BELONGS TO ORGANIZATION
-- For more complex RLS scenarios
-- ============================================================================

CREATE OR REPLACE FUNCTION user_belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has active membership in the specified organization
  RETURN EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_belongs_to_organization(UUID) IS 'Checks if current user is an active member of the specified organization.';

-- ============================================================================
-- 7. CREATE DEFAULT ORGANIZATION FOR EXISTING DATA
-- Migrates current single-tenant data to multi-tenant structure
-- ============================================================================

DO $$
DECLARE
  default_org_id UUID;
  first_admin_id UUID;
BEGIN
  -- Check if any organization exists
  SELECT id INTO default_org_id FROM organizations LIMIT 1;

  IF default_org_id IS NULL THEN
    -- Create default organization
    INSERT INTO organizations (
      name,
      slug,
      subscription_status,
      subscription_tier,
      max_team_members,
      max_clients,
      max_storage_mb,
      max_workflows,
      trial_ends_at
    ) VALUES (
      'Nurture Nest Birth',
      'nurture-nest-birth',
      'active',
      'professional', -- Give existing users professional tier
      10,
      500,
      5000,
      50,
      NOW() + INTERVAL '30 days'
    ) RETURNING id INTO default_org_id;

    RAISE NOTICE 'Created default organization with ID: %', default_org_id;

    -- Get the first admin user to be the owner
    SELECT id INTO first_admin_id
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Update organization with owner
    IF first_admin_id IS NOT NULL THEN
      UPDATE organizations SET owner_user_id = first_admin_id WHERE id = default_org_id;

      -- Create owner membership
      INSERT INTO organization_memberships (organization_id, user_id, role, accepted_at, is_active)
      VALUES (default_org_id, first_admin_id, 'owner', NOW(), true)
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    -- Update all existing records with the default organization_id
    UPDATE users SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE team_members SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE leads SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_services SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE meetings SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE lead_activities SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_documents SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE payments SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE invoices SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE contract_templates SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE contract_signatures SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE intake_form_templates SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE intake_form_submissions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE notification_preferences SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE notification_log SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_sessions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_auth_tokens SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_assignments SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE service_assignments SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE time_entries SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE oncall_schedule SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE roles SET organization_id = default_org_id WHERE organization_id IS NULL AND is_system = false;
    UPDATE user_invitations SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE user_preferences SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE list_views SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE saved_filters SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE reports SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE dashboards SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE dashboard_widgets SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE action_item_templates SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_action_items SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE client_journey_milestones SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE company_settings SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE service_packages SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE workflows SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE workflow_steps SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE workflow_executions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE workflow_step_executions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE workflow_templates SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE conversations SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE conversation_participants SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE messages SET organization_id = default_org_id WHERE organization_id IS NULL;

    -- Create organization memberships for all existing users
    INSERT INTO organization_memberships (organization_id, user_id, role, accepted_at, is_active)
    SELECT default_org_id, id,
           CASE WHEN role = 'admin' THEN 'admin' ELSE 'member' END,
           created_at,
           is_active
    FROM users
    WHERE id != first_admin_id -- Already added owner
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Migrated all existing data to default organization';
  END IF;
END $$;

-- ============================================================================
-- 8. UPDATED_AT TRIGGER FOR ORGANIZATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_organization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organization_updated_at ON organizations;
CREATE TRIGGER organization_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON COLUMN users.organization_id IS 'Organization this user belongs to. Used for multi-tenant data isolation.';
COMMENT ON COLUMN leads.organization_id IS 'Organization this lead/client belongs to. Used for multi-tenant data isolation.';
COMMENT ON COLUMN workflows.organization_id IS 'Organization this workflow belongs to. Used for multi-tenant data isolation.';
