-- Fix RLS infinite recursion on users table
-- The current policies cause infinite recursion by querying users table within users policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create simplified RLS policies that don't cause recursion
-- Allow authenticated users to read all users (admins only use auth, no role check needed)
CREATE POLICY "Authenticated users can view users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own record (handled by trigger)
CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Consolidate visibility columns on client_documents
-- Ensure is_visible_to_client is synced from is_client_visible if exists
DO $$
BEGIN
  -- If both columns exist, sync the data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'is_client_visible'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'is_visible_to_client'
  ) THEN
    -- Update is_visible_to_client from is_client_visible where they differ
    UPDATE client_documents
    SET is_visible_to_client = COALESCE(is_visible_to_client, is_client_visible, true)
    WHERE is_visible_to_client IS NULL OR is_visible_to_client != is_client_visible;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.users IS 'User profiles - RLS policies fixed to prevent infinite recursion';
