-- =====================================================
-- CRM CORE OBJECTS
-- =====================================================
-- This migration creates the four core CRM object tables:
-- - crm_contacts: Person records (demographics, contact info)
-- - crm_accounts: Households/families (aggregate entity)
-- - crm_leads: Unqualified prospects
-- - crm_opportunities: Deals/service engagements
-- - crm_activities: Unified activity log
-- - contact_account_relationships: Links contacts to accounts with relationship types
--
-- All tables follow the CRM architecture with:
-- - organization_id for multi-tenancy
-- - owner_id for record ownership
-- - custom_fields JSONB for extensibility
-- - RLS policies for security
-- =====================================================

-- =====================================================
-- CRM ACCOUNTS TABLE
-- Represents households/families (created first due to FK dependencies)
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  account_type TEXT DEFAULT 'household' CHECK (account_type IN ('household', 'business', 'partner')),

  -- Primary contact (set after contacts are created)
  primary_contact_id UUID,

  -- Billing address
  billing_street TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT DEFAULT 'USA',

  -- Status
  account_status TEXT DEFAULT 'prospect' CHECK (account_status IN ('prospect', 'active', 'inactive', 'churned')),
  lifecycle_stage TEXT DEFAULT 'lead',

  -- Financial summary (computed/denormalized)
  total_revenue DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Custom fields for extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for crm_accounts
