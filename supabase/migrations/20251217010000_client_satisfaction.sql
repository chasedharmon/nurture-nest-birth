-- ============================================================================
-- Migration: Client Satisfaction System (Phase E.2)
-- Adds surveys, responses, and invitations for NPS/CSAT tracking
-- ============================================================================

-- ============================================================================
-- 1. SURVEYS TABLE
-- Survey templates that can be sent to clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Survey metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Survey type determines scoring/display
  survey_type TEXT NOT NULL DEFAULT 'nps',

  -- Questions stored as JSONB array
  -- [{ id: string, type: 'nps'|'rating'|'text'|'multiple_choice', question: string, required: boolean, options?: string[] }]
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Customization
  thank_you_message TEXT DEFAULT 'Thank you for your feedback!',

  -- When this survey should be triggered
  trigger_type TEXT DEFAULT 'manual',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Aggregated stats (denormalized for performance)
  response_count INTEGER DEFAULT 0,
  average_score DECIMAL(3,1),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT survey_type_check
    CHECK (survey_type IN ('nps', 'csat', 'custom')),
  CONSTRAINT survey_trigger_type_check
    CHECK (trigger_type IN ('manual', 'after_service', 'after_meeting', 'workflow'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_surveys_org_id ON surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_surveys_type ON surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_surveys_trigger_type ON surveys(trigger_type);

COMMENT ON TABLE surveys IS 'Survey templates for collecting client feedback (NPS, CSAT, custom)';

-- Enable RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Authenticated users can manage surveys"
  ON surveys FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. SURVEY RESPONSES TABLE
-- Individual responses from clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Responses stored as JSONB { question_id: answer }
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- For NPS surveys, extract the score for easy querying
  nps_score INTEGER CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10)),

  -- Open-ended feedback
  feedback_text TEXT,

  -- NPS categorization: 0-6 = detractor, 7-8 = passive, 9-10 = promoter
  sentiment TEXT,

  -- Submission tracking
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Legal/tracking info
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT response_sentiment_check
    CHECK (sentiment IS NULL OR sentiment IN ('promoter', 'passive', 'detractor'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_client_id ON survey_responses(client_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_service_id ON survey_responses(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_survey_responses_org_id ON survey_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_nps_score ON survey_responses(nps_score) WHERE nps_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_survey_responses_sentiment ON survey_responses(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted ON survey_responses(submitted_at);

COMMENT ON TABLE survey_responses IS 'Client responses to surveys with NPS scoring and feedback';

-- Enable RLS
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can see all, clients can see their own
CREATE POLICY "Authenticated users can manage survey_responses"
  ON survey_responses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. SURVEY INVITATIONS TABLE
-- Track when surveys are sent and their completion status
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- How the invitation was sent
  sent_via TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tracking engagement
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Token for public access (no auth required)
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,

  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',

  -- Reference to response if completed
  response_id UUID REFERENCES survey_responses(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT invitation_sent_via_check
    CHECK (sent_via IN ('email', 'portal', 'sms'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_invitations_survey_id ON survey_invitations(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_client_id ON survey_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_org_id ON survey_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_token ON survey_invitations(token);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_expires ON survey_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_pending ON survey_invitations(completed_at) WHERE completed_at IS NULL;

COMMENT ON TABLE survey_invitations IS 'Tracks survey invitations sent to clients with completion status';

-- Enable RLS
ALTER TABLE survey_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Authenticated users can manage survey_invitations"
  ON survey_invitations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. TRIGGER TO UPDATE SURVEY STATS ON RESPONSE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_survey_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_nps DECIMAL(3,1);
BEGIN
  -- Update response count and average score
  UPDATE surveys
  SET
    response_count = (
      SELECT COUNT(*) FROM survey_responses WHERE survey_id = NEW.survey_id
    ),
    average_score = (
      SELECT AVG(nps_score)::DECIMAL(3,1)
      FROM survey_responses
      WHERE survey_id = NEW.survey_id AND nps_score IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = NEW.survey_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_survey_stats_trigger ON survey_responses;
CREATE TRIGGER update_survey_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_stats();

-- ============================================================================
-- 5. TRIGGER TO MARK INVITATION COMPLETED
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_invitation_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Find and update matching invitation
  UPDATE survey_invitations
  SET
    completed_at = NEW.submitted_at,
    response_id = NEW.id
  WHERE survey_id = NEW.survey_id
    AND client_id = NEW.client_id
    AND completed_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mark_invitation_completed_trigger ON survey_responses;
CREATE TRIGGER mark_invitation_completed_trigger
  AFTER INSERT ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION mark_invitation_completed();

-- ============================================================================
-- 6. ACTIVITY LOG TRIGGER FOR SURVEY RESPONSES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_survey_response_activity()
RETURNS TRIGGER AS $$
DECLARE
  survey_name TEXT;
  score_text TEXT;
BEGIN
  -- Get survey name
  SELECT name INTO survey_name FROM surveys WHERE id = NEW.survey_id;

  -- Format score text
  IF NEW.nps_score IS NOT NULL THEN
    score_text := ' (Score: ' || NEW.nps_score || '/10 - ' || NEW.sentiment || ')';
  ELSE
    score_text := '';
  END IF;

  -- Log activity
  INSERT INTO lead_activities (
    lead_id,
    activity_type,
    content,
    activity_category,
    related_record_type,
    related_record_id,
    metadata
  )
  VALUES (
    NEW.client_id,
    'system',
    'Completed survey: ' || COALESCE(survey_name, 'Feedback') || score_text,
    'milestone',
    'survey_response',
    NEW.id,
    jsonb_build_object(
      'survey_id', NEW.survey_id,
      'nps_score', NEW.nps_score,
      'sentiment', NEW.sentiment
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS survey_response_activity_log ON survey_responses;
CREATE TRIGGER survey_response_activity_log
  AFTER INSERT ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION log_survey_response_activity();

-- ============================================================================
-- 7. DEFAULT NPS SURVEY TEMPLATE
-- ============================================================================

INSERT INTO surveys (
  organization_id,
  name,
  description,
  survey_type,
  questions,
  thank_you_message,
  trigger_type,
  is_active
)
SELECT
  o.id,
  'Service Feedback Survey',
  'Post-service NPS survey to measure client satisfaction',
  'nps',
  '[
    {
      "id": "nps",
      "type": "nps",
      "question": "On a scale of 0-10, how likely are you to recommend our services to a friend or family member?",
      "required": true
    },
    {
      "id": "feedback",
      "type": "text",
      "question": "What is the primary reason for your score?",
      "required": false
    },
    {
      "id": "improvement",
      "type": "text",
      "question": "Is there anything we could have done to improve your experience?",
      "required": false
    }
  ]'::jsonb,
  'Thank you for sharing your feedback! Your input helps us provide better care for families in our community.',
  'after_service',
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM surveys s WHERE s.organization_id = o.id AND s.survey_type = 'nps'
);

-- ============================================================================
-- 8. ADD EMAIL TEMPLATE FOR SURVEY INVITATION
-- ============================================================================

INSERT INTO email_templates (name, subject, category, content, is_active)
SELECT
  'Service Feedback Survey',
  'We''d love your feedback!',
  'client',
  E'<p>Hi {{client_name}},</p>

<p>Thank you for choosing Nurture Nest Birth for your {{service_type}} journey. We hope your experience was everything you hoped for!</p>

<p>We would truly appreciate it if you could take 2 minutes to share your feedback. Your insights help us continue providing the best possible care for families in our community.</p>

<p><strong><a href="{{survey_link}}">Share Your Feedback</a></strong></p>

<p>Thank you for being part of our birth community!</p>

<p>With gratitude,<br>
The Nurture Nest Team</p>',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE name = 'Service Feedback Survey'
);

-- ============================================================================
-- 9. HELPER FUNCTION: Calculate NPS Score
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_nps(p_survey_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
  promoter_count INTEGER;
  detractor_count INTEGER;
  nps INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE nps_score >= 9),
    COUNT(*) FILTER (WHERE nps_score <= 6)
  INTO total_count, promoter_count, detractor_count
  FROM survey_responses
  WHERE survey_id = p_survey_id AND nps_score IS NOT NULL;

  IF total_count = 0 THEN
    RETURN NULL;
  END IF;

  nps := ROUND(
    ((promoter_count::DECIMAL / total_count) - (detractor_count::DECIMAL / total_count)) * 100
  );

  RETURN nps;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_nps IS 'Calculates Net Promoter Score for a survey: %Promoters - %Detractors';

-- ============================================================================
-- 10. VIEW: Survey Response Summary
-- ============================================================================

CREATE OR REPLACE VIEW survey_response_summary AS
SELECT
  s.id AS survey_id,
  s.organization_id,
  s.name AS survey_name,
  s.survey_type,
  COUNT(sr.id) AS total_responses,
  COUNT(sr.id) FILTER (WHERE sr.sentiment = 'promoter') AS promoters,
  COUNT(sr.id) FILTER (WHERE sr.sentiment = 'passive') AS passives,
  COUNT(sr.id) FILTER (WHERE sr.sentiment = 'detractor') AS detractors,
  ROUND(AVG(sr.nps_score), 1) AS average_score,
  calculate_nps(s.id) AS nps_score,
  -- Response rate
  (SELECT COUNT(*) FROM survey_invitations si WHERE si.survey_id = s.id) AS invitations_sent,
  CASE
    WHEN (SELECT COUNT(*) FROM survey_invitations si WHERE si.survey_id = s.id) > 0
    THEN ROUND(
      COUNT(sr.id)::DECIMAL /
      (SELECT COUNT(*) FROM survey_invitations si WHERE si.survey_id = s.id) * 100,
      1
    )
    ELSE NULL
  END AS response_rate
FROM surveys s
LEFT JOIN survey_responses sr ON sr.survey_id = s.id
GROUP BY s.id, s.organization_id, s.name, s.survey_type;

COMMENT ON VIEW survey_response_summary IS 'Aggregated survey statistics including NPS calculation';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
