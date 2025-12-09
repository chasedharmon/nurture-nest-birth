-- ============================================================================
-- Migration: Welcome Packets
-- Automated onboarding bundles for new clients
-- ============================================================================

-- ============================================================================
-- 1. WELCOME PACKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS welcome_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Packet identification
  name TEXT NOT NULL,
  description TEXT,

  -- Targeting
  service_type TEXT, -- null = all services
  is_active BOOLEAN DEFAULT true,

  -- Trigger configuration
  trigger_on TEXT DEFAULT 'contract_signed',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT welcome_packet_trigger_check
    CHECK (trigger_on IN ('contract_signed', 'lead_converted', 'manual'))
);

-- ============================================================================
-- 2. WELCOME PACKET ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS welcome_packet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES welcome_packets(id) ON DELETE CASCADE,

  -- Item type and reference
  item_type TEXT NOT NULL,
  item_id UUID, -- References documents, forms, or email templates

  -- For custom content
  custom_title TEXT,
  custom_content TEXT,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Delay (in hours from packet trigger)
  delay_hours INTEGER DEFAULT 0,

  -- Status
  is_required BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT welcome_packet_item_type_check
    CHECK (item_type IN ('document', 'email', 'form', 'custom_message', 'action_item'))
);

-- ============================================================================
-- 3. WELCOME PACKET DELIVERIES (TRACKING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS welcome_packet_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES welcome_packets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Delivery status
  status TEXT DEFAULT 'pending',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT welcome_packet_delivery_status_check
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled'))
);

-- ============================================================================
-- 4. WELCOME PACKET ITEM DELIVERIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS welcome_packet_item_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES welcome_packet_deliveries(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES welcome_packet_items(id) ON DELETE CASCADE,

  -- Delivery status
  status TEXT DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT welcome_packet_item_delivery_status_check
    CHECK (status IN ('pending', 'scheduled', 'delivered', 'failed', 'skipped'))
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_welcome_packets_service_type ON welcome_packets(service_type);
CREATE INDEX IF NOT EXISTS idx_welcome_packets_active ON welcome_packets(is_active);
CREATE INDEX IF NOT EXISTS idx_welcome_packet_items_packet ON welcome_packet_items(packet_id);
CREATE INDEX IF NOT EXISTS idx_welcome_packet_deliveries_packet ON welcome_packet_deliveries(packet_id);
CREATE INDEX IF NOT EXISTS idx_welcome_packet_deliveries_client ON welcome_packet_deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_welcome_packet_deliveries_status ON welcome_packet_deliveries(status);

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

ALTER TABLE welcome_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_packet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_packet_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_packet_item_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage welcome_packets"
  ON welcome_packets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage welcome_packet_items"
  ON welcome_packet_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage welcome_packet_deliveries"
  ON welcome_packet_deliveries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage welcome_packet_item_deliveries"
  ON welcome_packet_item_deliveries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_welcome_packet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS welcome_packet_updated_at ON welcome_packets;
CREATE TRIGGER welcome_packet_updated_at
  BEFORE UPDATE ON welcome_packets
  FOR EACH ROW
  EXECUTE FUNCTION update_welcome_packet_timestamp();

-- ============================================================================
-- 8. INSERT DEFAULT WELCOME PACKET
-- ============================================================================

INSERT INTO welcome_packets (name, description, service_type, trigger_on, is_active)
VALUES (
  'New Birth Doula Client Packet',
  'Welcome materials sent when a birth doula client signs their contract',
  'birth_doula',
  'contract_signed',
  true
);

-- Get the packet ID and insert default items
DO $$
DECLARE
  v_packet_id UUID;
BEGIN
  SELECT id INTO v_packet_id FROM welcome_packets WHERE name = 'New Birth Doula Client Packet' LIMIT 1;

  IF v_packet_id IS NOT NULL THEN
    INSERT INTO welcome_packet_items (packet_id, item_type, custom_title, custom_content, sort_order, delay_hours)
    VALUES
      (v_packet_id, 'custom_message', 'Welcome to the Family!',
       'Congratulations on taking this exciting step in your birth journey! I am so honored to be part of your support team. Here are some resources to help you get started.',
       1, 0),
      (v_packet_id, 'action_item', 'Schedule Your First Prenatal Visit',
       'Let''s schedule our first prenatal visit! This is where we''ll dive deep into your birth preferences, discuss any concerns, and start building your birth plan together.',
       2, 0),
      (v_packet_id, 'action_item', 'Complete Your Birth Preferences Questionnaire',
       'Please complete this questionnaire before our first visit. It helps me understand your hopes, fears, and preferences for your birth experience.',
       3, 24),
      (v_packet_id, 'action_item', 'Add Emergency Contacts',
       'Please add your partner, family members, and healthcare providers as contacts in your client portal.',
       4, 48);
  END IF;
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE welcome_packets IS 'Automated onboarding bundles triggered by client actions';
COMMENT ON TABLE welcome_packet_items IS 'Items within a welcome packet (documents, emails, tasks)';
COMMENT ON TABLE welcome_packet_deliveries IS 'Tracks packet delivery to specific clients';
COMMENT ON TABLE welcome_packet_item_deliveries IS 'Tracks individual item delivery within a packet';
