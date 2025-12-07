-- Phase 4.2: Meeting Reminders Migration
-- Add columns for meeting reminders and preparation notes

-- Add reminder tracking column to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Add preparation notes column for meeting prep instructions
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS preparation_notes TEXT;

-- Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_meetings_reminder_pending
ON meetings (scheduled_at, status)
WHERE reminder_sent_at IS NULL AND status = 'scheduled';

-- Comments for documentation
COMMENT ON COLUMN meetings.reminder_sent_at IS 'Timestamp when the meeting reminder email was sent. NULL means no reminder sent yet.';
COMMENT ON COLUMN meetings.preparation_notes IS 'Notes for the client about how to prepare for this meeting.';
