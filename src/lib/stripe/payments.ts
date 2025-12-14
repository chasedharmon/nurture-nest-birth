/**
 * Stripe Client Invoice Payments
 *
 * Handles Stripe Checkout for client invoices (one-time payments).
 * This is separate from subscription billing - it's for doulas to collect
 * payments from their clients for services.
 *
 * Uses the same Stripe SDK and configuration as the subscription billing.
 */

import { getStripeClient } from './client'

// =====================================================
// Types
// =====================================================

export interface CreateInvoiceCheckoutParams {
  invoiceId: string
  clientEmail: string
  clientName: string
  invoiceNumber: string
  lineItems: Array<{
    description: string
    amount: number // In cents
    quantity?: number
  }>
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface InvoiceCheckoutResult {
  success: boolean
  sessionId?: string
  checkoutUrl?: string
  expiresAt?: string
  error?: string
  stripeNotConfigured?: boolean
}

export interface PaymentIntentDetails {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'canceled'
  paymentMethodType?: string
  receiptUrl?: string
}

// =====================================================
// Invoice Checkout Functions
// =====================================================

/**
 * Create a Stripe Checkout session for a client invoice
 * This creates a one-time payment link for clients to pay their invoice
 */
export async function createInvoiceCheckout(
  params: CreateInvoiceCheckoutParams
): Promise<InvoiceCheckoutResult> {
  const {
    invoiceId,
    clientEmail,
    clientName,
    invoiceNumber,
    lineItems,
    successUrl,
    cancelUrl,
    metadata,
  } = params

  const stripe = getStripeClient()
  if (!stripe) {
    console.log('[Stripe] createInvoiceCheckout - Stripe not configured')
    // Return mock checkout for development
    const mockSessionId = `cs_mock_${Date.now()}_${invoiceId.slice(0, 8)}`
    return {
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: `${successUrl}?session_id=${mockSessionId}&demo=true`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      stripeNotConfigured: true,
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: clientEmail,
      line_items: lineItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.description,
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity || 1,
      })),
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        client_name: clientName,
        type: 'client_invoice',
        ...metadata,
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          client_name: clientName,
        },
      },
    })

    return {
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url || undefined,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
    }
  } catch (error) {
    console.error('[Stripe] Error creating invoice checkout:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create checkout',
    }
  }
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<{
  success: boolean
  session?: {
    id: string
    status: 'open' | 'complete' | 'expired'
    paymentStatus: 'unpaid' | 'paid' | 'no_payment_required'
    paymentIntentId?: string
    customerEmail?: string
    amountTotal: number
    metadata?: Record<string, string>
  }
  error?: string
}> {
  const stripe = getStripeClient()
  if (!stripe) {
    // Return mock session for development
    return {
      success: true,
      session: {
        id: sessionId,
        status: 'complete',
        paymentStatus: 'paid',
        paymentIntentId: `pi_mock_${Date.now()}`,
        amountTotal: 50000,
      },
    }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      success: true,
      session: {
        id: session.id,
        status: session.status as 'open' | 'complete' | 'expired',
        paymentStatus: session.payment_status as
          | 'unpaid'
          | 'paid'
          | 'no_payment_required',
        paymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id,
        customerEmail: session.customer_email || undefined,
        amountTotal: session.amount_total || 0,
        metadata: session.metadata as Record<string, string>,
      },
    }
  } catch (error) {
    console.error('[Stripe] Error retrieving checkout session:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to retrieve session',
    }
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<{
  success: boolean
  paymentIntent?: PaymentIntentDetails
  error?: string
}> {
  const stripe = getStripeClient()
  if (!stripe) {
    // Return mock payment for development
    return {
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        amount: 50000,
        currency: 'usd',
        status: 'succeeded',
        paymentMethodType: 'card',
        receiptUrl: `https://pay.stripe.com/receipts/mock_${Date.now()}`,
      },
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status as PaymentIntentDetails['status'],
        paymentMethodType: paymentIntent.payment_method_types?.[0],
        receiptUrl:
          paymentIntent.latest_charge &&
          typeof paymentIntent.latest_charge !== 'string'
            ? paymentIntent.latest_charge.receipt_url || undefined
            : undefined,
      },
    }
  } catch (error) {
    console.error('[Stripe] Error retrieving payment intent:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to retrieve payment',
    }
  }
}

/**
 * Expire/cancel a checkout session
 */
export async function expireCheckoutSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripeClient()
  if (!stripe) {
    return { success: true }
  }

  try {
    await stripe.checkout.sessions.expire(sessionId)
    return { success: true }
  } catch (error) {
    console.error('[Stripe] Error expiring checkout session:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to expire session',
    }
  }
}

/**
 * Issue a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number, // Optional partial refund amount in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<{
  success: boolean
  refundId?: string
  error?: string
}> {
  const stripe = getStripeClient()
  if (!stripe) {
    return {
      success: true,
      refundId: `re_mock_${Date.now()}`,
    }
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    })
    return { success: true, refundId: refund.id }
  } catch (error) {
    console.error('[Stripe] Error creating refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create refund',
    }
  }
}

// =====================================================
// Webhook Event Types (for client invoice payments)
// =====================================================

export type PaymentWebhookEventType =
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'

export interface PaymentWebhookEvent {
  id: string
  type: PaymentWebhookEventType
  data: {
    object: {
      id: string
      metadata?: Record<string, string>
      [key: string]: unknown
    }
  }
}

/**
 * Check if a checkout session is for a client invoice (vs subscription)
 */
export function isClientInvoiceCheckout(
  metadata: Record<string, string> | undefined
): boolean {
  return metadata?.type === 'client_invoice' || !!metadata?.invoice_id
}

/**
 * Verify Stripe webhook signature for payment events
 * Uses the shared verifyWebhookSignature from client.ts
 */
export async function verifyPaymentWebhookSignature(
  payload: string,
  signature: string
): Promise<{ valid: boolean; event?: PaymentWebhookEvent }> {
  // Dynamic import to avoid circular dependency
  const { verifyWebhookSignature } = await import('./client')

  const event = verifyWebhookSignature(payload, signature)

  if (!event) {
    // In development without webhook secret, parse JSON directly
    if (process.env.NODE_ENV === 'development') {
      try {
        const parsed = JSON.parse(payload)
        return { valid: true, event: parsed as PaymentWebhookEvent }
      } catch {
        return { valid: false }
      }
    }
    return { valid: false }
  }

  return { valid: true, event: event as unknown as PaymentWebhookEvent }
}
