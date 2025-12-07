import { Section, Text, Button } from '@react-email/components'
import { EmailLayout, styles } from './email-layout'
import type { PaymentReceivedEmailData } from '../types'
import { format } from 'date-fns'

interface PaymentReceivedEmailProps {
  data: PaymentReceivedEmailData
}

const paymentMethodLabels: Record<string, string> = {
  stripe: 'Card',
  check: 'Check',
  cash: 'Cash',
  venmo: 'Venmo',
  zelle: 'Zelle',
  other: 'Other',
}

/**
 * Payment Received Email
 *
 * Sent when a payment is recorded for a client.
 */
export function PaymentReceivedEmail({ data }: PaymentReceivedEmailProps) {
  const {
    clientName,
    amount,
    paymentMethod,
    serviceName,
    transactionDate,
    remainingBalance,
    doulaName,
  } = data

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  const formattedBalance = remainingBalance
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(remainingBalance)
    : null

  const formattedDate = format(transactionDate, 'MMMM d, yyyy')
  const methodLabel = paymentMethodLabels[paymentMethod] || paymentMethod

  return (
    <EmailLayout previewText={`Payment received: ${formattedAmount}`}>
      <Text style={styles.heading}>Payment received - thank you!</Text>

      <Text style={styles.paragraph}>Hi {clientName},</Text>

      <Text style={styles.paragraph}>
        This is a confirmation that we&apos;ve received your payment. Thank you!
      </Text>

      {/* Payment Receipt Card */}
      <Section
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '24px',
          margin: '24px 0',
        }}
      >
        <Text
          style={{
            ...styles.heading,
            color: '#16a34a',
            textAlign: 'center',
            margin: '0 0 8px 0',
          }}
        >
          {formattedAmount}
        </Text>
        <Text
          style={{
            ...styles.muted,
            textAlign: 'center',
            margin: '0 0 24px 0',
          }}
        >
          Payment Confirmed
        </Text>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0' }}>
                <Text style={{ ...styles.muted, margin: 0 }}>Date</Text>
              </td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>
                <Text
                  style={{ ...styles.paragraph, margin: 0, fontWeight: '500' }}
                >
                  {formattedDate}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0' }}>
                <Text style={{ ...styles.muted, margin: 0 }}>Method</Text>
              </td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>
                <Text
                  style={{ ...styles.paragraph, margin: 0, fontWeight: '500' }}
                >
                  {methodLabel}
                </Text>
              </td>
            </tr>
            {serviceName && (
              <tr>
                <td style={{ padding: '8px 0' }}>
                  <Text style={{ ...styles.muted, margin: 0 }}>For</Text>
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <Text
                    style={{
                      ...styles.paragraph,
                      margin: 0,
                      fontWeight: '500',
                    }}
                  >
                    {serviceName}
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Remaining Balance */}
      {formattedBalance && remainingBalance && remainingBalance > 0 && (
        <Section style={styles.infoBox}>
          <Text style={{ ...styles.paragraph, margin: 0 }}>
            <strong>Remaining balance:</strong> {formattedBalance}
          </Text>
        </Section>
      )}

      {remainingBalance === 0 && (
        <Section
          style={{
            ...styles.infoBox,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          <Text style={{ ...styles.paragraph, margin: 0, textAlign: 'center' }}>
            ✓ <strong>Paid in full</strong> - Thank you!
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button
          href="https://nurturenestbirth.com/client/payments"
          style={styles.buttonSecondary}
        >
          View Payment History
        </Button>
      </Section>

      <Text style={styles.muted}>
        Keep this email as your receipt. If you have any questions about this
        payment, please don&apos;t hesitate to reach out.
      </Text>

      <Text style={styles.paragraph}>
        Thank you for your trust in my services!
        <br />
        {doulaName}
      </Text>
    </EmailLayout>
  )
}

// Preview data for email development
PaymentReceivedEmail.PreviewProps = {
  data: {
    clientName: 'Sarah',
    amount: 500,
    paymentMethod: 'venmo',
    serviceName: 'Birth Doula Package',
    transactionDate: new Date('2024-12-10'),
    remainingBalance: 700,
    doulaName: 'Your Doula',
  },
} as PaymentReceivedEmailProps
