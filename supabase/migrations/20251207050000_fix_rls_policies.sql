-- Fix RLS Policies for Phase 3.3 Tables
-- This migration fixes the infinite recursion issue in RLS policies

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to client services" ON client_services;
DROP POLICY IF EXISTS "Clients can view own services" ON client_services;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON client_services;
DROP POLICY IF EXISTS "Admin full access to meetings" ON meetings;
DROP POLICY IF EXISTS "Clients can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON meetings;
DROP POLICY IF EXISTS "Admin full access to documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can view visible documents" ON client_documents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON client_documents;
DROP POLICY IF EXISTS "Admin full access to payments" ON payments;
DROP POLICY IF EXISTS "Clients can view own payments" ON payments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payments;

-- ============================================================================
-- CREATE SIMPLIFIED RLS POLICIES
-- ============================================================================

-- CLIENT SERVICES POLICIES
CREATE POLICY "Enable all access for authenticated users"
  ON client_services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MEETINGS POLICIES
CREATE POLICY "Enable all access for authenticated users"
  ON meetings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CLIENT DOCUMENTS POLICIES
CREATE POLICY "Enable all access for authenticated users"
  ON client_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PAYMENTS POLICIES
CREATE POLICY "Enable all access for authenticated users"
  ON payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Enable all access for authenticated users" ON client_services IS
  'Allow all authenticated users (admin) to manage client services. Client portal uses service role key.';

COMMENT ON POLICY "Enable all access for authenticated users" ON meetings IS
  'Allow all authenticated users (admin) to manage meetings. Client portal uses service role key.';

COMMENT ON POLICY "Enable all access for authenticated users" ON client_documents IS
  'Allow all authenticated users (admin) to manage documents. Client portal uses service role key.';

COMMENT ON POLICY "Enable all access for authenticated users" ON payments IS
  'Allow all authenticated users (admin) to manage payments. Client portal uses service role key.';
