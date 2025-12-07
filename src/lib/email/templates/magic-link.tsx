import { Section, Text, Link, Button } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { MagicLinkEmailData } from '../types'

interface MagicLinkEmailProps {
  data: MagicLinkEmailData
}

/**
 * Magic Link Login Email
 *
 * Sent when a client requests passwordless login.
 */
export function MagicLinkEmail({ data }: MagicLinkEmailProps) {
  const { recipientName, magicLinkUrl, expiresInHours } = data

  return (
    <EmailLayout previewText="Your secure login link for the client portal">
      <Text style={styles.heading}>Sign in to your portal</Text>

      <Text style={styles.paragraph}>Hi {recipientName},</Text>

      <Text style={styles.paragraph}>
        Click the button below to securely sign in to your client portal. No
        password needed!
      </Text>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={magicLinkUrl} style={styles.button}>
          Sign In to Portal
        </Button>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.muted, margin: 0 }}>
          This link will expire in {expiresInHours} hours. If you didn&apos;t
          request this email, you can safely ignore it.
        </Text>
      </Section>

      <Text style={styles.muted}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text
        style={{
          ...styles.muted,
          wordBreak: 'break-all',
          backgroundColor: '#f4f4f5',
          padding: '12px',
          borderRadius: '4px',
        }}
      >
        <Link href={magicLinkUrl} style={styles.link}>
          {magicLinkUrl}
        </Link>
      </Text>
    </EmailLayout>
  )
}

// Preview data for email development
MagicLinkEmail.PreviewProps = {
  data: {
    recipientName: 'Sarah',
    magicLinkUrl: 'https://nurturenestbirth.com/client/verify?token=abc123',
    expiresInHours: 24,
  },
} as MagicLinkEmailProps
