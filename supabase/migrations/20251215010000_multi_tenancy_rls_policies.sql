-- ============================================================================
-- Migration: Multi-Tenancy RLS Policies (Phase C.1)
-- Updates all RLS policies to include organization_id checks
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS TABLE RLS
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins can update their organization" ON organizations;

-- Organizations: Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Organizations: Org owners/admins can update their organization
CREATE POLICY "Org admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 2. ORGANIZATION MEMBERSHIPS RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view memberships in their orgs" ON organization_memberships;
DROP POLICY IF EXISTS "Org admins can manage memberships" ON organization_memberships;

-- Memberships: Users can view memberships in their organizations
CREATE POLICY "Users can view memberships in their orgs"
  ON organization_memberships FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Memberships: Admins can manage memberships
CREATE POLICY "Org admins can manage memberships"
  ON organization_memberships FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. USERS TABLE RLS (Update existing)
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view other users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON users;
DROP POLICY IF EXISTS "Users can manage users in their org" ON users;

-- Users: Can view users in same organization
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- Users: Can update own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users: Can insert own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 4. LEADS TABLE RLS (Update existing)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage leads" ON leads;
DROP POLICY IF EXISTS "Users can manage leads in their org" ON leads;

-- Leads: Org members can manage leads
CREATE POLICY "Users can manage leads in their org"
  ON leads FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 5. TEAM_MEMBERS TABLE RLS (Update existing)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage team_members" ON team_members;
DROP POLICY IF EXISTS "Team members can view team in their org" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

-- Team members: Org members can view
CREATE POLICY "Team members can view team in their org"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- Team members: Admins can manage
CREATE POLICY "Admins can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 6. CLIENT_SERVICES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage client_services" ON client_services;
DROP POLICY IF EXISTS "Users can manage client services in their org" ON client_services;

CREATE POLICY "Users can manage client services in their org"
  ON client_services FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 7. MEETINGS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage meetings" ON meetings;
DROP POLICY IF EXISTS "Users can manage meetings in their org" ON meetings;

CREATE POLICY "Users can manage meetings in their org"
  ON meetings FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 8. LEAD_ACTIVITIES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage lead_activities" ON lead_activities;
DROP POLICY IF EXISTS "Users can manage lead activities in their org" ON lead_activities;

CREATE POLICY "Users can manage lead activities in their org"
  ON lead_activities FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 9. CLIENT_DOCUMENTS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage client_documents" ON client_documents;
DROP POLICY IF EXISTS "Users can manage client documents in their org" ON client_documents;

CREATE POLICY "Users can manage client documents in their org"
  ON client_documents FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 10. PAYMENTS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage payments" ON payments;
DROP POLICY IF EXISTS "Users can manage payments in their org" ON payments;

CREATE POLICY "Users can manage payments in their org"
  ON payments FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 11. INVOICES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Users can manage invoices in their org" ON invoices;

CREATE POLICY "Users can manage invoices in their org"
  ON invoices FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 12. CONTRACT_TEMPLATES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage contract_templates" ON contract_templates;
DROP POLICY IF EXISTS "Users can manage contract templates in their org" ON contract_templates;

CREATE POLICY "Users can manage contract templates in their org"
  ON contract_templates FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 13. CONTRACT_SIGNATURES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage contract_signatures" ON contract_signatures;
DROP POLICY IF EXISTS "Users can manage contract signatures in their org" ON contract_signatures;

CREATE POLICY "Users can manage contract signatures in their org"
  ON contract_signatures FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 14. INTAKE_FORM_TEMPLATES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage intake_form_templates" ON intake_form_templates;
DROP POLICY IF EXISTS "Users can manage intake form templates in their org" ON intake_form_templates;

CREATE POLICY "Users can manage intake form templates in their org"
  ON intake_form_templates FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 15. INTAKE_FORM_SUBMISSIONS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage intake_form_submissions" ON intake_form_submissions;
DROP POLICY IF EXISTS "Users can manage intake form submissions in their org" ON intake_form_submissions;

CREATE POLICY "Users can manage intake form submissions in their org"
  ON intake_form_submissions FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 16. WORKFLOWS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage workflows" ON workflows;
DROP POLICY IF EXISTS "Users can manage workflows in their org" ON workflows;

CREATE POLICY "Users can manage workflows in their org"
  ON workflows FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 17. WORKFLOW_STEPS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage workflow_steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can manage workflow steps in their org" ON workflow_steps;

CREATE POLICY "Users can manage workflow steps in their org"
  ON workflow_steps FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 18. WORKFLOW_EXECUTIONS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage workflow_executions" ON workflow_executions;
DROP POLICY IF EXISTS "Users can manage workflow executions in their org" ON workflow_executions;

CREATE POLICY "Users can manage workflow executions in their org"
  ON workflow_executions FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 19. WORKFLOW_STEP_EXECUTIONS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage workflow_step_executions" ON workflow_step_executions;
DROP POLICY IF EXISTS "Users can manage workflow step executions in their org" ON workflow_step_executions;

CREATE POLICY "Users can manage workflow step executions in their org"
  ON workflow_step_executions FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 20. WORKFLOW_TEMPLATES TABLE RLS
-- Global templates are visible to all, org templates to org members
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view workflow_templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can view workflow templates" ON workflow_templates;
DROP POLICY IF EXISTS "Admins can manage workflow templates" ON workflow_templates;

