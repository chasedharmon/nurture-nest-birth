import { Section, Text, Button } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { DocumentSharedEmailData } from '../types'

interface DocumentSharedEmailProps {
  data: DocumentSharedEmailData
}

const documentTypeLabels: Record<string, string> = {
  contract: 'Contract',
  birth_plan: 'Birth Plan',
  resource: 'Resource',
  photo: 'Photo',
  invoice: 'Invoice',
  form: 'Form',
  other: 'Document',
}

const documentTypeIcons: Record<string, string> = {
  contract: '📄',
  birth_plan: '📋',
  resource: '📚',
  photo: '📷',
  invoice: '🧾',
  form: '📝',
  other: '📎',
}

/**
 * Document Shared Email
 *
 * Sent when admin shares a document with a client.
 */
export function DocumentSharedEmail({ data }: DocumentSharedEmailProps) {
  const {
    clientName,
    documentTitle,
    documentType,
    documentDescription,
    portalUrl,
    doulaName,
  } = data

  const typeLabel = documentTypeLabels[documentType] || 'Document'
  const typeIcon = documentTypeIcons[documentType] || '📎'

  return (
    <EmailLayout previewText={`New document available: ${documentTitle}`}>
      <Text style={styles.heading}>New document for you!</Text>

      <Text style={styles.paragraph}>Hi {clientName},</Text>

      <Text style={styles.paragraph}>
        I&apos;ve shared a new document with you in your client portal.
      </Text>

      {/* Document Card */}
      <Section
        style={{
          backgroundColor: '#f4f4f5',
          border: '1px solid #e4e4e7',
          borderRadius: '12px',
          padding: '24px',
          margin: '24px 0',
        }}
      >
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '48px', verticalAlign: 'top' }}>
                <Text
                  style={{
                    fontSize: '32px',
                    margin: 0,
                    lineHeight: '1',
                  }}
                >
                  {typeIcon}
                </Text>
              </td>
              <td style={{ paddingLeft: '16px' }}>
                <Text
                  style={{
                    ...styles.subheading,
                    margin: '0 0 4px 0',
                  }}
                >
                  {documentTitle}
                </Text>
                <Text
                  style={{
                    ...styles.muted,
                    margin: 0,
                  }}
                >
                  {typeLabel}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>

        {documentDescription && (
          <Text
            style={{
              ...styles.paragraph,
              marginTop: '16px',
              marginBottom: 0,
              paddingTop: '16px',
              borderTop: '1px solid #e4e4e7',
            }}
          >
            {documentDescription}
          </Text>
        )}
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={`${portalUrl}/documents`} style={styles.button}>
          View in Portal
        </Button>
      </Section>

      <Text style={styles.muted}>
        You can access all your documents anytime in your client portal.
      </Text>

      <Text style={styles.paragraph}>
        If you have any questions about this document, just reply to this email!
      </Text>

      <Text style={styles.paragraph}>
        Best,
        <br />
        {doulaName}
      </Text>
    </EmailLayout>
  )
}

// Preview data for email development
DocumentSharedEmail.PreviewProps = {
  data: {
    clientName: 'Sarah',
    documentTitle: 'Birth Preferences Template',
    documentType: 'birth_plan',
    documentDescription:
      'A template to help you think through and communicate your birth preferences. Feel free to fill this out and we can review it together at our next prenatal visit.',
    portalUrl: 'https://nurturenestbirth.com/client',
    doulaName: 'Your Doula',
  },
} as DocumentSharedEmailProps
