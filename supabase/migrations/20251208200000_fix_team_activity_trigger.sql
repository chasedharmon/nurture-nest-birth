-- =====================================================
-- Fix Team Assignment Activity Trigger
-- Corrects the column name from 'description' to 'content'
-- Adds 'team_assigned' to activity_type enum
-- =====================================================

-- Add team_assigned to the activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'team_assigned';

-- Re-create the function with the correct column name
CREATE OR REPLACE FUNCTION log_client_assignment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_member_name TEXT;
BEGIN
  SELECT name INTO v_client_name FROM leads WHERE id = NEW.client_id;
  SELECT display_name INTO v_member_name FROM team_members WHERE id = NEW.team_member_id;

  INSERT INTO lead_activities (lead_id, activity_type, content, created_by_user_id)
  VALUES (
    NEW.client_id,
    'team_assigned',
    format('%s assigned as %s provider', v_member_name, NEW.assignment_role),
    (SELECT user_id FROM team_members WHERE id = NEW.assigned_by)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
