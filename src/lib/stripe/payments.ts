/**
 * Stripe Client Invoice Payments (Rails Only)
 *
 * This handles payment links for client invoices.
 * When ready to go live, add your Stripe credentials to environment variables.
 *
 * Environment Variables Required for Live:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: For client-side
 */

// import Stripe from 'stripe'

// Uncomment when ready to integrate:
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

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
// Stubbed Client Functions
// =====================================================

/**
 * Create a Stripe Checkout session for an invoice
 * STUBBED: Returns mock checkout URL
 */
export async function createInvoiceCheckout(
  params: CreateInvoiceCheckoutParams
): Promise<InvoiceCheckoutResult> {
  const {
    invoiceId,
    clientEmail,
    clientName: _clientName,
    invoiceNumber,
    lineItems,
    successUrl,
    cancelUrl: _cancelUrl,
    metadata: _metadata,
  } = params

  console.log('[Stripe Stub] Creating invoice checkout:', {
    invoiceId,
    invoiceNumber,
    clientEmail,
    itemCount: lineItems.length,
    totalCents: lineItems.reduce(
      (sum, item) => sum + item.amount * (item.quantity || 1),
      0
    ),
  })

  // Calculate expiration (24 hours from now)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // Stubbed: Return mock session
  const mockSessionId = `cs_stub_${Date.now()}_${invoiceId.slice(0, 8)}`

  return {
    success: true,
    sessionId: mockSessionId,
    checkoutUrl: `${successUrl}?session_id=${mockSessionId}&demo=true`,
    expiresAt: expiresAt.toISOString(),
  }

  // Real implementation:
  // try {
  //   const session = await stripe.checkout.sessions.create({
  //     mode: 'payment',
  //     customer_email: clientEmail,
  //     line_items: lineItems.map(item => ({
  //       price_data: {
  //         currency: 'usd',
  //         product_data: {
  //           name: item.description,
  //         },
  //         unit_amount: item.amount,
  //       },
  //       quantity: item.quantity || 1,
  //     })),
  //     success_url: successUrl,
  //     cancel_url: cancelUrl,
  //     metadata: {
  //       invoice_id: invoiceId,
  //       invoice_number: invoiceNumber,
  //       client_name: clientName,
  //       ...metadata,
  //     },
  //     payment_intent_data: {
  //       metadata: {
  //         invoice_id: invoiceId,
  //         invoice_number: invoiceNumber,
  //       },
  //     },
  //   })
  //
  //   return {
  //     success: true,
  //     sessionId: session.id,
  //     checkoutUrl: session.url!,
  //     expiresAt: new Date(session.expires_at * 1000).toISOString(),
  //   }
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
}

/**
 * Retrieve a checkout session by ID
 * STUBBED: Returns mock session data
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
  }
  error?: string
}> {
  console.log('[Stripe Stub] Getting checkout session:', sessionId)

  // Stubbed: Return mock session
  return {
    success: true,
    session: {
      id: sessionId,
      status: 'complete',
      paymentStatus: 'paid',
      paymentIntentId: `pi_stub_${Date.now()}`,
      amountTotal: 50000, // $500.00
    },
  }

  // Real implementation:
  // try {
  //   const session = await stripe.checkout.sessions.retrieve(sessionId)
  //   return {
  //     success: true,
  //     session: {
  //       id: session.id,
  //       status: session.status,
  //       paymentStatus: session.payment_status,
  //       paymentIntentId: session.payment_intent as string,
  //       customerEmail: session.customer_email,
  //       amountTotal: session.amount_total,
  //     },
  //   }
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
}

/**
 * Get payment intent details
 * STUBBED: Returns mock payment data
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<{
  success: boolean
  paymentIntent?: PaymentIntentDetails
  error?: string
}> {
  console.log('[Stripe Stub] Getting payment intent:', paymentIntentId)

  // Stubbed: Return mock payment
  return {
    success: true,
    paymentIntent: {
      id: paymentIntentId,
      amount: 50000,
      currency: 'usd',
      status: 'succeeded',
      paymentMethodType: 'card',
      receiptUrl: `https://pay.stripe.com/receipts/stub_${Date.now()}`,
    },
  }

  // Real implementation:
  // try {
  //   const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  //   return {
  //     success: true,
  //     paymentIntent: {
  //       id: paymentIntent.id,
  //       amount: paymentIntent.amount,
  //       currency: paymentIntent.currency,
  //       status: paymentIntent.status,
  //       paymentMethodType: paymentIntent.payment_method_types?.[0],
  //       receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
  //     },
  //   }
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
}

/**
 * Expire/cancel a checkout session
 * STUBBED: Logs action
 */
export async function expireCheckoutSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[Stripe Stub] Expiring checkout session:', sessionId)

  // Stubbed
  return { success: true }

  // Real implementation:
  // try {
  //   await stripe.checkout.sessions.expire(sessionId)
  //   return { success: true }
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
}

/**
 * Issue a refund for a payment
 * STUBBED: Logs action
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
  console.log('[Stripe Stub] Creating refund:', {
    paymentIntentId,
    amount,
    reason,
  })

  // Stubbed
  return {
    success: true,
    refundId: `re_stub_${Date.now()}`,
  }

  // Real implementation:
  // try {
  //   const refund = await stripe.refunds.create({
  //     payment_intent: paymentIntentId,
  //     amount,
  //     reason,
  //   })
  //   return { success: true, refundId: refund.id }
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
}

// =====================================================
// Webhook Event Types
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
 * Verify Stripe webhook signature
 * STUBBED: Always returns true in development
 */
export function verifyPaymentWebhookSignature(
  _payload: string,
  _signature: string
): { valid: boolean; event?: PaymentWebhookEvent } {
  console.log('[Stripe Stub] Verifying payment webhook signature')

  // Stubbed: Always valid in dev
  return { valid: true }

  // Real implementation:
  // try {
  //   const event = stripe.webhooks.constructEvent(
  //     payload,
  //     signature,
  //     process.env.STRIPE_WEBHOOK_SECRET!
  //   ) as PaymentWebhookEvent
  //   return { valid: true, event }
  // } catch (err) {
  //   return { valid: false }
  // }
}
