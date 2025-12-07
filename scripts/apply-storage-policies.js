/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Apply Storage RLS Policies
 *
 * This script outputs the SQL needed to apply storage RLS policies.
 * Run this after running setup-storage.js
 *
 * Usage: node scripts/apply-storage-policies.js
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]

if (!projectRef) {
  console.error('❌ Could not extract project ref from URL')
  process.exit(1)
}

console.log('🔐 Storage RLS Policies\n')
console.log(`📦 Project: ${projectRef}\n`)
console.log('Please run this SQL in Supabase Dashboard > SQL Editor:')
console.log('')
console.log('='.repeat(60))
console.log(`
-- Allow public read access (files are served via public URLs)
CREATE POLICY "Public read access for client documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents');

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update client documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete client documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);
`)
console.log('='.repeat(60))
console.log('')
console.log('📝 Quick Steps:')
console.log(
  '   1. Go to: https://supabase.com/dashboard/project/' +
    projectRef +
    '/sql/new'
)
console.log('   2. Paste the SQL above')
console.log('   3. Click "Run"')
console.log('')
