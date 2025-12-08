-- =====================================================
-- Team Members & Multi-Provider Support
-- Phase 5: Team functionality for collaborative practice
-- =====================================================

-- =====================================================
-- TEAM MEMBERS TABLE
-- Core team member/provider profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to Supabase auth (optional - some team members may not have login)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Role within the practice
  -- 'owner' = practice owner (your wife), full access
  -- 'admin' = administrative access (you), can manage team
  -- 'provider' = doula/consultant, can manage assigned clients
  -- 'assistant' = limited access, view + scheduling only
  role TEXT NOT NULL DEFAULT 'provider' CHECK (role IN ('owner', 'admin', 'provider', 'assistant')),

  -- Profile information
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,  -- "Birth Doula", "Lactation Consultant", "Postpartum Doula"
  bio TEXT,
  avatar_url TEXT,

  -- Professional credentials
  certifications TEXT[] DEFAULT '{}',  -- ['DONA Birth Doula', 'IBCLC', etc.]
  specialties TEXT[] DEFAULT '{}',     -- ['High-risk', 'VBAC', 'Multiples', etc.]

  -- Availability & capacity
  is_active BOOLEAN DEFAULT true,
  is_accepting_clients BOOLEAN DEFAULT true,
  max_active_clients INTEGER,  -- NULL = unlimited

  -- Billing/compensation
  hourly_rate DECIMAL(10,2),  -- For time tracking calculations

  -- On-call settings
  is_available_oncall BOOLEAN DEFAULT false,
  oncall_phone TEXT,  -- Separate on-call number if different

  -- Contact visibility for clients
  show_email_to_clients BOOLEAN DEFAULT true,
  show_phone_to_clients BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common lookups
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_active ON team_members(is_active);

-- =====================================================
-- CLIENT ASSIGNMENTS
-- Many-to-many relationship between clients and providers
-- Supports primary, backup, and support roles
-- =====================================================
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The client (lead)
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- The assigned team member
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- Assignment role
  -- 'primary' = main provider for this client
  -- 'backup' = on-call backup (for births)
  -- 'support' = additional support provider
  assignment_role TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_role IN ('primary', 'backup', 'support')),

  -- Assignment context
  notes TEXT,  -- "Backup for birth only", "Lactation support", etc.

  -- Tracking
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES team_members(id),

  -- Ensure unique assignment per role type
  UNIQUE(client_id, team_member_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX idx_client_assignments_member ON client_assignments(team_member_id);
CREATE INDEX idx_client_assignments_role ON client_assignments(assignment_role);

-- =====================================================
-- SERVICE ASSIGNMENTS
-- Track which team member(s) provide each service
-- =====================================================
CREATE TABLE IF NOT EXISTS service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The client service
  service_id UUID NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,

  -- The assigned team member
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- Role for this specific service
  assignment_role TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_role IN ('primary', 'backup', 'support')),

  -- Revenue attribution percentage (for splits)
  -- 100 = full revenue, 50 = half, etc.
  revenue_share_percent INTEGER DEFAULT 100 CHECK (revenue_share_percent >= 0 AND revenue_share_percent <= 100),

  -- Tracking
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(service_id, team_member_id)
);

CREATE INDEX idx_service_assignments_service ON service_assignments(service_id);
CREATE INDEX idx_service_assignments_member ON service_assignments(team_member_id);

-- =====================================================
-- TIME ENTRIES
-- Track hours worked by team members
-- =====================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who logged the time
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- What it's for (optional associations)
  client_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,

  -- Time details
  entry_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),

  -- Category for reporting
  entry_type TEXT NOT NULL DEFAULT 'client_work' CHECK (entry_type IN (
    'client_work',      -- Direct client time
    'travel',           -- Travel to/from client
    'on_call',          -- On-call waiting time
    'birth_support',    -- Active birth support
    'admin',            -- Administrative work
    'training',         -- Professional development
    'other'
  )),

  -- Description
  description TEXT,

  -- Billing status
  billable BOOLEAN DEFAULT true,
  hourly_rate_override DECIMAL(10,2),  -- Override team member's default rate

  -- Invoice tracking
  invoiced BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reporting
CREATE INDEX idx_time_entries_member ON time_entries(team_member_id);
CREATE INDEX idx_time_entries_client ON time_entries(client_id);
CREATE INDEX idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_type ON time_entries(entry_type);
CREATE INDEX idx_time_entries_invoiced ON time_entries(invoiced);

-- =====================================================
-- ON-CALL SCHEDULE
-- Track who is on-call for births
-- =====================================================
CREATE TABLE IF NOT EXISTS oncall_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The team member on call
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- Schedule period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Type of on-call
  oncall_type TEXT NOT NULL DEFAULT 'primary' CHECK (oncall_type IN ('primary', 'backup')),

  -- Notes
  notes TEXT,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES team_members(id),

  -- Ensure date range is valid
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_oncall_schedule_member ON oncall_schedule(team_member_id);
CREATE INDEX idx_oncall_schedule_dates ON oncall_schedule(start_date, end_date);

