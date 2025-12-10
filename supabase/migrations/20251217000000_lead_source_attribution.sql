-- ============================================================================
-- Migration: Lead Source Attribution (Phase E.1)
-- Adds UTM tracking, referral sources, and referral partners for lead attribution
-- ============================================================================

-- ============================================================================
-- 1. ADD ATTRIBUTION COLUMNS TO LEADS TABLE
-- ============================================================================

-- Granular source tracking beyond the basic lead_source enum
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source_detail TEXT,
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- UTM parameter tracking for marketing campaigns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Web referrer tracking
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS referrer_url TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- Referral partner tracking (FK added after table creation)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS referral_partner_id UUID;

-- Add indexes for attribution queries
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_referral_source ON leads(referral_source) WHERE referral_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_referral_partner_id ON leads(referral_partner_id) WHERE referral_partner_id IS NOT NULL;

COMMENT ON COLUMN leads.source_detail IS 'Granular source info (e.g., "google_ads", "facebook_organic")';
COMMENT ON COLUMN leads.referral_source IS 'How they heard about us (Google search, Friend/family, Healthcare provider, etc.)';
COMMENT ON COLUMN leads.utm_source IS 'UTM source parameter (e.g., "google", "facebook", "newsletter")';
COMMENT ON COLUMN leads.utm_medium IS 'UTM medium parameter (e.g., "cpc", "organic", "email")';
COMMENT ON COLUMN leads.utm_campaign IS 'UTM campaign parameter (e.g., "spring_promo", "birth_doula_2024")';
COMMENT ON COLUMN leads.utm_term IS 'UTM term parameter (paid search keywords)';
COMMENT ON COLUMN leads.utm_content IS 'UTM content parameter (ad variation identifier)';
COMMENT ON COLUMN leads.referrer_url IS 'HTTP referer URL when lead was created';
COMMENT ON COLUMN leads.landing_page IS 'First page the visitor landed on';

-- ============================================================================
-- 2. REFERRAL PARTNERS TABLE
-- Track healthcare providers, businesses, and individuals who refer clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Partner information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  business_name TEXT,

  -- Partner categorization
  partner_type TEXT DEFAULT 'healthcare',

  -- Referral tracking
  referral_code TEXT,
  referral_url TEXT,

  -- Commission tracking (for future use)
  commission_percent DECIMAL(5,2),
  commission_flat_fee DECIMAL(10,2),

  -- Notes and metadata
  notes TEXT,
  address TEXT,
  specialization TEXT,

  -- Statistics (denormalized for performance)
  lead_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT referral_partner_type_check
    CHECK (partner_type IN ('healthcare', 'business', 'individual', 'organization', 'other'))
);

-- Add unique constraint on referral_code within organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_partners_code_org
  ON referral_partners(organization_id, referral_code)
  WHERE referral_code IS NOT NULL;

-- Indexes for referral partners
CREATE INDEX IF NOT EXISTS idx_referral_partners_org_id ON referral_partners(organization_id);
CREATE INDEX IF NOT EXISTS idx_referral_partners_active ON referral_partners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referral_partners_type ON referral_partners(partner_type);

COMMENT ON TABLE referral_partners IS 'Healthcare providers, businesses, and individuals who refer clients to the practice';

-- Enable RLS
ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can manage referral partners in their org
CREATE POLICY "Authenticated users can manage referral_partners"
  ON referral_partners FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. ADD FOREIGN KEY TO LEADS TABLE
-- ============================================================================

ALTER TABLE leads
  ADD CONSTRAINT leads_referral_partner_id_fkey
  FOREIGN KEY (referral_partner_id)
  REFERENCES referral_partners(id)
  ON DELETE SET NULL;

-- ============================================================================
-- 4. TRIGGER TO UPDATE REFERRAL PARTNER STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_referral_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT with referral_partner_id
  IF (TG_OP = 'INSERT' AND NEW.referral_partner_id IS NOT NULL) THEN
    UPDATE referral_partners
    SET lead_count = lead_count + 1,
        updated_at = NOW()
    WHERE id = NEW.referral_partner_id;
  -- On UPDATE: partner changed
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Decrement old partner
    IF (OLD.referral_partner_id IS NOT NULL AND OLD.referral_partner_id IS DISTINCT FROM NEW.referral_partner_id) THEN
      UPDATE referral_partners
      SET lead_count = GREATEST(0, lead_count - 1),
          updated_at = NOW()
      WHERE id = OLD.referral_partner_id;
    END IF;
    -- Increment new partner
    IF (NEW.referral_partner_id IS NOT NULL AND OLD.referral_partner_id IS DISTINCT FROM NEW.referral_partner_id) THEN
      UPDATE referral_partners
      SET lead_count = lead_count + 1,
          updated_at = NOW()
      WHERE id = NEW.referral_partner_id;
    END IF;
    -- Track conversions (lead became client)
    IF (NEW.status = 'client' AND OLD.status != 'client' AND NEW.referral_partner_id IS NOT NULL) THEN
      UPDATE referral_partners
      SET converted_count = converted_count + 1,
          updated_at = NOW()
      WHERE id = NEW.referral_partner_id;
    END IF;
  -- On DELETE with referral_partner_id
  ELSIF (TG_OP = 'DELETE' AND OLD.referral_partner_id IS NOT NULL) THEN
    UPDATE referral_partners
    SET lead_count = GREATEST(0, lead_count - 1),
        converted_count = CASE WHEN OLD.status = 'client' THEN GREATEST(0, converted_count - 1) ELSE converted_count END,
        updated_at = NOW()
    WHERE id = OLD.referral_partner_id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_referral_partner_stats_trigger ON leads;
CREATE TRIGGER update_referral_partner_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_partner_stats();

-- ============================================================================
-- 5. REFERRAL SOURCE OPTIONS (Reference data)
-- Standardized options for "How did you hear about us?"
-- ============================================================================

COMMENT ON COLUMN leads.referral_source IS 'Standard options: google_search, social_media, friend_family, healthcare_provider, online_ad, event, other';

-- ============================================================================
-- 6. UPDATE LEADS VIEW FOR ATTRIBUTION QUERIES
-- ============================================================================

-- Create a view for lead attribution reporting
CREATE OR REPLACE VIEW lead_attribution_summary AS
SELECT
  l.organization_id,
  COALESCE(l.referral_source, 'unknown') AS referral_source,
  COALESCE(l.utm_source, 'direct') AS utm_source,
  COALESCE(l.utm_medium, 'none') AS utm_medium,
  COALESCE(l.utm_campaign, 'none') AS utm_campaign,
  l.source AS lead_source,
  l.status AS lead_status,
  COUNT(*) AS lead_count,
  COUNT(*) FILTER (WHERE l.status = 'client') AS converted_count,
  ROUND(
    COUNT(*) FILTER (WHERE l.status = 'client')::DECIMAL / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS conversion_rate
FROM leads l
WHERE l.organization_id IS NOT NULL
GROUP BY
  l.organization_id,
  COALESCE(l.referral_source, 'unknown'),
  COALESCE(l.utm_source, 'direct'),
  COALESCE(l.utm_medium, 'none'),
  COALESCE(l.utm_campaign, 'none'),
  l.source,
  l.status;

COMMENT ON VIEW lead_attribution_summary IS 'Aggregated lead attribution data for reporting dashboards';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON COLUMN leads.referral_partner_id IS 'Reference to the referral partner who sent this lead';
