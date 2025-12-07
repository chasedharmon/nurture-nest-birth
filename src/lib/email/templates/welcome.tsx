import { Section, Text, Button } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { WelcomeEmailData } from '../types'

interface WelcomeEmailProps {
  data: WelcomeEmailData
}

/**
 * Welcome Email
 *
 * Sent when a client is first given portal access.
 */
export function WelcomeEmail({ data }: WelcomeEmailProps) {
  const { clientName, portalUrl, doulaName, doulaPhone } = data

  return (
    <EmailLayout previewText="Welcome to your client portal - let's get started!">
      <Text style={styles.heading}>Welcome to your client portal!</Text>

      <Text style={styles.paragraph}>Hi {clientName},</Text>

      <Text style={styles.paragraph}>
        I&apos;m so excited to support you on this journey! Your personal client
        portal is now ready. Here you can:
      </Text>

      <Section style={{ marginBottom: '24px' }}>
        <Text style={{ ...styles.paragraph, marginBottom: '8px' }}>
          ✓ View your upcoming appointments
        </Text>
        <Text style={{ ...styles.paragraph, marginBottom: '8px' }}>
          ✓ Access important documents and resources
        </Text>
        <Text style={{ ...styles.paragraph, marginBottom: '8px' }}>
          ✓ Track your services and payments
        </Text>
        <Text style={{ ...styles.paragraph, marginBottom: '8px' }}>
          ✓ Update your birth preferences and contact info
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={portalUrl} style={styles.button}>
          Access Your Portal
        </Button>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.subheading, margin: '0 0 8px 0' }}>
          Next Steps
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0 }}>
          Please take a few minutes to complete your intake form in the portal.
          This helps me understand your preferences and prepare for our journey
          together.
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        If you have any questions, don&apos;t hesitate to reach out. I&apos;m
        here for you!
      </Text>

      <Text style={styles.paragraph}>
        Warmly,
        <br />
        {doulaName}
        <br />
        <span style={{ color: '#71717a' }}>{doulaPhone}</span>
      </Text>
    </EmailLayout>
  )
}

// Preview data for email development
WelcomeEmail.PreviewProps = {
  data: {
    clientName: 'Sarah',
    portalUrl: 'https://nurturenestbirth.com/client/dashboard',
    doulaName: 'Your Doula',
    doulaPhone: '(308) 555-0123',
  },
} as WelcomeEmailProps
