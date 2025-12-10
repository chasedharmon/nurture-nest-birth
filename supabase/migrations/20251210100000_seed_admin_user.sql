-- ============================================================================
-- Migration: Seed Admin User
-- Ensures chase.d.harmon@gmail.com always has admin role with full permissions
-- ============================================================================

-- This migration ensures that when the user chase.d.harmon@gmail.com exists,
-- they are set up with admin role in team_members table.
-- Note: The actual auth.users record is created when they sign up via Supabase Auth.

-- Create a function to set up admin user when they sign up or if they already exist
CREATE OR REPLACE FUNCTION setup_admin_user_chase_harmon()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_team_member_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- Get the user ID for chase.d.harmon@gmail.com from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'chase.d.harmon@gmail.com';

  -- If user doesn't exist yet, nothing to do
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get admin role ID
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE name = 'admin';

  -- Update or insert into users table
  INSERT INTO users (id, email, full_name, role, role_id, is_active)
  VALUES (
    v_user_id,
    'chase.d.harmon@gmail.com',
    'Chase Harmon',
    'admin',
    v_admin_role_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    role_id = v_admin_role_id,
    is_active = true;

  -- Update or insert into team_members table
  SELECT id INTO v_team_member_id
  FROM team_members
  WHERE user_id = v_user_id;

  IF v_team_member_id IS NULL THEN
    -- Create team member record
    INSERT INTO team_members (
      user_id,
      role,
      display_name,
      email,
      is_active,
      is_accepting_clients
    ) VALUES (
      v_user_id,
      'admin',
      'Chase Harmon',
      'chase.d.harmon@gmail.com',
      true,
      true
    );
  ELSE
    -- Update existing team member to admin
    UPDATE team_members
    SET role = 'admin',
        is_active = true
    WHERE id = v_team_member_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the setup function immediately
SELECT setup_admin_user_chase_harmon();

-- Create a trigger to automatically set up admin role when this user signs up
CREATE OR REPLACE FUNCTION handle_admin_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin user
  IF NEW.email = 'chase.d.harmon@gmail.com' THEN
    -- Schedule the admin setup (use a slight delay to ensure user record is committed)
    PERFORM setup_admin_user_chase_harmon();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_admin_user_signup ON auth.users;
CREATE TRIGGER on_admin_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_user_signup();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION setup_admin_user_chase_harmon() IS 'Sets up chase.d.harmon@gmail.com as admin with full permissions';
COMMENT ON FUNCTION handle_admin_user_signup() IS 'Trigger function to auto-setup admin when specific user signs up';