CREATE INDEX IF NOT EXISTS idx_crm_accounts_org ON crm_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_owner ON crm_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_status ON crm_accounts(organization_id, account_status);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name ON crm_accounts(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_custom_fields ON crm_accounts USING gin(custom_fields);

-- =====================================================
-- CRM CONTACTS TABLE
-- Represents individual people
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Name
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,

  -- Contact information
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,

  -- Mailing address
  mailing_street TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_postal_code TEXT,
  mailing_country TEXT DEFAULT 'USA',

  -- Personal information
  birthdate DATE,

  -- Doula-specific fields
  partner_name TEXT,
  expected_due_date DATE,
  actual_birth_date DATE,

  -- Medical information (sensitive - field-level security should restrict access)
  medical_info JSONB DEFAULT '{}',
  -- Example: { "obgyn": "Dr. Smith", "hospital": "Memorial Hospital", "insurance": "Blue Cross" }

  -- Birth preferences (sensitive)
  birth_preferences JSONB DEFAULT '{}',
  -- Example: { "location": "hospital", "birth_plan_notes": "...", "special_requests": "..." }

  -- Emergency contact (sensitive)
  emergency_contact JSONB DEFAULT '{}',
  -- Example: { "name": "Jane Doe", "phone": "555-1234", "relationship": "Mother" }

  -- Relationship to Account
  account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,

  -- Communication preferences
  do_not_email BOOLEAN DEFAULT false,
  do_not_call BOOLEAN DEFAULT false,
  do_not_sms BOOLEAN DEFAULT false,
  email_opt_in BOOLEAN DEFAULT true,
  sms_opt_in BOOLEAN DEFAULT false,
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Attribution (from lead source tracking)
  lead_source TEXT,
  referral_partner_id UUID REFERENCES referral_partners(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Custom fields for extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT contact_org_email_unique UNIQUE(organization_id, email)
);

-- Now add the foreign key to accounts for primary_contact_id
ALTER TABLE crm_accounts
  ADD CONSTRAINT fk_primary_contact
  FOREIGN KEY (primary_contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- Indexes for crm_contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner ON crm_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON crm_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_name ON crm_contacts(organization_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_due_date ON crm_contacts(organization_id, expected_due_date) WHERE expected_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_custom_fields ON crm_contacts USING gin(custom_fields);

-- =====================================================
-- CONTACT-ACCOUNT RELATIONSHIPS
-- Allows multiple contacts per account with relationship types
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_account_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES crm_accounts(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type TEXT NOT NULL DEFAULT 'primary'
    CHECK (relationship_type IN ('primary', 'partner', 'parent', 'child', 'emergency_contact', 'other')),

  -- Is this the primary relationship for this contact?
  is_primary BOOLEAN DEFAULT false,

  -- Notes about the relationship
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT contact_account_unique UNIQUE(contact_id, account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_car_contact ON contact_account_relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_car_account ON contact_account_relationships(account_id);

-- =====================================================
-- CRM LEADS TABLE
-- Unqualified prospects that can be converted to Contact + Account + Opportunity
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Person information (copied to Contact on conversion)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Address (optional)
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',

  -- Lead qualification
  lead_status TEXT DEFAULT 'new'
    CHECK (lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  lead_source TEXT,
  lead_rating TEXT CHECK (lead_rating IN ('hot', 'warm', 'cold') OR lead_rating IS NULL),

  -- Interest information (becomes Opportunity on conversion)
  service_interest TEXT,
  estimated_value DECIMAL(10,2),
  expected_close_date DATE,

  -- Doula-specific
  expected_due_date DATE,
  message TEXT,

  -- Attribution
  referral_partner_id UUID REFERENCES referral_partners(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  landing_page TEXT,
  referrer_url TEXT,

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Conversion tracking
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  converted_contact_id UUID REFERENCES crm_contacts(id),
  converted_account_id UUID REFERENCES crm_accounts(id),
  converted_opportunity_id UUID, -- Will reference crm_opportunities after it's created
  converted_by UUID REFERENCES users(id),

  -- Custom fields for extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for crm_leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_org ON crm_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(organization_id, lead_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted ON crm_leads(organization_id, is_converted);
CREATE INDEX IF NOT EXISTS idx_crm_leads_due_date ON crm_leads(organization_id, expected_due_date) WHERE expected_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_custom_fields ON crm_leads USING gin(custom_fields);

-- =====================================================
-- CRM OPPORTUNITIES TABLE
-- Sales deals and service engagements
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,

  -- Relationships
  account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  primary_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Stage tracking
  stage TEXT DEFAULT 'qualification'
    CHECK (stage IN ('qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  stage_probability INTEGER DEFAULT 10
    CHECK (stage_probability >= 0 AND stage_probability <= 100),

  -- Financial
  amount DECIMAL(12,2),
  expected_revenue DECIMAL(12,2), -- amount * (probability / 100)

  -- Dates
  close_date DATE,
  actual_close_date DATE,

  -- Service details (doula-specific)
  service_type TEXT,
  package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,

  -- Status
  is_closed BOOLEAN DEFAULT false,
  is_won BOOLEAN DEFAULT false,

  -- Loss tracking
  closed_lost_reason TEXT,
  competitor TEXT,

  -- Next steps
  next_step TEXT,
  next_step_date DATE,

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Custom fields for extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Add FK from leads to opportunities
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_converted_opportunity
  FOREIGN KEY (converted_opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL;

-- Indexes for crm_opportunities
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_org ON crm_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_owner ON crm_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_account ON crm_opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_contact ON crm_opportunities(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_close_date ON crm_opportunities(organization_id, close_date) WHERE is_closed = false;
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_closed ON crm_opportunities(organization_id, is_closed, is_won);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_custom_fields ON crm_opportunities USING gin(custom_fields);

-- =====================================================
-- CRM ACTIVITIES TABLE
-- Unified activity log (tasks, events, calls, emails, notes)
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Activity type
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('task', 'event', 'call', 'email', 'note')),

  -- Content
  subject TEXT NOT NULL,
  description TEXT,

  -- Polymorphic relationship: What is this activity related to?
  related_to_type TEXT CHECK (related_to_type IN ('lead', 'contact', 'account', 'opportunity', 'client_service')),
  related_to_id UUID,

  -- Secondary relationship: Who is involved?
  who_type TEXT CHECK (who_type IN ('lead', 'contact')),
  who_id UUID,

  -- Status and priority
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),

  -- Timing
  due_date DATE,
  due_datetime TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- For events/meetings
  location TEXT,
  meeting_link TEXT,
  is_all_day BOOLEAN DEFAULT false,

  -- For calls
  call_result TEXT CHECK (call_result IN ('reached', 'left_voicemail', 'no_answer', 'busy', 'wrong_number') OR call_result IS NULL),
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound') OR call_direction IS NULL),

  -- Ownership and assignment
  owner_id UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),

  -- Reminders
  reminder_datetime TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,

  -- Custom fields for extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for crm_activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_org ON crm_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_owner ON crm_activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned ON crm_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(organization_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON crm_activities(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_activities_related ON crm_activities(related_to_type, related_to_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_who ON crm_activities(who_type, who_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due ON crm_activities(organization_id, due_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_crm_activities_custom_fields ON crm_activities USING gin(custom_fields);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_crm_accounts_updated_at ON crm_accounts;
CREATE TRIGGER update_crm_accounts_updated_at
  BEFORE UPDATE ON crm_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_opportunities_updated_at ON crm_opportunities;
CREATE TRIGGER update_crm_opportunities_updated_at
  BEFORE UPDATE ON crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities;
CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON crm_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- OPPORTUNITY STAGE PROBABILITY TRIGGER
-- Auto-set probability based on stage
-- =====================================================
CREATE OR REPLACE FUNCTION set_opportunity_probability()
RETURNS TRIGGER AS $$
BEGIN
  -- Set probability based on stage if not explicitly set
  IF NEW.stage IS DISTINCT FROM OLD.stage OR OLD IS NULL THEN
    NEW.stage_probability := CASE NEW.stage
      WHEN 'qualification' THEN 10
      WHEN 'needs_analysis' THEN 25
      WHEN 'proposal' THEN 50
      WHEN 'negotiation' THEN 75
      WHEN 'closed_won' THEN 100
      WHEN 'closed_lost' THEN 0
      ELSE NEW.stage_probability
    END;

    -- Set is_closed flag
    NEW.is_closed := NEW.stage IN ('closed_won', 'closed_lost');
    NEW.is_won := NEW.stage = 'closed_won';

    -- Set actual close date if closing
    IF NEW.is_closed AND OLD IS NOT NULL AND NOT OLD.is_closed THEN
      NEW.actual_close_date := CURRENT_DATE;
    END IF;
  END IF;

  -- Calculate expected revenue
  IF NEW.amount IS NOT NULL THEN
    NEW.expected_revenue := NEW.amount * (NEW.stage_probability::DECIMAL / 100);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_opportunity_probability_trigger ON crm_opportunities;
CREATE TRIGGER set_opportunity_probability_trigger
  BEFORE INSERT OR UPDATE ON crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION set_opportunity_probability();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_account_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRM_ACCOUNTS RLS POLICIES
-- =====================================================
CREATE POLICY "crm_accounts_select" ON crm_accounts
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_accounts_insert" ON crm_accounts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_accounts_update" ON crm_accounts
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_accounts_delete" ON crm_accounts
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- CRM_CONTACTS RLS POLICIES
-- =====================================================
CREATE POLICY "crm_contacts_select" ON crm_contacts
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_contacts_insert" ON crm_contacts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_contacts_update" ON crm_contacts
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_contacts_delete" ON crm_contacts
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- CONTACT_ACCOUNT_RELATIONSHIPS RLS POLICIES
-- =====================================================
CREATE POLICY "car_select" ON contact_account_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = contact_account_relationships.contact_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "car_insert" ON contact_account_relationships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = contact_account_relationships.contact_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "car_update" ON contact_account_relationships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = contact_account_relationships.contact_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "car_delete" ON contact_account_relationships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = contact_account_relationships.contact_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- =====================================================
-- CRM_LEADS RLS POLICIES
-- =====================================================
CREATE POLICY "crm_leads_select" ON crm_leads
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_leads_insert" ON crm_leads
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_leads_update" ON crm_leads
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_leads_delete" ON crm_leads
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- CRM_OPPORTUNITIES RLS POLICIES
-- =====================================================
CREATE POLICY "crm_opportunities_select" ON crm_opportunities
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_opportunities_insert" ON crm_opportunities
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_opportunities_update" ON crm_opportunities
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_opportunities_delete" ON crm_opportunities
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- CRM_ACTIVITIES RLS POLICIES
-- =====================================================
CREATE POLICY "crm_activities_select" ON crm_activities
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_activities_insert" ON crm_activities
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_activities_update" ON crm_activities
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "crm_activities_delete" ON crm_activities
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- SEED STANDARD FIELD DEFINITIONS
-- These define the schema for form rendering
-- =====================================================

-- Get the standard object IDs
DO $$
DECLARE
  v_contact_id UUID;
  v_account_id UUID;
  v_lead_id UUID;
  v_opportunity_id UUID;
  v_activity_id UUID;
BEGIN
  SELECT id INTO v_contact_id FROM object_definitions WHERE api_name = 'Contact' AND is_standard = true;
  SELECT id INTO v_account_id FROM object_definitions WHERE api_name = 'Account' AND is_standard = true;
  SELECT id INTO v_lead_id FROM object_definitions WHERE api_name = 'Lead' AND is_standard = true;
  SELECT id INTO v_opportunity_id FROM object_definitions WHERE api_name = 'Opportunity' AND is_standard = true;
  SELECT id INTO v_activity_id FROM object_definitions WHERE api_name = 'Activity' AND is_standard = true;

  -- =====================================================
  -- CONTACT FIELDS
  -- =====================================================
  INSERT INTO field_definitions (object_definition_id, api_name, label, data_type, column_name, is_standard, is_name_field, is_required, display_order)
  VALUES
    (v_contact_id, 'first_name', 'First Name', 'text', 'first_name', true, false, true, 1),
    (v_contact_id, 'last_name', 'Last Name', 'text', 'last_name', true, true, true, 2),
    (v_contact_id, 'email', 'Email', 'email', 'email', true, false, false, 3),
    (v_contact_id, 'phone', 'Phone', 'phone', 'phone', true, false, false, 4),
    (v_contact_id, 'mobile_phone', 'Mobile Phone', 'phone', 'mobile_phone', true, false, false, 5),
    (v_contact_id, 'mailing_street', 'Mailing Street', 'text', 'mailing_street', true, false, false, 6),
    (v_contact_id, 'mailing_city', 'Mailing City', 'text', 'mailing_city', true, false, false, 7),
    (v_contact_id, 'mailing_state', 'Mailing State', 'text', 'mailing_state', true, false, false, 8),
    (v_contact_id, 'mailing_postal_code', 'Mailing Postal Code', 'text', 'mailing_postal_code', true, false, false, 9),
    (v_contact_id, 'birthdate', 'Birthdate', 'date', 'birthdate', true, false, false, 10),
    (v_contact_id, 'partner_name', 'Partner Name', 'text', 'partner_name', true, false, false, 11),
    (v_contact_id, 'expected_due_date', 'Expected Due Date', 'date', 'expected_due_date', true, false, false, 12),
    (v_contact_id, 'actual_birth_date', 'Actual Birth Date', 'date', 'actual_birth_date', true, false, false, 13),
    (v_contact_id, 'account_id', 'Account', 'lookup', 'account_id', true, false, false, 14),
    (v_contact_id, 'lead_source', 'Lead Source', 'picklist', 'lead_source', true, false, false, 15),
    (v_contact_id, 'do_not_email', 'Do Not Email', 'checkbox', 'do_not_email', true, false, false, 16),
    (v_contact_id, 'do_not_call', 'Do Not Call', 'checkbox', 'do_not_call', true, false, false, 17),
    (v_contact_id, 'email_opt_in', 'Email Opt-In', 'checkbox', 'email_opt_in', true, false, false, 18),
    (v_contact_id, 'is_active', 'Active', 'checkbox', 'is_active', true, false, false, 19)
  ON CONFLICT (object_definition_id, api_name) DO NOTHING;

  -- =====================================================
  -- ACCOUNT FIELDS
  -- =====================================================
  INSERT INTO field_definitions (object_definition_id, api_name, label, data_type, column_name, is_standard, is_name_field, is_required, display_order)
  VALUES
    (v_account_id, 'name', 'Account Name', 'text', 'name', true, true, true, 1),
    (v_account_id, 'account_type', 'Account Type', 'picklist', 'account_type', true, false, false, 2),
    (v_account_id, 'primary_contact_id', 'Primary Contact', 'lookup', 'primary_contact_id', true, false, false, 3),
    (v_account_id, 'billing_street', 'Billing Street', 'text', 'billing_street', true, false, false, 4),
    (v_account_id, 'billing_city', 'Billing City', 'text', 'billing_city', true, false, false, 5),
    (v_account_id, 'billing_state', 'Billing State', 'text', 'billing_state', true, false, false, 6),
    (v_account_id, 'billing_postal_code', 'Billing Postal Code', 'text', 'billing_postal_code', true, false, false, 7),
    (v_account_id, 'account_status', 'Account Status', 'picklist', 'account_status', true, false, false, 8),
    (v_account_id, 'lifecycle_stage', 'Lifecycle Stage', 'picklist', 'lifecycle_stage', true, false, false, 9),
    (v_account_id, 'total_revenue', 'Total Revenue', 'currency', 'total_revenue', true, false, false, 10),
    (v_account_id, 'outstanding_balance', 'Outstanding Balance', 'currency', 'outstanding_balance', true, false, false, 11)
  ON CONFLICT (object_definition_id, api_name) DO NOTHING;

  -- =====================================================
  -- LEAD FIELDS
  -- =====================================================
  INSERT INTO field_definitions (object_definition_id, api_name, label, data_type, column_name, is_standard, is_name_field, is_required, display_order)
  VALUES
    (v_lead_id, 'first_name', 'First Name', 'text', 'first_name', true, false, true, 1),
    (v_lead_id, 'last_name', 'Last Name', 'text', 'last_name', true, true, true, 2),
    (v_lead_id, 'email', 'Email', 'email', 'email', true, false, false, 3),
    (v_lead_id, 'phone', 'Phone', 'phone', 'phone', true, false, false, 4),
    (v_lead_id, 'lead_status', 'Lead Status', 'picklist', 'lead_status', true, false, true, 5),
    (v_lead_id, 'lead_source', 'Lead Source', 'picklist', 'lead_source', true, false, false, 6),
    (v_lead_id, 'lead_rating', 'Lead Rating', 'picklist', 'lead_rating', true, false, false, 7),
    (v_lead_id, 'service_interest', 'Service Interest', 'picklist', 'service_interest', true, false, false, 8),
    (v_lead_id, 'estimated_value', 'Estimated Value', 'currency', 'estimated_value', true, false, false, 9),
    (v_lead_id, 'expected_close_date', 'Expected Close Date', 'date', 'expected_close_date', true, false, false, 10),
    (v_lead_id, 'expected_due_date', 'Expected Due Date', 'date', 'expected_due_date', true, false, false, 11),
    (v_lead_id, 'message', 'Message', 'textarea', 'message', true, false, false, 12),
    (v_lead_id, 'is_converted', 'Converted', 'checkbox', 'is_converted', true, false, false, 13)
  ON CONFLICT (object_definition_id, api_name) DO NOTHING;

  -- =====================================================
  -- OPPORTUNITY FIELDS
  -- =====================================================
  INSERT INTO field_definitions (object_definition_id, api_name, label, data_type, column_name, is_standard, is_name_field, is_required, display_order)
  VALUES
    (v_opportunity_id, 'name', 'Opportunity Name', 'text', 'name', true, true, true, 1),
    (v_opportunity_id, 'description', 'Description', 'textarea', 'description', true, false, false, 2),
    (v_opportunity_id, 'account_id', 'Account', 'lookup', 'account_id', true, false, false, 3),
    (v_opportunity_id, 'primary_contact_id', 'Primary Contact', 'lookup', 'primary_contact_id', true, false, false, 4),
    (v_opportunity_id, 'stage', 'Stage', 'picklist', 'stage', true, false, true, 5),
    (v_opportunity_id, 'amount', 'Amount', 'currency', 'amount', true, false, false, 6),
    (v_opportunity_id, 'expected_revenue', 'Expected Revenue', 'currency', 'expected_revenue', true, false, false, 7),
    (v_opportunity_id, 'close_date', 'Close Date', 'date', 'close_date', true, false, false, 8),
    (v_opportunity_id, 'service_type', 'Service Type', 'picklist', 'service_type', true, false, false, 9),
    (v_opportunity_id, 'next_step', 'Next Step', 'text', 'next_step', true, false, false, 10),
    (v_opportunity_id, 'next_step_date', 'Next Step Date', 'date', 'next_step_date', true, false, false, 11),
    (v_opportunity_id, 'is_closed', 'Closed', 'checkbox', 'is_closed', true, false, false, 12),
    (v_opportunity_id, 'is_won', 'Won', 'checkbox', 'is_won', true, false, false, 13),
    (v_opportunity_id, 'closed_lost_reason', 'Closed Lost Reason', 'picklist', 'closed_lost_reason', true, false, false, 14)
  ON CONFLICT (object_definition_id, api_name) DO NOTHING;

  -- =====================================================
  -- ACTIVITY FIELDS
  -- =====================================================
  INSERT INTO field_definitions (object_definition_id, api_name, label, data_type, column_name, is_standard, is_name_field, is_required, display_order)
  VALUES
    (v_activity_id, 'activity_type', 'Activity Type', 'picklist', 'activity_type', true, false, true, 1),
    (v_activity_id, 'subject', 'Subject', 'text', 'subject', true, true, true, 2),
    (v_activity_id, 'description', 'Description', 'textarea', 'description', true, false, false, 3),
    (v_activity_id, 'status', 'Status', 'picklist', 'status', true, false, false, 4),
    (v_activity_id, 'priority', 'Priority', 'picklist', 'priority', true, false, false, 5),
    (v_activity_id, 'due_date', 'Due Date', 'date', 'due_date', true, false, false, 6),
    (v_activity_id, 'due_datetime', 'Due Date/Time', 'datetime', 'due_datetime', true, false, false, 7),
    (v_activity_id, 'location', 'Location', 'text', 'location', true, false, false, 8),
    (v_activity_id, 'meeting_link', 'Meeting Link', 'url', 'meeting_link', true, false, false, 9),
    (v_activity_id, 'is_all_day', 'All Day', 'checkbox', 'is_all_day', true, false, false, 10),
    (v_activity_id, 'call_result', 'Call Result', 'picklist', 'call_result', true, false, false, 11),
    (v_activity_id, 'call_direction', 'Call Direction', 'picklist', 'call_direction', true, false, false, 12)
  ON CONFLICT (object_definition_id, api_name) DO NOTHING;

  -- =====================================================
  -- SEED PICKLIST VALUES
  -- =====================================================

  -- Lead Status picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('new', 'New', 1, true, '#3B82F6'),
    ('contacted', 'Contacted', 2, false, '#8B5CF6'),
    ('qualified', 'Qualified', 3, false, '#10B981'),
    ('unqualified', 'Unqualified', 4, false, '#F59E0B'),
    ('converted', 'Converted', 5, false, '#6B7280')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'lead_status' AND fd.object_definition_id = v_lead_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Lead Rating picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('hot', 'Hot', 1, false, '#EF4444'),
    ('warm', 'Warm', 2, false, '#F59E0B'),
    ('cold', 'Cold', 3, false, '#3B82F6')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'lead_rating' AND fd.object_definition_id = v_lead_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Opportunity Stage picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('qualification', 'Qualification', 1, true, '#3B82F6'),
    ('needs_analysis', 'Needs Analysis', 2, false, '#8B5CF6'),
    ('proposal', 'Proposal', 3, false, '#F59E0B'),
    ('negotiation', 'Negotiation', 4, false, '#EC4899'),
    ('closed_won', 'Closed Won', 5, false, '#10B981'),
    ('closed_lost', 'Closed Lost', 6, false, '#6B7280')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'stage' AND fd.object_definition_id = v_opportunity_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Account Status picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('prospect', 'Prospect', 1, true, '#F59E0B'),
    ('active', 'Active', 2, false, '#10B981'),
    ('inactive', 'Inactive', 3, false, '#6B7280'),
    ('churned', 'Churned', 4, false, '#EF4444')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'account_status' AND fd.object_definition_id = v_account_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Account Type picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('household', 'Household', 1, true, '#3B82F6'),
    ('business', 'Business', 2, false, '#8B5CF6'),
    ('partner', 'Partner', 3, false, '#10B981')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'account_type' AND fd.object_definition_id = v_account_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Activity Type picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('task', 'Task', 1, true, '#3B82F6'),
    ('event', 'Event', 2, false, '#8B5CF6'),
    ('call', 'Call', 3, false, '#10B981'),
    ('email', 'Email', 4, false, '#F59E0B'),
    ('note', 'Note', 5, false, '#6B7280')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'activity_type' AND fd.object_definition_id = v_activity_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Activity Status picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('open', 'Open', 1, true, '#3B82F6'),
    ('completed', 'Completed', 2, false, '#10B981'),
    ('cancelled', 'Cancelled', 3, false, '#6B7280')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'status' AND fd.object_definition_id = v_activity_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

  -- Activity Priority picklist
  INSERT INTO picklist_values (field_definition_id, value, label, display_order, is_default, color)
  SELECT fd.id, pv.value, pv.label, pv.display_order, pv.is_default, pv.color
  FROM field_definitions fd
  CROSS JOIN (VALUES
    ('high', 'High', 1, false, '#EF4444'),
    ('normal', 'Normal', 2, true, '#3B82F6'),
    ('low', 'Low', 3, false, '#6B7280')
  ) AS pv(value, label, display_order, is_default, color)
  WHERE fd.api_name = 'priority' AND fd.object_definition_id = v_activity_id
  ON CONFLICT (field_definition_id, value) DO NOTHING;

END $$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE crm_accounts IS 'Household/family units that group related contacts together. Primary entity for billing and services.';
COMMENT ON TABLE crm_contacts IS 'Individual person records with demographics, contact info, and preferences. Can belong to an Account.';
COMMENT ON TABLE contact_account_relationships IS 'Links contacts to accounts with relationship types (primary, partner, parent, child, etc.)';
COMMENT ON TABLE crm_leads IS 'Unqualified prospects. Convert to Contact + Account + Opportunity when qualified.';
COMMENT ON TABLE crm_opportunities IS 'Sales deals and service engagements. Tracks stage, amount, and close probability.';
COMMENT ON TABLE crm_activities IS 'Unified activity log for tasks, events, calls, emails, and notes.';
