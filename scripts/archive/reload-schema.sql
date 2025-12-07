-- Manually reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify all Phase 3 tables exist
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('client_services', 'meetings', 'client_documents', 'payments')
ORDER BY table_name;
