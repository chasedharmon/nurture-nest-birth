import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  verifyPaymentWebhookSignature,
  type PaymentWebhookEventType,
} from '@/lib/stripe/payments'

/**
 * Stripe Payment Webhook Handler
 *
 * Handles webhook events for client invoice payments.
 * When a client pays an invoice via Stripe Checkout, this endpoint
 * receives events to update the invoice status.
 *
 * STUBBED: In development, signature verification is bypassed.
 * For production, ensure STRIPE_WEBHOOK_SECRET is set.
 */

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    // Verify webhook signature (stubbed in development)
    const { valid, event } = verifyPaymentWebhookSignature(body, signature)

    if (!valid) {
      console.error('[Payment Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Parse the event if not provided by verification
    const webhookEvent = event || JSON.parse(body)
    const eventType = webhookEvent.type as PaymentWebhookEventType
    const eventData = webhookEvent.data.object

    console.log('[Payment Webhook] Received event:', {
      id: webhookEvent.id,
      type: eventType,
    })

    // Log the event for audit trail
    await supabase.from('payment_events').insert({
      stripe_event_id: webhookEvent.id,
      stripe_event_type: eventType,
      event_data: webhookEvent,
      processed: false,
    })

    // Process based on event type
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(supabase, eventData)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(supabase, eventData)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, eventData)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, eventData)
        break

      case 'charge.refunded':
        await handleChargeRefunded(supabase, eventData)
        break

      default:
        console.log('[Payment Webhook] Unhandled event type:', eventType)
    }

    // Mark event as processed
    await supabase
      .from('payment_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', webhookEvent.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Payment Webhook] Error:', error)

    // Log the error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    await supabase.from('payment_events').insert({
      stripe_event_id: `error_${Date.now()}`,
      stripe_event_type: 'error',
      event_data: { error: errorMessage },
      processed: false,
      error_message: errorMessage,
    })

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutComplete(
  supabase: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
) {
  const invoiceId = session.metadata?.invoice_id
  const paymentIntentId = session.payment_intent

  if (!invoiceId) {
    console.warn('[Payment Webhook] No invoice_id in session metadata')
    return
  }

  console.log('[Payment Webhook] Processing checkout complete:', {
    invoiceId,
    paymentIntentId,
    amountTotal: session.amount_total,
  })

  // Update invoice to paid
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      amount_paid: session.amount_total / 100, // Convert from cents
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (error) {
    console.error('[Payment Webhook] Failed to update invoice:', error)
    throw error
  }

  // Get invoice details for activity logging
  const { data: invoice } = await supabase
    .from('invoices')
    .select('client_id, invoice_number, service_id')
    .eq('id', invoiceId)
    .single()

  if (invoice) {
    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: invoice.client_id,
      activity_type: 'payment',
      content: `Invoice ${invoice.invoice_number} paid via Stripe`,
      activity_category: 'financial',
      related_record_type: 'invoice',
      related_record_id: invoiceId,
    })

    // Update service payment status if linked
    if (invoice.service_id) {
      await supabase
        .from('client_services')
        .update({ payment_status: 'paid' })
        .eq('id', invoice.service_id)
    }
  }

  console.log('[Payment Webhook] Invoice updated to paid:', invoiceId)
}

async function handleCheckoutExpired(
  supabase: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
) {
  const invoiceId = session.metadata?.invoice_id

  if (!invoiceId) {
    return
  }

  console.log('[Payment Webhook] Checkout expired for invoice:', invoiceId)

  // Clear checkout session from invoice
  await supabase
    .from('invoices')
    .update({
      stripe_checkout_session_id: null,
      checkout_url: null,
      checkout_expires_at: null,
    })
    .eq('id', invoiceId)
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentIntent: any
) {
  const invoiceId = paymentIntent.metadata?.invoice_id

  if (!invoiceId) {
    return
  }

  console.log('[Payment Webhook] Payment succeeded:', {
    invoiceId,
    amount: paymentIntent.amount,
  })

  // Update invoice (may already be updated by checkout.session.completed)
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      amount_paid: paymentIntent.amount / 100,
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('status', 'pending') // Only update if still pending
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentIntent: any
) {
  const invoiceId = paymentIntent.metadata?.invoice_id

  if (!invoiceId) {
    return
  }

  console.log('[Payment Webhook] Payment failed:', {
    invoiceId,
    error: paymentIntent.last_payment_error?.message,
  })

  // Get invoice for activity logging
  const { data: invoice } = await supabase
    .from('invoices')
    .select('client_id, invoice_number')
    .eq('id', invoiceId)
    .single()

  if (invoice) {
    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: invoice.client_id,
      activity_type: 'payment',
      content: `Payment failed for invoice ${invoice.invoice_number}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
      activity_category: 'financial',
      related_record_type: 'invoice',
      related_record_id: invoiceId,
    })
  }
}

async function handleChargeRefunded(
  supabase: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  charge: any
) {
  const paymentIntentId = charge.payment_intent

  if (!paymentIntentId) {
    return
  }

  console.log('[Payment Webhook] Charge refunded:', {
    chargeId: charge.id,
    paymentIntentId,
    amountRefunded: charge.amount_refunded,
  })

  // Find invoice by payment intent
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, client_id, invoice_number, total')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (!invoice) {
    return
  }

  // Determine new status based on refund amount
  const refundedAmount = charge.amount_refunded / 100
  const isFullRefund = refundedAmount >= invoice.total

  await supabase
    .from('invoices')
    .update({
      status: isFullRefund ? 'refunded' : 'partial_refund',
      amount_paid: invoice.total - refundedAmount,
    })
    .eq('id', invoice.id)

  // Log activity
  await supabase.from('lead_activities').insert({
    lead_id: invoice.client_id,
    activity_type: 'payment',
    content: `${isFullRefund ? 'Full' : 'Partial'} refund issued for invoice ${invoice.invoice_number} ($${refundedAmount.toFixed(2)})`,
    activity_category: 'financial',
    related_record_type: 'invoice',
    related_record_id: invoice.id,
  })
}