-- =====================================================
-- MODIFY EXISTING TABLES
-- Add team member references
-- =====================================================

-- Add primary provider to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS primary_provider_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add provider to meetings
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add provider to invoices for revenue attribution
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_leads_primary_provider ON leads(primary_provider_id);
CREATE INDEX IF NOT EXISTS idx_meetings_provider ON meetings(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider ON invoices(provider_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE oncall_schedule ENABLE ROW LEVEL SECURITY;

-- Team members: All authenticated users can view, only admin/owner can modify
CREATE POLICY "Team members viewable by authenticated users"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members modifiable by admin"
  ON team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Client assignments: All authenticated can view/modify
CREATE POLICY "Client assignments accessible by authenticated"
  ON client_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service assignments: All authenticated can view/modify
CREATE POLICY "Service assignments accessible by authenticated"
  ON service_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Time entries: All authenticated can view/modify
CREATE POLICY "Time entries accessible by authenticated"
  ON time_entries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- On-call schedule: All authenticated can view/modify
CREATE POLICY "On-call schedule accessible by authenticated"
  ON oncall_schedule FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get a client's assigned team members
CREATE OR REPLACE FUNCTION get_client_team(p_client_id UUID)
RETURNS TABLE (
  team_member_id UUID,
  display_name TEXT,
  role TEXT,
  assignment_role TEXT,
  email TEXT,
  phone TEXT,
  show_email_to_clients BOOLEAN,
  show_phone_to_clients BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.display_name,
    tm.role,
    ca.assignment_role,
    tm.email,
    tm.phone,
    tm.show_email_to_clients,
    tm.show_phone_to_clients
  FROM client_assignments ca
  JOIN team_members tm ON tm.id = ca.team_member_id
  WHERE ca.client_id = p_client_id
    AND tm.is_active = true
  ORDER BY
    CASE ca.assignment_role
      WHEN 'primary' THEN 1
      WHEN 'backup' THEN 2
      ELSE 3
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current on-call providers
CREATE OR REPLACE FUNCTION get_current_oncall()
RETURNS TABLE (
  team_member_id UUID,
  display_name TEXT,
  oncall_type TEXT,
  oncall_phone TEXT,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.display_name,
    os.oncall_type,
    COALESCE(tm.oncall_phone, tm.phone) as oncall_phone,
    os.start_date,
    os.end_date
  FROM oncall_schedule os
  JOIN team_members tm ON tm.id = os.team_member_id
  WHERE CURRENT_DATE BETWEEN os.start_date AND os.end_date
    AND tm.is_active = true
  ORDER BY
    CASE os.oncall_type
      WHEN 'primary' THEN 1
      ELSE 2
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate team member revenue for a period
CREATE OR REPLACE FUNCTION get_team_member_revenue(
  p_team_member_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_invoiced DECIMAL,
  total_paid DECIMAL,
  total_hours DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.total_amount * (sa.revenue_share_percent::DECIMAL / 100) ELSE 0 END), 0) as total_invoiced,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount * (sa.revenue_share_percent::DECIMAL / 100) ELSE 0 END), 0) as total_paid,
    COALESCE((
      SELECT SUM(te.hours)
      FROM time_entries te
      WHERE te.team_member_id = p_team_member_id
        AND te.entry_date BETWEEN p_start_date AND p_end_date
    ), 0) as total_hours
  FROM service_assignments sa
  LEFT JOIN client_services cs ON cs.id = sa.service_id
  LEFT JOIN invoices i ON i.service_id = cs.id
  WHERE sa.team_member_id = p_team_member_id
    AND (i.created_at IS NULL OR i.created_at::DATE BETWEEN p_start_date AND p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at for team_members
CREATE OR REPLACE FUNCTION update_team_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_timestamp();

-- Auto-update updated_at for time_entries
CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_timestamp();

-- Log activity when team member is assigned to client
CREATE OR REPLACE FUNCTION log_client_assignment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_member_name TEXT;
BEGIN
  SELECT name INTO v_client_name FROM leads WHERE id = NEW.client_id;
  SELECT display_name INTO v_member_name FROM team_members WHERE id = NEW.team_member_id;

  INSERT INTO lead_activities (lead_id, activity_type, description, created_by_user_id)
  VALUES (
    NEW.client_id,
    'team_assigned',
    format('%s assigned as %s provider', v_member_name, NEW.assignment_role),
    (SELECT user_id FROM team_members WHERE id = NEW.assigned_by)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_assignment_activity
  AFTER INSERT ON client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION log_client_assignment_activity();
