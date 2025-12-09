-- ============================================================================
-- Migration: Workflow Automation Engine
-- Visual canvas builder for multi-step automations (SaaS differentiator)
-- ============================================================================

-- ============================================================================
-- 1. WORKFLOW DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Workflow metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Object this workflow operates on
  object_type TEXT NOT NULL,

  -- Trigger configuration
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',

  -- Workflow status
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,

  -- Evaluation order (for multiple workflows on same trigger)
  evaluation_order INTEGER DEFAULT 0,

  -- Canvas layout data (positions of nodes in visual builder)
  canvas_data JSONB DEFAULT '{}',

  -- Stats
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT workflow_object_type_check CHECK (
    object_type IN ('lead', 'meeting', 'payment', 'invoice', 'service', 'document', 'contract', 'intake_form')
  ),
  CONSTRAINT workflow_trigger_type_check CHECK (
    trigger_type IN ('record_create', 'record_update', 'field_change', 'scheduled', 'manual', 'form_submit', 'payment_received')
  )
);

COMMENT ON TABLE workflows IS 'Workflow automation definitions with visual canvas builder support';

-- ============================================================================
-- 2. WORKFLOW STEPS (Nodes in the canvas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Step identification
  step_order INTEGER NOT NULL,
  step_key TEXT NOT NULL, -- Unique key within workflow for canvas references

  -- Step type and configuration
  step_type TEXT NOT NULL,
  step_config JSONB NOT NULL DEFAULT '{}',

  -- Conditional execution
  condition JSONB, -- Optional: only run if condition met

  -- Canvas positioning (for visual builder)
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,

  -- For decision nodes: branch configuration
  branches JSONB, -- [{condition: {...}, next_step_key: 'step_2'}]

  -- Default next step (for linear flows)
  next_step_key TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT workflow_step_type_check CHECK (
    step_type IN (
      'trigger',      -- Entry point
      'send_email',   -- Send templated email
      'send_sms',     -- Send SMS (future)
      'create_task',  -- Create action item
      'update_field', -- Update record field
      'create_record',-- Create related record
      'wait',         -- Pause workflow
      'decision',     -- Branch logic
      'send_message', -- In-app message
      'webhook',      -- Call external webhook (future)
      'end'           -- Explicit end node
    )
  ),
  UNIQUE(workflow_id, step_key)
);

COMMENT ON TABLE workflow_steps IS 'Individual steps/nodes within a workflow, supporting visual canvas layout';

-- ============================================================================
-- 3. WORKFLOW EXECUTIONS (Audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Record that triggered the workflow
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,

  -- Execution state
  status TEXT DEFAULT 'running',
  current_step_key TEXT,

  -- Context passed between steps
  context JSONB DEFAULT '{}',

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- For wait steps
  next_run_at TIMESTAMPTZ,
  waiting_for TEXT, -- Description of what we're waiting for

  -- Constraints
  CONSTRAINT execution_status_check CHECK (
    status IN ('running', 'completed', 'failed', 'waiting', 'cancelled')
  )
);

COMMENT ON TABLE workflow_executions IS 'Tracks workflow execution instances with full audit trail';

-- ============================================================================
-- 4. WORKFLOW STEP EXECUTIONS (Detailed step audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,

  -- Step execution state
  status TEXT NOT NULL,

  -- Input/output for debugging
  input JSONB,
  output JSONB,

  -- Error details
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT step_execution_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'skipped')
  )
);

COMMENT ON TABLE workflow_step_executions IS 'Detailed execution log for each step within a workflow run';

-- ============================================================================
-- 5. WORKFLOW TEMPLATES (Pre-built automations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Icon for UI
  icon TEXT DEFAULT 'workflow',

  -- Template data (full workflow + steps config)
  template_data JSONB NOT NULL,

  -- Targeting
  object_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT template_category_check CHECK (
    category IN ('onboarding', 'reminders', 'follow_up', 'notifications', 'billing', 'custom')
  ),
  CONSTRAINT template_object_type_check CHECK (
    object_type IN ('lead', 'meeting', 'payment', 'invoice', 'service', 'document', 'contract', 'intake_form')
  ),
  CONSTRAINT template_trigger_type_check CHECK (
    trigger_type IN ('record_create', 'record_update', 'field_change', 'scheduled', 'manual', 'form_submit', 'payment_received')
  )
);

