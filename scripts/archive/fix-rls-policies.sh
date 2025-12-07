#!/bin/bash

echo "🔧 Fixing RLS policies..."
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "======================================================================"
cat supabase/migrations/20251207050000_fix_rls_policies.sql
echo "======================================================================"
echo ""
echo "After running the SQL, press any key to verify..."
read -n 1 -s

node scripts/verify-phase3.3.js
