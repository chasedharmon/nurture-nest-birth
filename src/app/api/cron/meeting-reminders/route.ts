import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMeetingReminderEmail } from '@/app/actions/notifications'

// Use service role for cron jobs to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // If no cron secret is configured, allow in development
  if (!cronSecret) {
    console.warn(
      '[Cron] No CRON_SECRET configured - allowing request in dev mode'
    )
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

/**
 * Meeting Reminders Cron Job
 *
 * This endpoint should be called periodically (e.g., every hour) to send
 * meeting reminder emails. It checks for meetings happening within the
 * configured reminder window (default 24 hours) that haven't had reminders sent.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/meeting-reminders",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting meeting reminders check...')

  try {
    const now = new Date()
    const reminderWindow = 24 // hours before meeting to send reminder

    // Calculate the time window for reminders
    // Send reminders for meetings between now and `reminderWindow` hours from now
    const windowStart = now.toISOString()
    const windowEnd = new Date(
      now.getTime() + reminderWindow * 60 * 60 * 1000
    ).toISOString()

    // Get meetings that:
    // 1. Are scheduled (not cancelled/completed)
    // 2. Fall within the reminder window
    // 3. Haven't had a reminder sent yet
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(
        `
        id,
        client_id,
        scheduled_at,
        meeting_type,
        title,
        reminder_sent_at
      `
      )
      .eq('status', 'scheduled')
      .gte('scheduled_at', windowStart)
      .lte('scheduled_at', windowEnd)
      .is('reminder_sent_at', null)

    if (meetingsError) {
      console.error('[Cron] Failed to fetch meetings:', meetingsError)
      return NextResponse.json(
        { error: 'Failed to fetch meetings', details: meetingsError.message },
        { status: 500 }
      )
    }

    console.log(
      `[Cron] Found ${meetings?.length || 0} meetings needing reminders`
    )

    if (!meetings || meetings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No meetings need reminders',
        remindersSent: 0,
      })
    }

    // Send reminders for each meeting
    const results = await Promise.allSettled(
      meetings.map(async meeting => {
        const hoursUntil = Math.round(
          (new Date(meeting.scheduled_at).getTime() - now.getTime()) /
            (1000 * 60 * 60)
        )

        console.log(
          `[Cron] Sending reminder for meeting ${meeting.id} (${hoursUntil}h until)`
        )

        // Send the reminder email
        const emailResult = (await sendMeetingReminderEmail(
          meeting.id,
          hoursUntil
        )) as { success: boolean; skipped?: boolean; error?: string }

        // Check for skipped (notification preferences disabled)
        if (emailResult.skipped) {
          return { meetingId: meeting.id, status: 'skipped' }
        }

        if (emailResult.success) {
          // Mark reminder as sent
          await supabase
            .from('meetings')
            .update({ reminder_sent_at: now.toISOString() })
            .eq('id', meeting.id)

          return { meetingId: meeting.id, status: 'sent' }
        } else {
          return {
            meetingId: meeting.id,
            status: 'failed',
            error: emailResult.error || 'Unknown error',
          }
        }
      })
    )

    // Summarize results
    const sent = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 'sent'
    ).length
    const skipped = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 'skipped'
    ).length
    const failed = results.filter(
      r =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && r.value.status === 'failed')
    ).length

    console.log(
      `[Cron] Completed: ${sent} sent, ${skipped} skipped, ${failed} failed`
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${meetings.length} meetings`,
      remindersSent: sent,
      skipped,
      failed,
      details: results.map(r =>
        r.status === 'fulfilled'
          ? r.value
          : { status: 'error', error: r.reason }
      ),
    })
  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request)
}
