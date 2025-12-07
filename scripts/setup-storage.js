/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Supabase Storage Bucket Setup Script
 *
 * This script creates the necessary storage bucket and policies for file uploads.
 * Run this once during initial setup or when setting up a new environment.
 *
 * Usage: node scripts/setup-storage.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error(
    '   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const BUCKET_NAME = 'client-documents'

async function setupStorage() {
  console.log('🗄️  Setting up Supabase Storage...\n')

  try {
    // 1. Check if bucket exists
    console.log(`📦 Checking for bucket: ${BUCKET_NAME}`)
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      process.exit(1)
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists`)
    } else {
      // 2. Create the bucket
      console.log(`📝 Creating bucket: ${BUCKET_NAME}`)
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: true, // Files are publicly accessible via URL
          allowedMimeTypes: [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            // Images
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
          ],
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        }
      )

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message)
        process.exit(1)
      }

      console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`)
    }

    // 3. Display bucket info
    console.log('\n📋 Bucket Configuration:')
    console.log(`   - Name: ${BUCKET_NAME}`)
    console.log('   - Public: Yes (files accessible via URL)')
    console.log('   - Max file size: 10MB')
    console.log('   - Allowed types: PDF, DOC, DOCX, TXT, JPEG, PNG, WebP, GIF')

    // 4. Provide SQL for RLS policies
    console.log('\n🔐 Storage Policies')
    console.log(
      '   The following policies should be added via Supabase Dashboard or SQL:'
    )
    console.log('\n   -- Allow authenticated users (admins) to upload files')
    console.log(`   -- Go to Storage > Policies in Supabase Dashboard`)
    console.log('\n   Recommended policies:')
    console.log(
      '   1. SELECT (Read): Allow anyone to read files (public bucket)'
    )
    console.log('   2. INSERT (Upload): Allow authenticated users to upload')
    console.log(
      '   3. UPDATE: Allow authenticated users to update their uploads'
    )
    console.log('   4. DELETE: Allow authenticated users to delete files')

    console.log('\n✅ Storage setup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Go to Supabase Dashboard > Storage')
    console.log(`   2. Click on the "${BUCKET_NAME}" bucket`)
    console.log('   3. Go to "Policies" tab')
    console.log('   4. Add the recommended RLS policies')
    console.log('   5. Test file uploads in the admin dashboard')
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

// SQL for RLS policies (for reference)
const RLS_POLICIES_SQL = `
-- Storage RLS policies for client-documents bucket
-- Run these in Supabase SQL Editor

-- Allow public read access (files are served via public URLs)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents');

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files they uploaded
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);
`

console.log('\n📄 SQL for RLS Policies (save for reference):')
console.log('='.repeat(60))
console.log(RLS_POLICIES_SQL)
console.log('='.repeat(60))

setupStorage()
