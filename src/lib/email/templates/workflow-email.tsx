import { Section, Text, Button } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { WorkflowEmailData } from '../types'

interface WorkflowEmailProps {
  data: WorkflowEmailData
}

/**
 * Workflow Email
 *
 * Generic email template for workflow automation.
 * Supports variable interpolation for personalization.
 */
export function WorkflowEmail({ data }: WorkflowEmailProps) {
  const { recipientName, subject, body, ctaText, ctaUrl, doulaName } = data

  return (
    <EmailLayout previewText={subject}>
      <Text style={styles.heading}>{subject}</Text>

      {recipientName && (
        <Text style={styles.paragraph}>Hi {recipientName},</Text>
      )}

      {body.split('\n').map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      {ctaText && ctaUrl && (
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={ctaUrl} style={styles.button}>
            {ctaText}
          </Button>
        </Section>
      )}

      {doulaName && (
        <Text style={styles.paragraph}>
          Warmly,
          <br />
          {doulaName}
        </Text>
      )}
    </EmailLayout>
  )
}

// Preview data for email development
WorkflowEmail.PreviewProps = {
  data: {
    recipientName: 'Sarah',
    subject: 'A Message From Your Doula',
    body: 'I wanted to check in and see how you are doing.\n\nPlease let me know if you have any questions or need anything.',
    ctaText: 'View Your Portal',
    ctaUrl: 'https://nurturenestbirth.com/client/dashboard',
    doulaName: 'Your Doula',
  },
} as WorkflowEmailProps
