-- Webhooks table for outbound event notifications
-- This allows organizations to receive real-time notifications when events occur

-- Create webhook event types enum
CREATE TYPE webhook_event_type AS ENUM (
  'lead.created',
  'lead.updated',
  'lead.status_changed',
  'lead.converted',
  'client.created',
  'client.updated',
  'appointment.scheduled',
  'appointment.cancelled',
  'appointment.completed',
  'document.uploaded',
  'document.signed',
  'invoice.created',
  'invoice.paid',
  'invoice.overdue',
  'contract.sent',
  'contract.signed',
  'message.received'
);

-- Create webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Webhook configuration
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,

  -- Security
  secret VARCHAR(255) NOT NULL, -- Used to sign webhook payloads

  -- Events to trigger this webhook
  events webhook_event_type[] NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Configuration options
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,

  -- Headers to include (stored as JSONB)
  custom_headers JSONB DEFAULT '{}',

  -- Stats
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  successful_deliveries INTEGER NOT NULL DEFAULT 0,
  failed_deliveries INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create webhook delivery log table
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Event details
  event_type webhook_event_type NOT NULL,
  event_id UUID, -- Reference to the entity that triggered the event

  -- Request details
  request_url TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,

  -- Response details
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,

  -- Delivery status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, success, failed, retrying
  attempt_count INTEGER NOT NULL DEFAULT 0,

  -- Timing
  duration_ms INTEGER,

  -- Error details
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_webhooks_organization ON webhooks(organization_id);
CREATE INDEX idx_webhooks_active ON webhooks(organization_id, is_active);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(webhook_id, status);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- Add RLS policies
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Webhooks policies
CREATE POLICY "Users can view webhooks in their organization"
  ON webhooks FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can create webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = get_user_organization_id()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update webhooks"
  ON webhooks FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = get_user_organization_id()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete webhooks"
  ON webhooks FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = get_user_organization_id()
      AND role IN ('owner', 'admin')
    )
  );

-- Webhook deliveries policies
CREATE POLICY "Users can view webhook deliveries in their organization"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
      AND w.organization_id = get_user_organization_id()
    )
  );

-- Function to update webhook stats after delivery
CREATE OR REPLACE FUNCTION update_webhook_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE webhooks
    SET
      total_deliveries = total_deliveries + 1,
      successful_deliveries = successful_deliveries + 1,
      last_triggered_at = NEW.created_at,
      last_success_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.webhook_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE webhooks
    SET
      total_deliveries = total_deliveries + 1,
      failed_deliveries = failed_deliveries + 1,
      last_triggered_at = NEW.created_at,
      last_failure_at = NEW.completed_at,
      last_failure_reason = NEW.error_message,
      updated_at = NOW()
    WHERE id = NEW.webhook_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats
CREATE TRIGGER webhook_delivery_completed
  AFTER UPDATE OF status ON webhook_deliveries
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND NEW.status IN ('success', 'failed'))
  EXECUTE FUNCTION update_webhook_stats();

-- Function to get webhooks for an event
CREATE OR REPLACE FUNCTION get_webhooks_for_event(
  p_organization_id UUID,
  p_event_type webhook_event_type
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  secret VARCHAR,
  custom_headers JSONB,
  retry_count INTEGER,
  timeout_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.url,
    w.secret,
    w.custom_headers,
    w.retry_count,
    w.timeout_seconds
  FROM webhooks w
  WHERE w.organization_id = p_organization_id
    AND w.is_active = true
    AND p_event_type = ANY(w.events);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for old delivery logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
