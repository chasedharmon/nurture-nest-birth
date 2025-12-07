import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from '@react-email/components'
import { emailConfig } from '../config'

interface EmailLayoutProps {
  children: React.ReactNode
  previewText?: string
}

/**
 * Shared email layout with consistent branding
 *
 * All email templates should use this layout for consistent styling.
 */
export function EmailLayout({ children, previewText }: EmailLayoutProps) {
  const { branding, doula, urls } = emailConfig

  return (
    <Html>
      <Head />
      {previewText && (
        <span
          style={{
            display: 'none',
            overflow: 'hidden',
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {previewText}
        </span>
      )}
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            {branding.logoUrl ? (
              <Img
                src={branding.logoUrl}
                alt={branding.name}
                width={150}
                style={{ margin: '0 auto' }}
              />
            ) : (
              <Text style={styles.logoText}>{branding.name}</Text>
            )}
          </Section>

          {/* Main Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Hr style={styles.divider} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              {branding.name}
              <br />
              {doula.phone} •{' '}
              <Link href={`mailto:${doula.email}`} style={styles.footerLink}>
                {doula.email}
              </Link>
            </Text>
            <Text style={styles.footerMuted}>
              <Link href={urls.website} style={styles.footerLink}>
                Visit our website
              </Link>
              {' • '}
              <Link href={`${urls.portal}/dashboard`} style={styles.footerLink}>
                Client Portal
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Shared styles for email templates
export const styles = {
  body: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f4f4f5',
    margin: 0,
    padding: '20px 0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  header: {
    backgroundColor: '#7c3aed',
    padding: '24px',
    textAlign: 'center' as const,
  },
  logoText: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
  content: {
    padding: '32px 24px',
  },
  heading: {
    color: '#18181b',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    margin: '0 0 16px 0',
    lineHeight: '1.3',
  },
  subheading: {
    color: '#3f3f46',
    fontSize: '18px',
    fontWeight: '600',
    margin: '24px 0 12px 0',
  },
  paragraph: {
    color: '#3f3f46',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  muted: {
    color: '#71717a',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
  },
  button: {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: '#f4f4f5',
    color: '#18181b',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
    display: 'inline-block',
    border: '1px solid #e4e4e7',
  },
  link: {
    color: '#7c3aed',
    textDecoration: 'underline',
  },
  infoBox: {
    backgroundColor: '#faf5ff',
    border: '1px solid #e9d5ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
  },
  detailRow: {
    display: 'flex',
    marginBottom: '8px',
  },
  detailLabel: {
    color: '#71717a',
    fontSize: '14px',
    width: '120px',
    flexShrink: 0,
  },
  detailValue: {
    color: '#18181b',
    fontSize: '14px',
    fontWeight: '500',
  },
  divider: {
    borderTop: '1px solid #e4e4e7',
    margin: '0',
  },
  footer: {
    padding: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#71717a',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  },
  footerMuted: {
    color: '#a1a1aa',
    fontSize: '12px',
    margin: 0,
  },
  footerLink: {
    color: '#7c3aed',
    textDecoration: 'none',
  },
} as const

export type EmailStyles = typeof styles
