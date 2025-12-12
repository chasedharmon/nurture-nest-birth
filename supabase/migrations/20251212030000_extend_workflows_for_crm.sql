-- =====================================================
-- PHASE 10: EXTEND WORKFLOWS FOR CRM INTEGRATION
-- =====================================================
-- This migration adds support for CRM objects in workflows and
-- links activities to workflow executions.
-- =====================================================

-- Add CRM object types to the workflow object type enum
DO $$
BEGIN
  -- Add new values to the enum if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'workflow_object_type'::regtype
    AND enumlabel = 'contact'
  ) THEN
    ALTER TYPE workflow_object_type ADD VALUE IF NOT EXISTS 'contact';
    ALTER TYPE workflow_object_type ADD VALUE IF NOT EXISTS 'account';
    ALTER TYPE workflow_object_type ADD VALUE IF NOT EXISTS 'opportunity';
    ALTER TYPE workflow_object_type ADD VALUE IF NOT EXISTS 'activity';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- Enum doesn't exist or column uses text type instead
    NULL;
END $$;

-- Add workflow execution tracking columns to crm_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_activities' AND column_name = 'created_by_workflow'
  ) THEN
    ALTER TABLE crm_activities ADD COLUMN created_by_workflow BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_activities' AND column_name = 'workflow_execution_id'
  ) THEN
    ALTER TABLE crm_activities ADD COLUMN workflow_execution_id UUID;
  END IF;
END $$;

-- Add foreign key for workflow execution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'crm_activities_workflow_execution_fkey'
  ) THEN
    ALTER TABLE crm_activities
    ADD CONSTRAINT crm_activities_workflow_execution_fkey
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id)
    ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- workflow_executions table doesn't exist yet
    NULL;
END $$;

-- Create index for workflow-created activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_workflow_created
  ON crm_activities(created_by_workflow)
  WHERE created_by_workflow = true;

-- Add record_type column to workflow_executions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_executions' AND column_name = 'record_type'
  ) THEN
    ALTER TABLE workflow_executions ADD COLUMN record_type TEXT;
  END IF;
END $$;

-- Create function to increment workflow execution count
CREATE OR REPLACE FUNCTION increment_workflow_execution_count(workflow_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE workflows
  SET
    execution_count = COALESCE(execution_count, 0) + 1,
    last_executed_at = NOW()
  WHERE id = workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN crm_activities.created_by_workflow IS
'True if this activity was automatically created by a workflow';

COMMENT ON COLUMN crm_activities.workflow_execution_id IS
'Links to the workflow execution that created this activity';

COMMENT ON FUNCTION increment_workflow_execution_count IS
'Atomically increment the execution count and update last_executed_at for a workflow';
