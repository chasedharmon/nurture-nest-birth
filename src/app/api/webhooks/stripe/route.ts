/**
 * Stripe Webhook Handler (Rails Only)
 *
 * This is a stubbed implementation for SaaS billing webhooks.
 * When ready to go live, uncomment the Stripe SDK integration
 * and update the database sync logic.
 *
 * Environment Variables Required for Live:
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialize Supabase client for service role operations
// Currently stubbed - will be used when Stripe is fully integrated
let supabaseClient: SupabaseClient | null = null

/**
 * Get Supabase client for webhook operations
 * Exported for future use when Stripe integration is enabled
 */
export function getWebhookSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error('Supabase environment variables are not set')
    }
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabaseClient
}

// =====================================================
// Stripe Event Types
// =====================================================

interface StripeEvent {
  id: string
  type: string
  created: number
  data: {
    object: Record<string, unknown>
  }
}

// =====================================================
// Webhook Handler
// =====================================================

export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] Received webhook request')

  try {
    const body = await request.text()
    // Will be used when Stripe webhook verification is enabled
    // const signature = request.headers.get('stripe-signature')

    // In production, verify the webhook signature
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    // if (!webhookSecret) {
    //   console.error('[Stripe Webhook] No webhook secret configured')
    //   return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    // }
    //
    // try {
    //   event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
    // } catch (err) {
    //   console.error('[Stripe Webhook] Signature verification failed:', err)
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    // }

    // Stubbed: Parse the body as JSON for logging/testing
    let event: StripeEvent
    try {
      event = JSON.parse(body)
    } catch {
      console.error('[Stripe Webhook] Invalid JSON payload')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    console.log(`[Stripe Webhook] Event type: ${event.type}`)
    console.log(`[Stripe Webhook] Event ID: ${event.id}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event)
        break

      case 'customer.created':
        await handleCustomerCreated(event)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// =====================================================
// Event Handlers (Stubbed)
// =====================================================

async function handleCheckoutCompleted(event: StripeEvent) {
  const session = event.data.object as {
    id: string
    customer: string
    subscription: string
    metadata?: { organization_id?: string }
  }

  console.log('[Stripe Webhook] Checkout completed:', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    organizationId: session.metadata?.organization_id,
  })

  // In production:
  // 1. Look up organization by metadata.organization_id
  // 2. Update organization with stripe_customer_id and stripe_subscription_id
  // 3. Update subscription_tier based on the plan purchased
  // 4. Update subscription_status to 'active'

  if (session.metadata?.organization_id) {
    console.log(
      `[Stripe Webhook] Would update organization ${session.metadata.organization_id} with:`,
      {
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        subscription_status: 'active',
      }
    )

    // Stubbed database update
    // await getSupabase()
    //   .from('organizations')
    //   .update({
    //     stripe_customer_id: session.customer,
    //     stripe_subscription_id: session.subscription,
    //     subscription_status: 'active',
    //     subscription_tier: determineTierFromPrice(session),
    //   })
    //   .eq('id', session.metadata.organization_id)
  }
}

async function handleSubscriptionCreated(event: StripeEvent) {
  const subscription = event.data.object as {
    id: string
    customer: string
    status: string
    current_period_end: number
    items: { data: Array<{ price: { id: string; product: string } }> }
  }

  console.log('[Stripe Webhook] Subscription created:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  })

  // In production:
  // 1. Look up organization by stripe_customer_id
  // 2. Update subscription details
}

async function handleSubscriptionUpdated(event: StripeEvent) {
  const subscription = event.data.object as {
    id: string
    customer: string
    status: string
    current_period_end: number
    cancel_at_period_end: boolean
    items: { data: Array<{ price: { id: string; product: string } }> }
  }

  console.log('[Stripe Webhook] Subscription updated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  })

  // In production:
  // 1. Look up organization by stripe_subscription_id
  // 2. Update subscription_status
  // 3. Update current_period_end
  // 4. Handle plan changes (tier upgrades/downgrades)

  // Stubbed database update
  // const { error } = await getSupabase()
  //   .from('organizations')
  //   .update({
  //     subscription_status: mapStripeStatus(subscription.status),
  //     current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  //   })
  //   .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(event: StripeEvent) {
  const subscription = event.data.object as {
    id: string
    customer: string
  }

  console.log('[Stripe Webhook] Subscription deleted:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  })

  // In production:
  // 1. Look up organization by stripe_subscription_id
  // 2. Downgrade to starter tier
  // 3. Update subscription_status to 'canceled'

  // Stubbed database update
  // await getSupabase()
  //   .from('organizations')
  //   .update({
  //     subscription_tier: 'starter',
  //     subscription_status: 'canceled',
  //     stripe_subscription_id: null,
  //   })
  //   .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaid(event: StripeEvent) {
  const invoice = event.data.object as {
    id: string
    customer: string
    subscription: string
    amount_paid: number
    currency: string
    hosted_invoice_url: string
    invoice_pdf: string
  }

  console.log('[Stripe Webhook] Invoice paid:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_paid,
    currency: invoice.currency,
  })

  // In production:
  // 1. Record invoice in billing_history table (if you have one)
  // 2. Send receipt email
  // 3. Update subscription_status to 'active' if it was past_due
}

async function handleInvoicePaymentFailed(event: StripeEvent) {
  const invoice = event.data.object as {
    id: string
    customer: string
    subscription: string
    attempt_count: number
    next_payment_attempt: number | null
  }

  console.log('[Stripe Webhook] Invoice payment failed:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    attemptCount: invoice.attempt_count,
    nextAttempt: invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000).toISOString()
      : null,
  })

  // In production:
  // 1. Update subscription_status to 'past_due'
  // 2. Send payment failed notification email
  // 3. Consider grace period before downgrading

  // Stubbed database update
  // await getSupabase()
  //   .from('organizations')
  //   .update({
  //     subscription_status: 'past_due',
  //   })
  //   .eq('stripe_customer_id', invoice.customer)
}

async function handleCustomerCreated(event: StripeEvent) {
  const customer = event.data.object as {
    id: string
    email: string
    name: string
    metadata?: { organization_id?: string }
  }

  console.log('[Stripe Webhook] Customer created:', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    organizationId: customer.metadata?.organization_id,
  })
}

async function handleCustomerUpdated(event: StripeEvent) {
  const customer = event.data.object as {
    id: string
    email: string
    name: string
  }

  console.log('[Stripe Webhook] Customer updated:', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
  })
}

// =====================================================
// Helper Functions (Exported for future use when Stripe is enabled)
// =====================================================

/**
 * Map Stripe subscription status to our internal status
 */
export function mapStripeStatus(
  stripeStatus: string
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive' {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'canceled'
    default:
      return 'inactive'
  }
}

/**
 * Determine tier from Stripe price ID
 * Update this mapping when you create products in Stripe
 */
export function determineTierFromPrice(priceId: string): string {
  // In production, map your Stripe price IDs to tiers
  if (priceId.includes('enterprise')) return 'enterprise'
  if (priceId.includes('professional')) return 'professional'
  return 'starter'
}
