-- Phase 3.1 Database Verification Script

-- Check if new tables exist
SELECT 
  'client_services' as table_name,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'client_services') as exists
UNION ALL
SELECT 
  'meetings',
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'meetings')
UNION ALL
SELECT 
  'client_documents',
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'client_documents')
UNION ALL
SELECT 
  'payments',
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'payments');

-- Check new columns on leads table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN (
    'partner_name', 
    'address', 
    'birth_preferences', 
    'medical_info', 
    'emergency_contact',
    'expected_due_date',
    'actual_birth_date',
    'client_type',
    'tags',
    'lifecycle_stage'
  )
ORDER BY column_name;

-- Check new columns on lead_activities table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lead_activities'
  AND column_name IN (
    'activity_category',
    'related_record_type',
    'related_record_id',
    'created_by',
    'is_pinned',
    'is_client_visible'
  )
ORDER BY column_name;

-- Check constraints on leads table
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
  AND conname IN ('client_type_check', 'lifecycle_stage_check');

-- Check constraints on lead_activities table
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'lead_activities'::regclass
  AND conname IN ('activity_category_check', 'related_record_type_check');

-- Check indexes
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('leads', 'lead_activities', 'client_services', 'meetings', 'client_documents', 'payments')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('client_services', 'meetings', 'client_documents', 'payments')
ORDER BY event_object_table, trigger_name;

-- Row counts
SELECT 'leads' as table_name, COUNT(*) as row_count FROM leads
UNION ALL
SELECT 'client_services', COUNT(*) FROM client_services
UNION ALL
SELECT 'meetings', COUNT(*) FROM meetings
UNION ALL
SELECT 'client_documents', COUNT(*) FROM client_documents
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
