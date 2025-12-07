import { Section, Text, Button, Link } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { MeetingReminderEmailData } from '../types'
import { format } from 'date-fns'

interface MeetingReminderEmailProps {
  data: MeetingReminderEmailData
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
 * Meeting Reminder Email
 *
 * Sent 24 hours before a scheduled meeting.
 */
export function MeetingReminderEmail({ data }: MeetingReminderEmailProps) {
  const {
    clientName,
    meetingType,
    meetingTitle,
    scheduledAt,
    duration,
    location,
    meetingLink,
    preparationNotes,
    hoursUntil,
    doulaName,
  } = data

  const meetingLabel = meetingTypeLabels[meetingType] || meetingType
  const formattedDate = format(scheduledAt, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(scheduledAt, 'h:mm a')

  const urgencyText =
    hoursUntil <= 2
      ? "It's almost time!"
      : hoursUntil <= 6
        ? 'Coming up soon!'
        : 'Friendly reminder'

  return (
    <EmailLayout
      previewText={`Reminder: Your ${meetingLabel} is ${hoursUntil <= 2 ? 'in ' + hoursUntil + ' hours' : 'tomorrow'}`}
    >
      <Text style={styles.heading}>{urgencyText}</Text>

      <Text style={styles.paragraph}>Hi {clientName},</Text>

      <Text style={styles.paragraph}>
        Just a friendly reminder that your{' '}
        <strong>{meetingTitle || meetingLabel.toLowerCase()}</strong> is{' '}
        {hoursUntil <= 2 ? (
          <>
            in <strong>{hoursUntil} hours</strong>
          </>
        ) : hoursUntil <= 6 ? (
          <>
            <strong>later today</strong>
          </>
        ) : (
          <>
            <strong>tomorrow</strong>
          </>
        )}
        . I&apos;m looking forward to our time together!
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
            Quick Reminder
          </Text>
          <Text style={{ ...styles.paragraph, margin: 0 }}>
            {preparationNotes}
          </Text>
        </Section>
      )}

      {/* Need to reschedule */}
      <Section style={styles.warningBox}>
        <Text style={{ ...styles.paragraph, margin: 0 }}>
          <strong>Need to reschedule?</strong> Please let me know as soon as
          possible by replying to this email or calling me directly.
        </Text>
      </Section>

      {/* Map link for in-person */}
      {location && !meetingLink && (
        <Text style={styles.muted}>
          <Link
            href={`https://maps.google.com/maps?q=${encodeURIComponent(location)}`}
            style={styles.link}
          >
            Get directions in Google Maps →
          </Link>
        </Text>
      )}

      <Text style={styles.paragraph}>
        See you soon!
        <br />
        {doulaName}
      </Text>
    </EmailLayout>
  )
}

// Preview data for email development
MeetingReminderEmail.PreviewProps = {
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
    hoursUntil: 24,
    doulaName: 'Your Doula',
  },
} as MeetingReminderEmailProps
