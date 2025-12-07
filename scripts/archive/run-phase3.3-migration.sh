#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Run the migration
psql "$DATABASE_URL" < supabase/migrations/20251207040000_client_management.sql

echo "Migration completed!"
