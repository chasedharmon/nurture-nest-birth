import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import type { ContactFormData } from '@/lib/schemas/contact'

interface ContactFormEmailProps {
  data: ContactFormData
}

export function ContactFormEmail({ data }: ContactFormEmailProps) {
  const serviceLabels: Record<string, string> = {
    'birth-doula': 'Birth Doula Support',
    'postpartum-care': 'Postpartum Care',
    lactation: 'Lactation Consulting',
    'sibling-prep': 'Sibling Preparation',
    multiple: 'Multiple Services',
    'not-sure': 'Not Sure Yet',
  }

  return (
    <Html>
      <Head />
      <Body
        style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff' }}
      >
        <Container
          style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}
        >
          <Section
            style={{
              backgroundColor: '#f9fafb',
              padding: '30px',
              borderRadius: '8px',
            }}
          >
            <Heading
              style={{
                color: '#111827',
                fontSize: '24px',
                marginBottom: '20px',
                fontFamily: 'Georgia, serif',
              }}
            >
              New Contact Form Submission
            </Heading>

            <Section style={{ marginBottom: '20px' }}>
              <Heading
                as="h2"
                style={{
                  color: '#374151',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}
              >
                Contact Information
              </Heading>
              <Text style={{ marginBottom: '10px' }}>
                <strong>Name:</strong> {data.name}
              </Text>
              <Text style={{ marginBottom: '10px' }}>
                <strong>Email:</strong>{' '}
                <Link
                  href={`mailto:${data.email}`}
                  style={{ color: '#7c3aed' }}
                >
                  {data.email}
                </Link>
              </Text>
              {data.phone && (
                <Text style={{ marginBottom: '10px' }}>
                  <strong>Phone:</strong>{' '}
                  <Link href={`tel:${data.phone}`} style={{ color: '#7c3aed' }}>
                    {data.phone}
                  </Link>
                </Text>
              )}
            </Section>

            {(data.dueDate || data.service) && (
              <Section style={{ marginBottom: '20px' }}>
                <Heading
                  as="h2"
                  style={{
                    color: '#374151',
                    fontSize: '16px',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  Service Details
                </Heading>
                {data.service && (
                  <Text style={{ marginBottom: '10px' }}>
                    <strong>Service Interest:</strong>{' '}
                    {serviceLabels[data.service] || data.service}
                  </Text>
                )}
                {data.dueDate && (
                  <Text style={{ marginBottom: '10px' }}>
                    <strong>Due Date:</strong> {data.dueDate}
                  </Text>
                )}
              </Section>
            )}

            <Section style={{ marginBottom: '20px' }}>
              <Heading
                as="h2"
                style={{
                  color: '#374151',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}
              >
                Message
              </Heading>
              <Text
                style={{
                  backgroundColor: '#ffffff',
                  padding: '15px',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {data.message}
              </Text>
            </Section>

            <Hr
              style={{ borderTop: '1px solid #e5e7eb', margin: '30px 0 20px' }}
            />

            <Text style={{ fontSize: '14px', color: '#6b7280' }}>
              This message was sent from the Nurture Nest Birth contact form on{' '}
              {new Date().toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
