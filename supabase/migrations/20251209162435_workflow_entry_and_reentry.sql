-- ============================================================================
-- Migration: Workflow Entry Criteria & Re-entry Rules
-- Segment who enters workflows and prevent duplicate executions
-- ============================================================================

-- ============================================================================
-- 1. ADD ENTRY CRITERIA COLUMN
-- ============================================================================

-- Entry criteria allows filtering which records trigger the workflow
-- Example: {"conditions": [{"field": "lifecycle_stage", "operator": "equals", "value": "lead"}]}
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS entry_criteria JSONB DEFAULT '{"conditions": [], "match_type": "all"}';

COMMENT ON COLUMN workflows.entry_criteria IS 'Filter conditions that records must match to enter workflow. match_type: all (AND) or any (OR)';

-- ============================================================================
-- 2. ADD RE-ENTRY RULES COLUMNS
-- ============================================================================

-- Control whether records can re-enter the same workflow
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS reentry_mode TEXT DEFAULT 'allow_all';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS reentry_wait_days INTEGER;

-- Add constraint for valid reentry modes
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflow_reentry_mode_check;
ALTER TABLE workflows ADD CONSTRAINT workflow_reentry_mode_check CHECK (
  reentry_mode IN ('allow_all', 'no_reentry', 'reentry_after_exit', 'reentry_after_days')
);

COMMENT ON COLUMN workflows.reentry_mode IS 'Controls re-entry: allow_all, no_reentry, reentry_after_exit, reentry_after_days';
COMMENT ON COLUMN workflows.reentry_wait_days IS 'Days to wait before allowing re-entry (only for reentry_after_days mode)';

-- ============================================================================
-- 3. UPDATE CHECK_WORKFLOW_TRIGGERS FUNCTION
-- ============================================================================

-- Add entry criteria and re-entry evaluation
CREATE OR REPLACE FUNCTION check_workflow_triggers()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  trigger_config JSONB;
  entry_criteria JSONB;
  should_execute BOOLEAN;
  passes_entry_criteria BOOLEAN;
  can_reenter BOOLEAN;
  old_value TEXT;
  new_value TEXT;
  target_field TEXT;
  last_execution RECORD;
  condition_record JSONB;
  condition_field TEXT;
  condition_operator TEXT;
  condition_value TEXT;
  actual_value TEXT;
  condition_passed BOOLEAN;
  all_conditions_passed BOOLEAN;
  any_condition_passed BOOLEAN;
  match_type TEXT;
BEGIN
  -- Loop through active workflows for this object type
  FOR workflow_record IN
    SELECT * FROM workflows
    WHERE is_active = true
      AND object_type = TG_ARGV[0]
    ORDER BY evaluation_order
  LOOP
    should_execute := false;
    passes_entry_criteria := true;
    can_reenter := true;
    trigger_config := workflow_record.trigger_config;
    entry_criteria := workflow_record.entry_criteria;

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

    -- If trigger matches, check entry criteria
    IF should_execute AND entry_criteria IS NOT NULL AND entry_criteria ? 'conditions' THEN
      -- Get match type (default to 'all' = AND logic)
      match_type := COALESCE(entry_criteria->>'match_type', 'all');
      all_conditions_passed := true;
      any_condition_passed := false;

      -- Evaluate each condition
      FOR condition_record IN SELECT * FROM jsonb_array_elements(entry_criteria->'conditions')
      LOOP
        condition_field := condition_record->>'field';
        condition_operator := condition_record->>'operator';
        condition_value := condition_record->>'value';

        -- Get actual value from record
        EXECUTE format('SELECT ($1).%I::TEXT', condition_field) INTO actual_value USING NEW;

        -- Evaluate condition
        condition_passed := false;
        CASE condition_operator
          WHEN 'equals' THEN
            condition_passed := (actual_value = condition_value);
          WHEN 'not_equals' THEN
            condition_passed := (actual_value != condition_value OR actual_value IS NULL);
          WHEN 'contains' THEN
            condition_passed := (actual_value ILIKE '%' || condition_value || '%');
          WHEN 'not_contains' THEN
            condition_passed := (actual_value NOT ILIKE '%' || condition_value || '%' OR actual_value IS NULL);
          WHEN 'starts_with' THEN
            condition_passed := (actual_value ILIKE condition_value || '%');
          WHEN 'ends_with' THEN
            condition_passed := (actual_value ILIKE '%' || condition_value);
          WHEN 'is_empty' THEN
            condition_passed := (actual_value IS NULL OR actual_value = '');
          WHEN 'is_not_empty' THEN
            condition_passed := (actual_value IS NOT NULL AND actual_value != '');
          WHEN 'greater_than' THEN
            condition_passed := (actual_value::NUMERIC > condition_value::NUMERIC);
          WHEN 'less_than' THEN
            condition_passed := (actual_value::NUMERIC < condition_value::NUMERIC);
          WHEN 'in_list' THEN
            condition_passed := (actual_value = ANY(string_to_array(condition_value, ',')));
          WHEN 'not_in_list' THEN
            condition_passed := (actual_value != ALL(string_to_array(condition_value, ',')));
          ELSE
            condition_passed := true; -- Unknown operator, pass by default
        END CASE;

        -- Track results
        IF condition_passed THEN
          any_condition_passed := true;
        ELSE
          all_conditions_passed := false;
        END IF;
      END LOOP;

      -- Determine if entry criteria passed based on match type
      IF match_type = 'all' THEN
        passes_entry_criteria := all_conditions_passed;
      ELSE -- 'any'
        passes_entry_criteria := any_condition_passed;
      END IF;
    END IF;

    -- Check re-entry rules
    IF should_execute AND passes_entry_criteria AND workflow_record.reentry_mode != 'allow_all' THEN
      -- Find last execution for this record
      SELECT * INTO last_execution
      FROM workflow_executions
      WHERE workflow_id = workflow_record.id
        AND record_id = NEW.id
      ORDER BY started_at DESC
      LIMIT 1;

      IF last_execution IS NOT NULL THEN
        CASE workflow_record.reentry_mode
          WHEN 'no_reentry' THEN
            -- Never allow re-entry
            can_reenter := false;

          WHEN 'reentry_after_exit' THEN
            -- Only allow if last execution completed or failed
            can_reenter := (last_execution.status IN ('completed', 'failed', 'cancelled'));

          WHEN 'reentry_after_days' THEN
            -- Only allow if enough days have passed since last execution
            can_reenter := (
              last_execution.started_at < NOW() - (workflow_record.reentry_wait_days || ' days')::INTERVAL
            );
        END CASE;
      END IF;
    END IF;

    -- Create execution record if all conditions are met
    IF should_execute AND passes_entry_criteria AND can_reenter THEN
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
          'record_data', to_jsonb(NEW),
          'entry_criteria_matched', passes_entry_criteria
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
-- MIGRATION COMPLETE
-- ============================================================================
