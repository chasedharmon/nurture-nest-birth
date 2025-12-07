-- Storage RLS Policies for client-documents bucket
-- Run this in Supabase Dashboard > SQL Editor
--
-- These policies control who can read, upload, update, and delete files
-- in the client-documents storage bucket.

-- Allow public read access (files are served via public URLs)
-- This is needed because the bucket is public and documents are accessed via URL
CREATE POLICY "Public read access for client documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents');

-- Allow authenticated users (admins) to upload files
-- Admins can upload any type of document for any client
CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
-- Admins can update/replace files they have access to
CREATE POLICY "Authenticated users can update client documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
-- Admins can delete files when removing documents
CREATE POLICY "Authenticated users can delete client documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);