COMMENT ON TABLE workflow_templates IS 'Pre-built workflow templates for common doula business automations';

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Workflows
CREATE INDEX IF NOT EXISTS idx_workflows_object_type ON workflows(object_type);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);

-- Workflow steps
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_type ON workflow_steps(step_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_order ON workflow_steps(workflow_id, step_order);

-- Workflow executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_record ON workflow_executions(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_next_run ON workflow_executions(next_run_at) WHERE status = 'waiting';

-- Step executions
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution_id ON workflow_step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_step_id ON workflow_step_executions(step_id);

-- Templates
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_object_type ON workflow_templates(object_type);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================

-- Workflows: Authenticated users can manage all workflows
CREATE POLICY "Authenticated users can manage workflows"
  ON workflows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workflow steps: Authenticated users can manage
CREATE POLICY "Authenticated users can manage workflow_steps"
  ON workflow_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workflow executions: Authenticated users can view
CREATE POLICY "Authenticated users can manage workflow_executions"
  ON workflow_executions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step executions: Authenticated users can view
CREATE POLICY "Authenticated users can manage workflow_step_executions"
  ON workflow_step_executions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Templates: Everyone can read, authenticated can manage
CREATE POLICY "Authenticated users can manage workflow_templates"
  ON workflow_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. WORKFLOW EXECUTION TRIGGER FUNCTION
-- ============================================================================

-- Function to find and execute matching workflows when records change
CREATE OR REPLACE FUNCTION check_workflow_triggers()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  trigger_config JSONB;
  should_execute BOOLEAN;
  old_value TEXT;
  new_value TEXT;
  target_field TEXT;
BEGIN
  -- Loop through active workflows for this object type
  FOR workflow_record IN
    SELECT * FROM workflows
    WHERE is_active = true
      AND object_type = TG_ARGV[0]
    ORDER BY evaluation_order
  LOOP
    should_execute := false;
    trigger_config := workflow_record.trigger_config;

    -- Check trigger type
    CASE workflow_record.trigger_type
      WHEN 'record_create' THEN
        IF TG_OP = 'INSERT' THEN
          should_execute := true;
        END IF;

      WHEN 'record_update' THEN
        IF TG_OP = 'UPDATE' THEN
          should_execute := true;
        END IF;

      WHEN 'field_change' THEN
        IF TG_OP = 'UPDATE' AND trigger_config ? 'field' THEN
          target_field := trigger_config->>'field';

          -- Get old and new values dynamically
          EXECUTE format('SELECT ($1).%I::TEXT', target_field) INTO old_value USING OLD;
          EXECUTE format('SELECT ($1).%I::TEXT', target_field) INTO new_value USING NEW;

          -- Check if field changed
          IF old_value IS DISTINCT FROM new_value THEN
            -- Check if specific value transitions are required
            IF trigger_config ? 'from_value' THEN
              IF old_value = trigger_config->>'from_value' AND
                 (NOT trigger_config ? 'to_value' OR new_value = trigger_config->>'to_value') THEN
                should_execute := true;
              END IF;
            ELSIF trigger_config ? 'to_value' THEN
              IF new_value = trigger_config->>'to_value' THEN
                should_execute := true;
              END IF;
            ELSE
              should_execute := true;
            END IF;
          END IF;
        END IF;

      ELSE
        -- Other trigger types handled by cron or manual invocation
        NULL;
    END CASE;

    -- Create execution record if workflow should run
    IF should_execute THEN
      INSERT INTO workflow_executions (
        workflow_id,
        record_type,
        record_id,
        status,
        context
      ) VALUES (
        workflow_record.id,
        TG_ARGV[0],
        NEW.id,
        'running',
        jsonb_build_object(
          'trigger_type', workflow_record.trigger_type,
          'triggered_at', NOW(),
          'record_data', to_jsonb(NEW)
        )
      );

      -- Update workflow stats
      UPDATE workflows
      SET execution_count = execution_count + 1,
          last_executed_at = NOW()
      WHERE id = workflow_record.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. CREATE WORKFLOW TRIGGERS ON KEY TABLES
-- ============================================================================

-- Lead workflow triggers
DROP TRIGGER IF EXISTS lead_workflow_trigger ON leads;
CREATE TRIGGER lead_workflow_trigger
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION check_workflow_triggers('lead');

-- Payment workflow triggers
DROP TRIGGER IF EXISTS payment_workflow_trigger ON payments;
CREATE TRIGGER payment_workflow_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION check_workflow_triggers('payment');

-- Meeting workflow triggers
DROP TRIGGER IF EXISTS meeting_workflow_trigger ON meetings;
CREATE TRIGGER meeting_workflow_trigger
  AFTER INSERT OR UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION check_workflow_triggers('meeting');

-- Invoice workflow triggers
DROP TRIGGER IF EXISTS invoice_workflow_trigger ON invoices;
CREATE TRIGGER invoice_workflow_trigger
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_workflow_triggers('invoice');

-- Contract signature workflow triggers
DROP TRIGGER IF EXISTS contract_workflow_trigger ON contract_signatures;
CREATE TRIGGER contract_workflow_trigger
  AFTER INSERT OR UPDATE ON contract_signatures
  FOR EACH ROW
  EXECUTE FUNCTION check_workflow_triggers('contract');

-- Intake form workflow triggers
DROP TRIGGER IF EXISTS intake_workflow_trigger ON intake_form_submissions;
CREATE TRIGGER intake_workflow_trigger
  AFTER INSERT OR UPDATE ON intake_form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION check_workflow_triggers('intake_form');

-- ============================================================================
-- 12. INSERT DEFAULT WORKFLOW TEMPLATES
-- ============================================================================

INSERT INTO workflow_templates (name, description, category, icon, object_type, trigger_type, template_data)
VALUES
  (
    'New Lead Welcome Email',
    'Automatically send a welcome email when a new lead is created',
    'onboarding',
    'mail',
    'lead',
    'record_create',
    '{
      "workflow": {
        "name": "New Lead Welcome Email",
        "description": "Send welcome email to new inquiries"
      },
      "steps": [
        {
          "step_key": "trigger",
          "step_type": "trigger",
          "step_order": 1,
          "position_x": 250,
          "position_y": 50,
          "next_step_key": "send_welcome"
        },
        {
          "step_key": "send_welcome",
          "step_type": "send_email",
          "step_order": 2,
          "position_x": 250,
          "position_y": 200,
          "step_config": {
            "template_name": "New Inquiry Response",
            "to_field": "email",
            "subject": "Thank you for reaching out!"
          },
          "next_step_key": "end"
        },
        {
          "step_key": "end",
          "step_type": "end",
          "step_order": 3,
          "position_x": 250,
          "position_y": 350
        }
      ]
    }'::jsonb
  ),
  (
    'Client Onboarding Sequence',
    'Create onboarding tasks when lead becomes an active client',
    'onboarding',
    'users',
    'lead',
    'field_change',
    '{
      "workflow": {
        "name": "Client Onboarding Sequence",
        "description": "Trigger onboarding tasks when status changes to client"
      },
      "trigger_config": {
        "field": "status",
        "to_value": "client"
      },
      "steps": [
        {
          "step_key": "trigger",
          "step_type": "trigger",
          "step_order": 1,
          "position_x": 250,
          "position_y": 50,
          "next_step_key": "create_tasks"
        },
        {
          "step_key": "create_tasks",
          "step_type": "create_task",
          "step_order": 2,
          "position_x": 250,
          "position_y": 200,
          "step_config": {
            "tasks": [
              {"title": "Complete intake form", "action_type": "intake_form"},
              {"title": "Sign service contract", "action_type": "sign_contract"},
              {"title": "Schedule first consultation", "action_type": "schedule_meeting"}
            ]
          },
          "next_step_key": "send_welcome"
        },
        {
          "step_key": "send_welcome",
          "step_type": "send_email",
          "step_order": 3,
          "position_x": 250,
          "position_y": 350,
          "step_config": {
            "template_name": "Welcome New Client",
            "to_field": "email"
          },
          "next_step_key": "end"
        },
        {
          "step_key": "end",
          "step_type": "end",
          "step_order": 4,
          "position_x": 250,
          "position_y": 500
        }
      ]
    }'::jsonb
  ),
  (
    'Payment Reminder Sequence',
    'Send reminder emails when payment is overdue',
    'billing',
    'credit-card',
    'invoice',
    'field_change',
    '{
      "workflow": {
        "name": "Payment Reminder Sequence",
        "description": "Send reminders for overdue invoices"
      },
      "trigger_config": {
        "field": "status",
        "to_value": "overdue"
      },
      "steps": [
        {
          "step_key": "trigger",
          "step_type": "trigger",
          "step_order": 1,
          "position_x": 250,
          "position_y": 50,
          "next_step_key": "first_reminder"
        },
        {
          "step_key": "first_reminder",
          "step_type": "send_email",
          "step_order": 2,
          "position_x": 250,
          "position_y": 200,
          "step_config": {
            "template_name": "Payment Reminder",
            "to_field": "client_email"
          },
          "next_step_key": "wait_3_days"
        },
        {
          "step_key": "wait_3_days",
          "step_type": "wait",
          "step_order": 3,
          "position_x": 250,
          "position_y": 350,
          "step_config": {
            "wait_days": 3
          },
          "next_step_key": "check_paid"
        },
        {
          "step_key": "check_paid",
          "step_type": "decision",
          "step_order": 4,
          "position_x": 250,
          "position_y": 500,
          "step_config": {
            "condition_field": "status",
            "condition_operator": "equals",
            "condition_value": "paid"
          },
          "branches": [
            {"condition": "true", "next_step_key": "end"},
            {"condition": "false", "next_step_key": "second_reminder"}
          ]
        },
        {
          "step_key": "second_reminder",
          "step_type": "send_email",
          "step_order": 5,
          "position_x": 450,
          "position_y": 650,
          "step_config": {
            "template_name": "Payment Reminder - Second Notice",
            "to_field": "client_email"
          },
          "next_step_key": "end"
        },
        {
          "step_key": "end",
          "step_type": "end",
          "step_order": 6,
          "position_x": 250,
          "position_y": 800
        }
      ]
    }'::jsonb
  ),
  (
    'Meeting Follow-Up',
    'Send thank you email after a meeting is completed',
    'follow_up',
    'calendar',
    'meeting',
    'field_change',
    '{
      "workflow": {
        "name": "Meeting Follow-Up",
        "description": "Send follow-up email after meetings"
      },
      "trigger_config": {
        "field": "status",
        "to_value": "completed"
      },
      "steps": [
        {
          "step_key": "trigger",
          "step_type": "trigger",
          "step_order": 1,
          "position_x": 250,
          "position_y": 50,
          "next_step_key": "check_type"
        },
        {
          "step_key": "check_type",
          "step_type": "decision",
          "step_order": 2,
          "position_x": 250,
          "position_y": 200,
          "step_config": {
            "condition_field": "meeting_type",
            "condition_operator": "equals",
            "condition_value": "consultation"
          },
          "branches": [
            {"condition": "true", "next_step_key": "consultation_followup"},
            {"condition": "false", "next_step_key": "general_followup"}
          ]
        },
        {
          "step_key": "consultation_followup",
          "step_type": "send_email",
          "step_order": 3,
          "position_x": 100,
          "position_y": 350,
          "step_config": {
            "template_name": "Consultation Follow-Up",
            "to_field": "client_email"
          },
          "next_step_key": "end"
        },
        {
          "step_key": "general_followup",
          "step_type": "send_email",
          "step_order": 4,
          "position_x": 400,
          "position_y": 350,
          "step_config": {
            "template_name": "Meeting Follow-Up",
            "to_field": "client_email"
          },
          "next_step_key": "end"
        },
        {
          "step_key": "end",
          "step_type": "end",
          "step_order": 5,
          "position_x": 250,
          "position_y": 500
        }
      ]
    }'::jsonb
  ),
  (
    'Contract Signed Notification',
    'Notify doula and log activity when contract is signed',
    'notifications',
    'file-signature',
    'contract',
    'record_create',
    '{
      "workflow": {
        "name": "Contract Signed Notification",
        "description": "Notify when a contract is signed"
      },
      "steps": [
        {
          "step_key": "trigger",
          "step_type": "trigger",
          "step_order": 1,
          "position_x": 250,
          "position_y": 50,
          "next_step_key": "notify_admin"
        },
        {
          "step_key": "notify_admin",
          "step_type": "send_email",
          "step_order": 2,
          "position_x": 250,
          "position_y": 200,
          "step_config": {
            "template_name": "Contract Signed - Admin Notification",
            "to_type": "admin"
          },
          "next_step_key": "send_confirmation"
        },
        {
          "step_key": "send_confirmation",
          "step_type": "send_email",
          "step_order": 3,
          "position_x": 250,
          "position_y": 350,
          "step_config": {
            "template_name": "Contract Confirmation",
            "to_field": "signer_email"
          },
          "next_step_key": "end"
        },
        {
          "step_key": "end",
          "step_type": "end",
          "step_order": 4,
          "position_x": 250,
          "position_y": 500
        }
      ]
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
