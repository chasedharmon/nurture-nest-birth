/**
 * Twilio Webhook Handler
 *
 * Handles incoming webhooks from Twilio for:
 * 1. Message delivery status updates (sent, delivered, failed, etc.)
 * 2. Incoming SMS messages (for opt-out handling)
 *
 * Webhook URL: /api/webhooks/twilio
 * Configure in Twilio Console:
 * - Message Status Callback URL: https://your-domain.com/api/webhooks/twilio
 * - Incoming Message Webhook: https://your-domain.com/api/webhooks/twilio
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/sms/twilio'
import { updateDeliveryStatus } from '@/lib/sms/tracking'

// =====================================================
// Types for Twilio Webhooks
// =====================================================

interface TwilioStatusCallback {
  MessageSid: string
  MessageStatus:
    | 'accepted'
    | 'queued'
    | 'sending'
    | 'sent'
    | 'delivered'
    | 'undelivered'
    | 'failed'
  To: string
  From: string
  ErrorCode?: string
  ErrorMessage?: string
  AccountSid: string
}

interface TwilioIncomingMessage {
  MessageSid: string
  From: string
  To: string
  Body: string
  AccountSid: string
  NumMedia: string
  NumSegments: string
}

// Opt-out keywords that Twilio handles automatically, but we track
const OPT_OUT_KEYWORDS = [
  'STOP',
  'STOPALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
]
const OPT_IN_KEYWORDS = ['START', 'YES', 'UNSTOP', 'SUBSCRIBE']

// =====================================================
// Main Handler
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Parse form data (Twilio sends as application/x-www-form-urlencoded)
    const formData = await request.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('x-twilio-signature') || ''
      const url = request.url

      const isValid = await verifyWebhookSignature(signature, url, params)

      if (!isValid) {
        console.error('[Twilio Webhook] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Determine webhook type and handle accordingly
    if (params.MessageStatus) {
      // This is a status callback
      return handleStatusCallback(params as unknown as TwilioStatusCallback)
    } else if (params.Body) {
      // This is an incoming message
      return handleIncomingMessage(params as unknown as TwilioIncomingMessage)
    } else {
      console.log('[Twilio Webhook] Unknown webhook type:', Object.keys(params))
      return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('[Twilio Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// Status Callback Handler
// =====================================================

async function handleStatusCallback(
  payload: TwilioStatusCallback
): Promise<NextResponse> {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = payload

  console.log('[Twilio Webhook] Status update:', {
    messageId: MessageSid,
    status: MessageStatus,
    errorCode: ErrorCode,
  })

  const supabase = createAdminClient()

  // Find the message in our database
  const { data: message, error: findError } = await supabase
    .from('sms_messages')
    .select('id, org_id, status')
    .eq('external_id', MessageSid)
    .single()

  if (findError || !message) {
    // Message not found - might be from before tracking, or a test
    console.log('[Twilio Webhook] Message not found:', MessageSid)
    return NextResponse.json({ received: true, found: false })
  }

  // Map Twilio status to our status
  const statusMap: Record<string, string> = {
    accepted: 'queued',
    queued: 'queued',
    sending: 'sending',
    sent: 'sent',
    delivered: 'delivered',
    undelivered: 'undelivered',
    failed: 'failed',
  }

  const newStatus = statusMap[MessageStatus] || MessageStatus

  // Update message status
  const { error: updateError } = await supabase
    .from('sms_messages')
    .update({
      status: newStatus,
      status_updated_at: new Date().toISOString(),
      delivered_at:
        newStatus === 'delivered' ? new Date().toISOString() : undefined,
      error_code: ErrorCode || null,
      error_message: ErrorMessage || null,
    })
    .eq('id', message.id)

  if (updateError) {
    console.error('[Twilio Webhook] Failed to update message:', updateError)
  }

  // Update usage tracking for delivery/failure
  if (message.org_id && (newStatus === 'delivered' || newStatus === 'failed')) {
    await updateDeliveryStatus(
      message.org_id,
      newStatus === 'delivered',
      newStatus === 'failed'
    )
  }

  return NextResponse.json({
    received: true,
    messageId: message.id,
    status: newStatus,
  })
}

// =====================================================
// Incoming Message Handler (Opt-out/Opt-in)
// =====================================================

async function handleIncomingMessage(
  payload: TwilioIncomingMessage
): Promise<NextResponse> {
  const { From, To, Body } = payload

  console.log('[Twilio Webhook] Incoming message:', {
    from: From,
    to: To,
    bodyLength: Body.length,
  })

  const supabase = createAdminClient()
  const normalizedBody = Body.trim().toUpperCase()

  // Check for opt-out keywords
  if (OPT_OUT_KEYWORDS.includes(normalizedBody)) {
    console.log('[Twilio Webhook] Opt-out request from:', From)

    // Find all consents for this phone number and mark as opted out
    const { error: optOutError } = await supabase
      .from('sms_consent')
      .update({
        opted_in: false,
        opt_out_date: new Date().toISOString(),
        source: 'sms_reply',
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', From)

    if (optOutError) {
      console.error('[Twilio Webhook] Failed to record opt-out:', optOutError)
    }

    // Note: Twilio automatically handles STOP/START responses at the carrier level
    // We just need to track it in our database

    return NextResponse.json({
      received: true,
      action: 'opt_out',
      phone: From,
    })
  }

  // Check for opt-in keywords
  if (OPT_IN_KEYWORDS.includes(normalizedBody)) {
    console.log('[Twilio Webhook] Opt-in request from:', From)

    // Find existing consent records and update to opted in
    const { error: optInError } = await supabase
      .from('sms_consent')
      .update({
        opted_in: true,
        opt_in_date: new Date().toISOString(),
        source: 'sms_reply',
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', From)

    if (optInError) {
      console.error('[Twilio Webhook] Failed to record opt-in:', optInError)
    }

    return NextResponse.json({
      received: true,
      action: 'opt_in',
      phone: From,
    })
  }

  // For other messages, just acknowledge receipt
  // In the future, this could trigger workflow automation for incoming SMS
  console.log('[Twilio Webhook] Regular message received, no action taken')

  return NextResponse.json({
    received: true,
    action: 'none',
  })
}

// =====================================================
// GET handler for webhook verification (optional)
// =====================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Twilio webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}
