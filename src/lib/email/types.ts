/**
 * Email System Types
 *
 * Centralized types for the email notification system.
 */

export type EmailTemplate =
  | 'contact-form'
  | 'magic-link'
  | 'welcome'
  | 'meeting-scheduled'
  | 'meeting-reminder'
  | 'meeting-cancelled'
  | 'document-shared'
  | 'payment-received'
  | 'payment-reminder'
  | 'invoice-sent'

export type NotificationChannel = 'email' | 'sms' // SMS for future

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'

export interface EmailConfig {
  to: string
  subject: string
  template: React.ReactNode
  replyTo?: string
  from?: string
  tags?: string[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Template-specific data types
export interface MagicLinkEmailData {
  recipientName: string
  magicLinkUrl: string
  expiresInHours: number
}

export interface WelcomeEmailData {
  clientName: string
  portalUrl: string
  doulaName: string
  doulaPhone: string
}

export interface MeetingScheduledEmailData {
  clientName: string
  meetingType: string
  meetingTitle?: string
  scheduledAt: Date
  duration: number
  location?: string
  meetingLink?: string
  preparationNotes?: string
  doulaName: string
}

export interface MeetingReminderEmailData {
  clientName: string
  meetingType: string
  meetingTitle?: string
  scheduledAt: Date
  duration: number
  location?: string
  meetingLink?: string
  preparationNotes?: string
  hoursUntil: number
  doulaName: string
}

export interface MeetingCancelledEmailData {
  clientName: string
  meetingType: string
  meetingTitle?: string
  originalDate: Date
  cancellationReason?: string
  doulaName: string
}

export interface DocumentSharedEmailData {
  clientName: string
  documentTitle: string
  documentType: string
  documentDescription?: string
  portalUrl: string
  doulaName: string
}

export interface PaymentReceivedEmailData {
  clientName: string
  amount: number
  paymentMethod: string
  serviceName?: string
  transactionDate: Date
  remainingBalance?: number
  doulaName: string
}

export interface PaymentReminderEmailData {
  clientName: string
  amount: number
  dueDate: Date
  serviceName?: string
  invoiceNumber?: string
  paymentUrl?: string
  doulaName: string
}

export interface InvoiceSentEmailData {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: Date
  lineItems: Array<{ description: string; amount: number }>
  paymentUrl?: string
  doulaName: string
}

// Notification log record
export interface NotificationLogEntry {
  id: string
  clientId?: string
  notificationType: EmailTemplate
  channel: NotificationChannel
  recipient: string
  subject?: string
  status: NotificationStatus
  sentAt?: Date
  errorMessage?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}
