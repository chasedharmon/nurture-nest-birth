-- =====================================================
-- Performance Optimization Indexes
-- Phase 13: Launch Preparation
-- Created: December 13, 2025
-- =====================================================

-- This migration adds missing indexes identified in the Phase 13
-- performance audit. These indexes improve:
-- 1. Foreign key join performance
-- 2. Multi-tenant filtered queries
-- 3. List view sorting and filtering

-- =====================================================
-- FOREIGN KEY INDEXES
-- Missing indexes on FK columns used in joins
-- =====================================================

-- CRM Leads - referral partner lookups
CREATE INDEX IF NOT EXISTS idx_crm_leads_referral_partner_id
  ON crm_leads(referral_partner_id)
  WHERE referral_partner_id IS NOT NULL;

-- Time entries - invoice and service relationships
CREATE INDEX IF NOT EXISTS idx_time_entries_invoice_id
  ON time_entries(invoice_id)
  WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_time_entries_service_id
  ON time_entries(service_id);

-- Client assignments - who assigned tracking
CREATE INDEX IF NOT EXISTS idx_client_assignments_assigned_by
  ON client_assignments(assigned_by);

-- Service assignments - date-based filtering
CREATE INDEX IF NOT EXISTS idx_service_assignments_assigned_at
  ON service_assignments(assigned_at);

-- Invoices - created by tracking
CREATE INDEX IF NOT EXISTS idx_invoices_created_by
  ON invoices(created_by);

-- Messages - reply threading
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id
  ON messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- =====================================================
-- COMPOSITE INDEXES FOR LIST VIEWS
-- Multi-column indexes for common filter + sort patterns
-- =====================================================

-- CRM Leads: org + status (most common filter combo)
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_status
  ON crm_leads(organization_id, lead_status);

-- CRM Leads: org + created_at for recent leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_created
  ON crm_leads(organization_id, created_at DESC);

-- CRM Contacts: org + active status
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_active
  ON crm_contacts(organization_id, is_active);

-- CRM Contacts: org + created_at for recent contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_created
  ON crm_contacts(organization_id, created_at DESC);

-- CRM Accounts: org + status
CREATE INDEX IF NOT EXISTS idx_crm_accounts_org_status
  ON crm_accounts(organization_id, account_status);

-- CRM Opportunities: org + stage + close date (pipeline view)
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_org_stage_close
  ON crm_opportunities(organization_id, stage, close_date DESC);

-- CRM Activities: partial index for open tasks only
CREATE INDEX IF NOT EXISTS idx_crm_activities_org_open
  ON crm_activities(organization_id, due_date)
  WHERE status = 'open';

-- Workflow executions: status + created for history page
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status_created
  ON workflow_executions(workflow_id, status, created_at DESC);

-- =====================================================
-- AUDIT LOG OPTIMIZATION
-- Composite index for common filter patterns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_user_action
  ON audit_logs(organization_id, user_id, action, created_at DESC);

-- Entity type filtering (common in admin UI)
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_entity
  ON audit_logs(organization_id, entity_type, created_at DESC);

-- =====================================================
-- EMAIL SEARCH OPTIMIZATION
-- Case-insensitive email lookups
-- =====================================================

-- Lower-case email index for case-insensitive searches
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email_lower
  ON crm_contacts(organization_id, LOWER(email));

CREATE INDEX IF NOT EXISTS idx_crm_leads_email_lower
  ON crm_leads(organization_id, LOWER(email));

-- =====================================================
-- NOTES
-- =====================================================
--
-- Full-text search on messages.content is NOT added here.
-- If message search performance becomes an issue, add:
--   CREATE INDEX idx_messages_content_fts
--     ON messages USING gin(to_tsvector('english', content));
--
-- Cursor-based pagination should be implemented in code
-- for large datasets (messages, audit_logs).
