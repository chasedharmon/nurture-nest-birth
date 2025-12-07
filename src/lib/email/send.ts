'use server'

import { Resend } from 'resend'
import { emailConfig } from './config'
import type { EmailConfig, EmailResult } from './types'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send an email using Resend
 *
 * This is the unified email sending function. All email sends
 * should go through this function for consistent handling.
 */
export async function sendEmail(config: EmailConfig): Promise<EmailResult> {
  try {
    const { to, subject, template, replyTo, from, tags } = config

    const { data, error } = await resend.emails.send({
      from: from || `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to,
      subject,
      react: template,
      replyTo: replyTo || emailConfig.replyTo,
      tags: tags?.map(tag => ({ name: tag, value: 'true' })),
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('[Email] Sent successfully:', data?.id)
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('[Email] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email and log to notification_log table
 *
 * Use this for client-facing emails that should be tracked.
 */
export async function sendTrackedEmail(
  config: EmailConfig & {
    clientId?: string
    notificationType: string
  }
): Promise<EmailResult> {
  const result = await sendEmail(config)

  // Log the notification (import dynamically to avoid circular deps)
  try {
    const { logNotification } = await import('@/app/actions/notifications')
    await logNotification({
      clientId: config.clientId,
      notificationType: config.notificationType,
      channel: 'email',
      recipient: config.to,
      subject: config.subject,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error,
      metadata: {
        messageId: result.messageId,
      },
    })
  } catch (logError) {
    // Don't fail the email send if logging fails
    console.error('[Email] Failed to log notification:', logError)
  }

  return result
}
