/**
 * SMS Utility Functions
 *
 * These are pure functions with no server-side dependencies.
 * Safe to import in both client and server components.
 */

// =====================================================
// Constants
// =====================================================

export const SMS_CHAR_LIMIT = 160
export const SMS_EXTENDED_LIMIT = 1600 // Max for concatenated SMS

// =====================================================
// Utility Functions
// =====================================================

/**
 * Calculate the number of SMS segments a message will use
 * Standard SMS is 160 chars (or 70 for Unicode)
 */
export function calculateSegments(text: string): {
  segments: number
  charCount: number
  remaining: number
  isUnicode: boolean
} {
  // Check if message contains Unicode characters
  const isUnicode = /[^\x00-\x7F]/.test(text)
  const charLimit = isUnicode ? 70 : 160
  const multipartLimit = isUnicode ? 67 : 153 // Headers reduce available chars

  const charCount = text.length

  let segments: number
  if (charCount <= charLimit) {
    segments = 1
  } else {
    segments = Math.ceil(charCount / multipartLimit)
  }

  const remaining =
    segments === 1
      ? charLimit - charCount
      : multipartLimit - (charCount % multipartLimit)

  return {
    segments,
    charCount,
    remaining: Math.max(0, remaining),
    isUnicode,
  }
}

/**
 * Format a phone number to E.164 format (required by Twilio)
 * Assumes US numbers if no country code provided
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '')

  // If already has country code (11+ digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  // If 10 digits, assume US
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // If already has full international format
  if (digits.length > 10) {
    return `+${digits}`
  }

  // Return as-is if we can't parse
  return phone
}

/**
 * Validate a phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // Basic E.164 validation: + followed by 10-15 digits
  return /^\+[1-9]\d{9,14}$/.test(formatted)
}

/**
 * Interpolate template variables in a message
 * Supports {{variable_name}} syntax
 */
export function interpolateVariables(
  template: string,
  data: Record<string, unknown>
): string {
  if (!template) return template

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    if (value === undefined || value === null) {
      return match // Keep the placeholder if no value
    }
    return String(value)
  })
}