-- View: All can see global templates, org members see their org templates
CREATE POLICY "Users can view workflow templates"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- Manage: Only org templates by org members
CREATE POLICY "Admins can manage workflow templates"
  ON workflow_templates FOR ALL
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 21. CONVERSATIONS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage conversations" ON conversations;
DROP POLICY IF EXISTS "Users can manage conversations in their org" ON conversations;

CREATE POLICY "Users can manage conversations in their org"
  ON conversations FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 22. CONVERSATION_PARTICIPANTS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage conversation participants in their org" ON conversation_participants;

CREATE POLICY "Users can manage conversation participants in their org"
  ON conversation_participants FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 23. MESSAGES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage messages" ON messages;
DROP POLICY IF EXISTS "Users can manage messages in their org" ON messages;

CREATE POLICY "Users can manage messages in their org"
  ON messages FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 24. COMPANY_SETTINGS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can view their org settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can manage org settings" ON company_settings;

-- View: All org members can view settings
CREATE POLICY "Users can view their org settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- Manage: Only admins can update settings
CREATE POLICY "Admins can manage org settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 25. SERVICE_PACKAGES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage service_packages" ON service_packages;
DROP POLICY IF EXISTS "Users can manage service packages in their org" ON service_packages;

CREATE POLICY "Users can manage service packages in their org"
  ON service_packages FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- 26. ROLES TABLE RLS
-- System roles are visible to all, org roles to org members
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Users can view roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage org roles" ON roles;

-- View: See system roles + org roles
CREATE POLICY "Users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (
    is_system = true OR
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

-- Manage: Only non-system org roles
CREATE POLICY "Admins can manage org roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    is_system = false AND
    (organization_id IS NULL OR organization_id = get_user_organization_id())
  )
  WITH CHECK (
    is_system = false AND
    (organization_id IS NULL OR organization_id = get_user_organization_id())
  );

-- ============================================================================
-- 27. REMAINING TABLES - Apply standard org policy pattern
-- ============================================================================

-- Notification preferences
DROP POLICY IF EXISTS "Authenticated users can manage notification_preferences" ON notification_preferences;
CREATE POLICY "Users can manage notification preferences in their org"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Notification log
DROP POLICY IF EXISTS "Authenticated users can manage notification_log" ON notification_log;
CREATE POLICY "Users can manage notification log in their org"
  ON notification_log FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Client sessions
DROP POLICY IF EXISTS "Authenticated users can manage client_sessions" ON client_sessions;
CREATE POLICY "Users can manage client sessions in their org"
  ON client_sessions FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Client auth tokens
DROP POLICY IF EXISTS "Authenticated users can manage client_auth_tokens" ON client_auth_tokens;
CREATE POLICY "Users can manage client auth tokens in their org"
  ON client_auth_tokens FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Client assignments
DROP POLICY IF EXISTS "Authenticated users can manage client_assignments" ON client_assignments;
CREATE POLICY "Users can manage client assignments in their org"
  ON client_assignments FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Service assignments
DROP POLICY IF EXISTS "Authenticated users can manage service_assignments" ON service_assignments;
CREATE POLICY "Users can manage service assignments in their org"
  ON service_assignments FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Time entries
DROP POLICY IF EXISTS "Authenticated users can manage time_entries" ON time_entries;
CREATE POLICY "Users can manage time entries in their org"
  ON time_entries FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- On-call schedule
DROP POLICY IF EXISTS "Authenticated users can manage oncall_schedule" ON oncall_schedule;
CREATE POLICY "Users can manage oncall schedule in their org"
  ON oncall_schedule FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- User invitations
DROP POLICY IF EXISTS "Authenticated users can manage user_invitations" ON user_invitations;
CREATE POLICY "Users can manage user invitations in their org"
  ON user_invitations FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- User preferences
DROP POLICY IF EXISTS "Authenticated users can manage user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage their preferences" ON user_preferences;
CREATE POLICY "Users can manage their preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- List views
DROP POLICY IF EXISTS "Authenticated users can manage list_views" ON list_views;
CREATE POLICY "Users can manage list views in their org"
  ON list_views FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Saved filters
DROP POLICY IF EXISTS "Authenticated users can manage saved_filters" ON saved_filters;
CREATE POLICY "Users can manage saved filters in their org"
  ON saved_filters FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Reports
DROP POLICY IF EXISTS "Authenticated users can manage reports" ON reports;
CREATE POLICY "Users can manage reports in their org"
  ON reports FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Dashboards
DROP POLICY IF EXISTS "Authenticated users can manage dashboards" ON dashboards;
CREATE POLICY "Users can manage dashboards in their org"
  ON dashboards FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Dashboard widgets
DROP POLICY IF EXISTS "Authenticated users can manage dashboard_widgets" ON dashboard_widgets;
CREATE POLICY "Users can manage dashboard widgets in their org"
  ON dashboard_widgets FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Action item templates
DROP POLICY IF EXISTS "Authenticated users can manage action_item_templates" ON action_item_templates;
CREATE POLICY "Users can manage action item templates in their org"
  ON action_item_templates FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Client action items
DROP POLICY IF EXISTS "Authenticated users can manage client_action_items" ON client_action_items;
CREATE POLICY "Users can manage client action items in their org"
  ON client_action_items FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- Client journey milestones
DROP POLICY IF EXISTS "Authenticated users can manage client_journey_milestones" ON client_journey_milestones;
CREATE POLICY "Users can manage client journey milestones in their org"
  ON client_journey_milestones FOR ALL
  TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_organization_id())
  WITH CHECK (organization_id IS NULL OR organization_id = get_user_organization_id());

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Returns the current authenticated user''s organization ID. Used in all tenant-scoped RLS policies.';
