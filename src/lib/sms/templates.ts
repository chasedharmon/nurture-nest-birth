/**
 * SMS Template Types and Utilities
 *
 * Templates support variable interpolation using {{variable_name}} syntax.
 * Common variables include:
 * - {{first_name}}, {{name}}: Client name
 * - {{doula_name}}: Your business name
 * - {{appointment_date}}, {{appointment_time}}: Meeting details
 * - {{portal_url}}: Client portal link
 */

import { calculateSegments } from './utils'

// =====================================================
// Types
// =====================================================

export type SmsTemplateCategory =
  | 'appointment'
  | 'reminder'
  | 'confirmation'
  | 'follow_up'
  | 'payment'
  | 'general'
  | 'intake'
  | 'welcome'

export interface SmsTemplate {
  id: string
  name: string
  description: string | null
  category: SmsTemplateCategory
  content: string
  available_variables: string[]
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface SmsTemplateFormData {
  name: string
  description?: string
  category: SmsTemplateCategory
  content: string
  is_active: boolean
}

// =====================================================
// Category Configuration
// =====================================================

export const SMS_CATEGORY_LABELS: Record<SmsTemplateCategory, string> = {
  appointment: 'Appointment',
  reminder: 'Reminder',
  confirmation: 'Confirmation',
  follow_up: 'Follow-up',
  payment: 'Payment',
  general: 'General',
  intake: 'Intake',
  welcome: 'Welcome',
}

export const SMS_CATEGORY_COLORS: Record<SmsTemplateCategory, string> = {
  appointment:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  reminder:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  confirmation:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  follow_up:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  payment:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  intake: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  welcome: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

export const SMS_CATEGORY_OPTIONS: Array<{
  value: SmsTemplateCategory
  label: string
}> = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'payment', label: 'Payment' },
  { value: 'intake', label: 'Intake' },
  { value: 'general', label: 'General' },
]

// =====================================================
// Variable Configuration
// =====================================================

export const SMS_AVAILABLE_VARIABLES = [
  { key: 'first_name', label: 'First Name', example: 'Sarah' },
  { key: 'name', label: 'Full Name', example: 'Sarah Johnson' },
  { key: 'doula_name', label: 'Doula/Business Name', example: 'Nurture Nest' },
  { key: 'phone', label: 'Phone Number', example: '(402) 555-1234' },
  {
    key: 'appointment_date',
    label: 'Appointment Date',
    example: 'January 15, 2025',
  },
  { key: 'appointment_time', label: 'Appointment Time', example: '2:00 PM' },
  {
    key: 'service_name',
    label: 'Service Name',
    example: 'Birth Doula Support',
  },
  { key: 'amount_due', label: 'Amount Due', example: '$500.00' },
  { key: 'payment_link', label: 'Payment Link', example: 'https://...' },
  { key: 'portal_url', label: 'Portal URL', example: 'https://...' },
  { key: 'due_date', label: 'Due Date', example: 'March 15, 2025' },
] as const

export type SmsVariable = (typeof SMS_AVAILABLE_VARIABLES)[number]['key']

// =====================================================
// Utility Functions
// =====================================================

/**
 * Extract variable names from a template string
 */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

/**
 * Validate a template's content
 */
export function validateTemplate(content: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: ReturnType<typeof calculateSegments>
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!content.trim()) {
    errors.push('Template content cannot be empty')
  }

  const stats = calculateSegments(content)

  if (stats.charCount > 1600) {
    errors.push('Template exceeds maximum length of 1600 characters')
  }

  if (stats.segments > 1) {
    warnings.push(
      `Message will be sent as ${stats.segments} SMS segments (may increase cost)`
    )
  }

  if (stats.isUnicode) {
    warnings.push(
      'Message contains special characters which reduce SMS capacity'
    )
  }

  // Check for unrecognized variables
  const variables = extractVariables(content)
  const knownVariables = SMS_AVAILABLE_VARIABLES.map(v => v.key)
  const unknownVars = variables.filter(
    v => !knownVariables.includes(v as SmsVariable)
  )
  if (unknownVars.length > 0) {
    warnings.push(`Unknown variables: ${unknownVars.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
  }
}

/**
 * Preview a template with sample data
 */
export function previewTemplate(content: string): string {
  const sampleData: Record<string, string> = {}
  for (const variable of SMS_AVAILABLE_VARIABLES) {
    sampleData[variable.key] = variable.example
  }

  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return sampleData[key] || match
  })
}

// =====================================================
// Default Templates
// =====================================================

export const DEFAULT_SMS_TEMPLATES: Array<
  Omit<SmsTemplate, 'id' | 'created_at' | 'updated_at'>
> = [
  {
    name: 'Appointment Reminder (24h)',
    description: 'Sent 24 hours before an appointment',
    category: 'reminder',
    content:
      'Hi {{first_name}}, this is a reminder of your appointment with {{doula_name}} tomorrow at {{appointment_time}}. Reply CONFIRM to confirm or call us to reschedule.',
    available_variables: ['first_name', 'doula_name', 'appointment_time'],
    is_active: true,
    is_default: true,
  },
  {
    name: 'Appointment Confirmation',
    description: 'Sent when an appointment is booked',
    category: 'confirmation',
    content:
      'Hi {{first_name}}! Your appointment with {{doula_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Looking forward to seeing you!',
    available_variables: [
      'first_name',
      'doula_name',
      'appointment_date',
      'appointment_time',
    ],
    is_active: true,
    is_default: true,
  },
  {
    name: 'Welcome Message',
    description: 'Sent to new clients after booking',
    category: 'welcome',
    content:
      "Welcome to {{doula_name}}, {{first_name}}! We're so excited to support you on your journey. Access your client portal anytime: {{portal_url}}",
    available_variables: ['first_name', 'doula_name', 'portal_url'],
    is_active: true,
    is_default: true,
  },
  {
    name: 'Payment Reminder',
    description: 'Reminder for upcoming or overdue payments',
    category: 'payment',
    content:
      'Hi {{first_name}}, this is a friendly reminder that {{amount_due}} is due for {{service_name}}. Pay securely here: {{payment_link}}',
    available_variables: [
      'first_name',
      'amount_due',
      'service_name',
      'payment_link',
    ],
    is_active: true,
    is_default: true,
  },
  {
    name: 'Intake Form Request',
    description: 'Request to complete intake forms',
    category: 'intake',
    content:
      'Hi {{first_name}}, please complete your intake forms before your first appointment. You can access them in your client portal: {{portal_url}}',
    available_variables: ['first_name', 'portal_url'],
    is_active: true,
    is_default: true,
  },
  {
    name: 'Post-Appointment Follow-up',
    description: 'Sent after an appointment',
    category: 'follow_up',
    content:
      "Hi {{first_name}}, it was wonderful to meet with you today! If you have any questions, don't hesitate to reach out. - {{doula_name}}",
    available_variables: ['first_name', 'doula_name'],
    is_active: true,
    is_default: true,
  },
]
