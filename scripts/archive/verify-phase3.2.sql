-- Phase 3.2 Verification Script
-- Run this in Supabase SQL Editor to verify Phase 3.2 migration

-- Check if client_auth_tokens table exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'client_auth_tokens'
    )
    THEN '✅ client_auth_tokens table EXISTS'
    ELSE '❌ client_auth_tokens table MISSING - Run Phase 3.2 migration!'
  END AS client_auth_tokens_status;

-- Check if leads table has new columns
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'email_verified'
    )
    THEN '✅ leads.email_verified column EXISTS'
    ELSE '❌ leads.email_verified column MISSING'
  END AS email_verified_status;

SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'last_login_at'
    )
    THEN '✅ leads.last_login_at column EXISTS'
    ELSE '❌ leads.last_login_at column MISSING'
  END AS last_login_at_status;

-- Check RLS policies for client access
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('leads', 'client_services', 'meetings', 'client_documents', 'payments', 'lead_activities')
AND policyname LIKE '%Clients can%'
ORDER BY tablename, policyname;

-- Count any existing tokens
SELECT
  COUNT(*) as token_count,
  COUNT(CASE WHEN used = false THEN 1 END) as unused_tokens,
  COUNT(CASE WHEN used = true THEN 1 END) as used_tokens
FROM client_auth_tokens;
