import { Section, Text, Button, Link } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { MeetingScheduledEmailData } from '../types'
import { format } from 'date-fns'

interface MeetingScheduledEmailProps {
  data: MeetingScheduledEmailData
}

const meetingTypeLabels: Record<string, string> = {
  consultation: 'Free Consultation',
  prenatal: 'Prenatal Visit',
  birth: 'Birth Support',
  postpartum: 'Postpartum Visit',
  follow_up: 'Follow-up Visit',
  other: 'Appointment',
}

/**
 * Meeting Scheduled Email
 *
 * Sent when a new meeting is scheduled for a client.
 */
export function MeetingScheduledEmail({ data }: MeetingScheduledEmailProps) {
  const {
    clientName,
    meetingType,
    meetingTitle,
    scheduledAt,
    duration,
    location,
    meetingLink,
    preparationNotes,
    doulaName,
  } = data

  const meetingLabel = meetingTypeLabels[meetingType] || meetingType
  const formattedDate = format(scheduledAt, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(scheduledAt, 'h:mm a')

  return (
    <EmailLayout
      previewText={`Your ${meetingLabel} has been scheduled for ${formattedDate}`}
    >
      <Text style={styles.heading}>Your appointment is confirmed!</Text>

      <Text style={styles.paragraph}>Hi {clientName},</Text>

      <Text style={styles.paragraph}>
        Great news! Your{' '}
        <strong>{meetingTitle || meetingLabel.toLowerCase()}</strong> has been
        scheduled. I&apos;m looking forward to seeing you!
      </Text>

      {/* Meeting Details Card */}
      <Section
        style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderRadius: '12px',
          padding: '24px',
          margin: '24px 0',
        }}
      >
        <Text
          style={{
            ...styles.subheading,
            margin: '0 0 16px 0',
            color: '#7c3aed',
          }}
        >
          {meetingTitle || meetingLabel}
        </Text>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                <Text style={{ ...styles.muted, margin: 0 }}>Date</Text>
              </td>
              <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                <Text
                  style={{ ...styles.paragraph, margin: 0, fontWeight: '600' }}
                >
                  {formattedDate}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                <Text style={{ ...styles.muted, margin: 0 }}>Time</Text>
              </td>
              <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                <Text
                  style={{ ...styles.paragraph, margin: 0, fontWeight: '600' }}
                >
                  {formattedTime} ({duration} minutes)
                </Text>
              </td>
            </tr>
            {location && (
              <tr>
                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                  <Text style={{ ...styles.muted, margin: 0 }}>Location</Text>
                </td>
                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                  <Text
                    style={{
                      ...styles.paragraph,
                      margin: 0,
                      fontWeight: '600',
                    }}
                  >
                    {location}
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {meetingLink && (
          <Section style={{ marginTop: '16px' }}>
            <Button href={meetingLink} style={styles.button}>
              Join Video Call
            </Button>
          </Section>
        )}
      </Section>

      {/* Preparation Notes */}
      {preparationNotes && (
        <Section style={styles.infoBox}>
          <Text style={{ ...styles.subheading, margin: '0 0 8px 0' }}>
            How to Prepare
          </Text>
          <Text style={{ ...styles.paragraph, margin: 0 }}>
            {preparationNotes}
          </Text>
        </Section>
      )}

      {/* Calendar Links */}
      <Text style={styles.muted}>
        Add to your calendar:{' '}
        <Link
          href={generateGoogleCalendarUrl({
            title: meetingTitle || meetingLabel,
            start: scheduledAt,
            duration,
            location: meetingLink || location,
          })}
          style={styles.link}
        >
          Google Calendar
        </Link>
      </Text>

      <Text style={styles.paragraph}>
        If you need to reschedule, please let me know as soon as possible.
      </Text>

      <Text style={styles.paragraph}>
        See you soon!
        <br />
        {doulaName}
      </Text>
    </EmailLayout>
  )
}

// Helper function to generate Google Calendar URL
function generateGoogleCalendarUrl({
  title,
  start,
  duration,
  location,
}: {
  title: string
  start: Date
  duration: number
  location?: string
}) {
  const startStr = format(start, "yyyyMMdd'T'HHmmss")
  const endDate = new Date(start.getTime() + duration * 60 * 1000)
  const endStr = format(endDate, "yyyyMMdd'T'HHmmss")

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    ...(location && { location }),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Preview data for email development
MeetingScheduledEmail.PreviewProps = {
  data: {
    clientName: 'Sarah',
    meetingType: 'prenatal',
    meetingTitle: 'First Prenatal Visit',
    scheduledAt: new Date('2024-12-15T14:00:00'),
    duration: 90,
    location: '123 Main St, Kearney, NE',
    meetingLink: undefined,
    preparationNotes:
      'Please bring your birth plan if you have one started, and any questions you would like to discuss.',
    doulaName: 'Your Doula',
  },
} as MeetingScheduledEmailProps
