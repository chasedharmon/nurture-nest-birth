-- ============================================================================
-- Migration: Canned Email Templates
-- Stores reusable email content for quick composition
-- ============================================================================

-- ============================================================================
-- 1. EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  name TEXT NOT NULL,
  description TEXT,

  -- Categorization
  category TEXT DEFAULT 'general',

  -- Template content
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Variables available in this template (for UI display)
  available_variables TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT email_template_name_unique UNIQUE (name),
  CONSTRAINT email_template_category_check
    CHECK (category IN ('inquiry', 'booking', 'reminder', 'follow_up', 'payment', 'document', 'general'))
);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can manage email templates
CREATE POLICY "Authenticated users can manage email_templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_email_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_template_updated_at ON email_templates;
CREATE TRIGGER email_template_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_template_timestamp();

-- ============================================================================
-- 2. INSERT DEFAULT DOULA EMAIL TEMPLATES
-- ============================================================================

INSERT INTO email_templates (name, description, category, subject, body, available_variables, is_active, is_default)
VALUES
  -- Inquiry Response Templates
  (
    'Initial Inquiry Response',
    'First response to a new inquiry',
    'inquiry',
    'Thank you for reaching out to Nurture Nest Birth!',
    E'Hi {{client_name}},

Thank you so much for reaching out! I''m thrilled that you''re considering having doula support for your birth journey.

I''d love to learn more about you and your hopes for your birth experience. Would you be available for a free consultation call? I have openings this week and would be happy to answer any questions you might have.

You can book a time that works for you through my scheduling link, or just reply to this email with some times that work for you.

Looking forward to connecting!

Warmly,
{{doula_name}}
Nurture Nest Birth',
    ARRAY['client_name', 'doula_name'],
    true,
    true
  ),

  (
    'Follow-up After No Response',
    'Gentle follow-up when client hasn''t responded',
    'inquiry',
    'Checking in - Nurture Nest Birth',
    E'Hi {{client_name}},

I wanted to follow up on my previous email. I know life gets busy, especially when you''re expecting!

I''m still very interested in supporting you through your birth journey. If you have any questions or would like to schedule a consultation, I''m here whenever you''re ready.

No pressure at all - just wanted to make sure you knew I''m available.

Warmly,
{{doula_name}}',
    ARRAY['client_name', 'doula_name'],
    true,
    false
  ),

  -- Booking Confirmation Templates
  (
    'Consultation Booking Confirmation',
    'Confirms a scheduled consultation call',
    'booking',
    'Your consultation is confirmed for {{meeting_date}}',
    E'Hi {{client_name}},

Great news! Your consultation is confirmed for {{meeting_date}} at {{meeting_time}}.

{{#if meeting_link}}
We''ll meet via video call. Here''s your link: {{meeting_link}}
{{else}}
We''ll meet at: {{meeting_location}}
{{/if}}

Before our call, you might want to think about:
- What''s most important to you about your birth experience?
- Any fears or concerns you''d like to discuss
- Questions about doula support

I''m looking forward to meeting you!

Warmly,
{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'meeting_date', 'meeting_time', 'meeting_link', 'meeting_location'],
    true,
    true
  ),

  (
    'Service Agreement Sent',
    'Notifies client that contract is ready to sign',
    'booking',
    'Your birth doula services agreement is ready',
    E'Hi {{client_name}},

I''m so excited to officially welcome you as a client! Your services agreement is now ready for review and signature.

You can access your client portal here: {{portal_link}}

Once signed, we''ll be all set to begin our journey together. If you have any questions about the agreement, please don''t hesitate to reach out.

Looking forward to supporting you!

Warmly,
{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'portal_link'],
    true,
    false
  ),

  -- Reminder Templates
  (
    'Prenatal Visit Reminder',
    'Reminder for upcoming prenatal appointment',
    'reminder',
    'Reminder: Prenatal visit {{meeting_date}}',
    E'Hi {{client_name}},

This is a friendly reminder that we have a prenatal visit scheduled for {{meeting_date}} at {{meeting_time}}.

{{#if meeting_location}}
Location: {{meeting_location}}
{{/if}}

If you need to reschedule, please let me know as soon as possible.

See you soon!

{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'meeting_date', 'meeting_time', 'meeting_location'],
    true,
    false
  ),

  (
    '38 Week Check-in',
    'Check-in when client reaches 38 weeks',
    'reminder',
    'Thinking of you as you near your due date!',
    E'Hi {{client_name}},

You''re {{weeks_pregnant}} weeks now - getting so close! I just wanted to check in and see how you''re feeling.

Remember, I''m now on-call for you 24/7. My phone will be on and charged, ready for your call whenever labor begins.

Quick reminders:
- Call or text me when you think labor might be starting
- Don''t worry about the time - day or night, I''m here
- Early labor is a great time to rest and stay hydrated

Is there anything you''d like to go over before baby arrives?

Thinking of you!

{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'weeks_pregnant'],
    true,
    false
  ),

  -- Follow-up Templates
  (
    'Postpartum Check-in',
    'Check-in after birth',
    'follow_up',
    'Congratulations and checking in!',
    E'Dear {{client_name}},

Congratulations on the arrival of your little one! I hope you''re settling in and getting some rest.

I wanted to check in and see how you''re doing. Remember, our postpartum visit is scheduled for {{visit_date}}. During this visit, we''ll:
- Process your birth story together
- Check in on how you''re feeling physically and emotionally
- Discuss any breastfeeding questions or concerns
- Provide resources and referrals as needed

If you need anything before then, please don''t hesitate to reach out.

Wishing you peaceful moments with your new baby.

With love,
{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'visit_date'],
    true,
    false
  ),

  -- Payment Templates
  (
    'Payment Reminder',
    'Gentle reminder about upcoming payment',
    'payment',
    'Friendly reminder: Payment due {{due_date}}',
    E'Hi {{client_name}},

I hope this message finds you well! This is a gentle reminder that your payment of {{amount}} is due on {{due_date}}.

You can make your payment through the client portal: {{portal_link}}

If you have any questions or need to discuss payment arrangements, please don''t hesitate to reach out.

Thank you!

{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'amount', 'due_date', 'portal_link'],
    true,
    false
  ),

  (
    'Payment Received Thank You',
    'Confirmation and thanks for payment',
    'payment',
    'Payment received - Thank you!',
    E'Hi {{client_name}},

Thank you for your payment of {{amount}}! Your payment has been received and applied to your account.

{{#if remaining_balance}}
Your remaining balance is: {{remaining_balance}}
{{else}}
Your account is now paid in full!
{{/if}}

If you have any questions, please let me know.

Warmly,
{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'amount', 'remaining_balance'],
    true,
    false
  ),

  -- Document Templates
  (
    'Resource Shared',
    'Notification when sharing educational resources',
    'document',
    'New resource for you: {{document_title}}',
    E'Hi {{client_name}},

I''ve shared a new resource with you: "{{document_title}}"

{{#if description}}
{{description}}
{{/if}}

You can access it in your client portal: {{portal_link}}

Let me know if you have any questions after reviewing it!

{{doula_name}}',
    ARRAY['client_name', 'doula_name', 'document_title', 'description', 'portal_link'],
    true,
    false
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE email_templates IS 'Reusable email templates with variable placeholders for quick email composition';
