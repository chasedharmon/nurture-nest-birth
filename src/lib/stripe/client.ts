/**
 * Stripe Client Library
 *
 * Provides Stripe SDK integration with graceful fallbacks when not configured.
 * All functions check for Stripe configuration and return helpful errors if missing.
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_xxx or sk_test_xxx)
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Publishable key for client-side
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret (whsec_xxx)
 */

import Stripe from 'stripe'
import {
  getStripePriceId,
  getTierFromPriceId,
  isStripeConfigured as hasPriceIds,
  type SubscriptionTier,
  type BillingPeriod,
} from '@/config/pricing'
import type {
  StripeSubscription,
  StripeInvoice,
  StripePaymentMethod,
  CheckoutSessionResult,
  PortalSessionResult,
  CreateCheckoutSessionParams,
  CreatePortalSessionParams,
  StripeConfigStatus,
} from '@/types/billing'

// =====================================================
// Configuration & Initialization
// =====================================================

let stripeClient: Stripe | null = null

/**
 * Check Stripe configuration status
 */
export function getStripeConfigStatus(): StripeConfigStatus {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET

  const missingKeys: string[] = []
  if (!hasSecretKey) missingKeys.push('STRIPE_SECRET_KEY')
  if (!hasPublishableKey) missingKeys.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  if (!hasWebhookSecret) missingKeys.push('STRIPE_WEBHOOK_SECRET')

  return {
    isConfigured: hasSecretKey && hasPublishableKey,
    hasSecretKey,
    hasPublishableKey,
    hasWebhookSecret,
    hasPriceIds: hasPriceIds(),
    missingKeys,
  }
}

/**
 * Check if Stripe is fully configured for production use
 */
export function isStripeReady(): boolean {
  const status = getStripeConfigStatus()
  return status.isConfigured && status.hasPriceIds
}

/**
 * Get or initialize the Stripe client
 * Returns null if STRIPE_SECRET_KEY is not set
 */
export function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Stripe] STRIPE_SECRET_KEY not set. Billing features will return mock data.'
      )
    }
    return null
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  })

  return stripeClient
}

/**
 * Ensure Stripe is configured, or return an error result
 */
function requireStripe(): { stripe: Stripe } | { error: string } {
  const stripe = getStripeClient()
  if (!stripe) {
    return {
      error:
        'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.',
    }
  }
  return { stripe }
}

// =====================================================
// Customer Management
// =====================================================

/**
 * Create a Stripe customer for an organization
 */
export async function createCustomer(
  organizationId: string,
  email: string,
  name: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  const result = requireStripe()
  if ('error' in result) {
    console.log('[Stripe] createCustomer called but Stripe not configured')
    return { success: false, error: result.error }
  }

  try {
    const customer = await result.stripe.customers.create({
      email,
      name,
      metadata: {
        organization_id: organizationId,
      },
    })

    return { success: true, customerId: customer.id }
  } catch (error) {
    console.error('[Stripe] Error creating customer:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create customer',
    }
  }
}

/**
 * Update a Stripe customer
 */
export async function updateCustomer(
  customerId: string,
  data: { email?: string; name?: string }
): Promise<{ success: boolean; error?: string }> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  try {
    await result.stripe.customers.update(customerId, data)
    return { success: true }
  } catch (error) {
    console.error('[Stripe] Error updating customer:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update customer',
    }
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(
  customerId: string
): Promise<{ success: boolean; customer?: Stripe.Customer; error?: string }> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  try {
    const customer = await result.stripe.customers.retrieve(customerId)
    if (customer.deleted) {
      return { success: false, error: 'Customer has been deleted' }
    }
    return { success: true, customer: customer as Stripe.Customer }
  } catch (error) {
    console.error('[Stripe] Error retrieving customer:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to retrieve customer',
    }
  }
}

// =====================================================
// Checkout Sessions
// =====================================================

/**
 * Create a checkout session for subscribing to a plan
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error, stripeNotConfigured: true }
  }

  const priceId = getStripePriceId(params.tier, params.billingPeriod)
  if (!priceId) {
    return {
      success: false,
      error: `Price ID not configured for ${params.tier} ${params.billingPeriod}. Please add Stripe price IDs to src/config/pricing.ts`,
    }
  }

  try {
    const session = await result.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      metadata: {
        organization_id: params.organizationId,
        tier: params.tier,
        billing_period: params.billingPeriod,
      },
      subscription_data: {
        metadata: {
          organization_id: params.organizationId,
          tier: params.tier,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return {
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url || undefined,
    }
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create checkout session',
    }
  }
}

/**
 * Create a billing portal session for managing subscription
 */
export async function createPortalSession(
  params: CreatePortalSessionParams & { customerId: string }
): Promise<PortalSessionResult> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  try {
    const session = await result.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    })

    return {
      success: true,
      portalUrl: session.url,
    }
  } catch (error) {
    console.error('[Stripe] Error creating portal session:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create portal session',
    }
  }
}

// =====================================================
// Subscription Management
// =====================================================

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<StripeSubscription | null> {
  const result = requireStripe()
  if ('error' in result) {
    console.log('[Stripe] getSubscription called but Stripe not configured')
    return null
  }

  try {
    const subscription =
      await result.stripe.subscriptions.retrieve(subscriptionId)

    // Access properties safely using type casting for SDK v20 compatibility
    const subData = subscription as unknown as Record<string, unknown>
    const currentPeriodStart = (subData.currentPeriodStart ??
      subData.current_period_start) as number
    const currentPeriodEnd = (subData.currentPeriodEnd ??
      subData.current_period_end) as number
    const cancelAtPeriodEnd = (subData.cancelAtPeriodEnd ??
      subData.cancel_at_period_end) as boolean
    const canceledAt = (subData.canceledAt ?? subData.canceled_at) as
      | number
      | null
    const defaultPaymentMethod =
      subData.defaultPaymentMethod ?? subData.default_payment_method

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id,
        productId:
          typeof item.price.product === 'string'
            ? item.price.product
            : item.price.product.id,
        quantity: item.quantity || 1,
      })),
      defaultPaymentMethod:
        typeof defaultPaymentMethod === 'string'
          ? defaultPaymentMethod
          : (defaultPaymentMethod as { id: string } | null)?.id || null,
    }
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error)
    return null
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  try {
    await result.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    return { success: true }
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to cancel subscription',
    }
  }
}

/**
 * Resume a canceled subscription (before period ends)
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  try {
    await result.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return { success: true }
  } catch (error) {
    console.error('[Stripe] Error resuming subscription:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to resume subscription',
    }
  }
}

/**
 * Change subscription to a different plan
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newTier: SubscriptionTier,
  billingPeriod: BillingPeriod
): Promise<{ success: boolean; error?: string }> {
  const result = requireStripe()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  const newPriceId = getStripePriceId(newTier, billingPeriod)
  if (!newPriceId) {
    return {
      success: false,
      error: `Price ID not configured for ${newTier} ${billingPeriod}`,
    }
  }

  try {
    const subscription =
      await result.stripe.subscriptions.retrieve(subscriptionId)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return { success: false, error: 'No subscription item found' }
    }

    await result.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: itemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })

    return { success: true }
  } catch (error) {
    console.error('[Stripe] Error changing subscription plan:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change plan',
    }
  }
}

// =====================================================
// Invoice Management
// =====================================================

/**
 * List invoices for a customer
 */
export async function listInvoices(
  customerId: string,
  limit: number = 10
): Promise<StripeInvoice[]> {
  const result = requireStripe()
  if ('error' in result) {
    // Return mock invoices when Stripe is not configured (for demo/development)
    console.log(
      '[Stripe] listInvoices returning mock data - Stripe not configured'
    )
    return getMockInvoices()
  }

  try {
    const invoices = await result.stripe.invoices.list({
      customer: customerId,
      limit,
    })

    // Access properties safely using type casting for SDK v20 compatibility
    return invoices.data.map(inv => {
      const invData = inv as unknown as Record<string, unknown>
      return {
        id: inv.id,
        number: inv.number,
        status: inv.status as StripeInvoice['status'],
        amountDue: (invData.amountDue ?? invData.amount_due ?? 0) as number,
        amountPaid: (invData.amountPaid ?? invData.amount_paid ?? 0) as number,
        currency: inv.currency,
        created: inv.created,
        dueDate:
          ((invData.dueDate ?? invData.due_date) as number | null) || null,
        invoicePdf:
          ((invData.invoicePdf ?? invData.invoice_pdf) as string | null) ||
          null,
        hostedInvoiceUrl:
          ((invData.hostedInvoiceUrl ?? invData.hosted_invoice_url) as
            | string
            | null) || null,
      }
    })
  } catch (error) {
    console.error('[Stripe] Error listing invoices:', error)
    return []
  }
}

/**
 * Get upcoming invoice preview
 * Uses Stripe's preview API (SDK v20+)
 */
export async function getUpcomingInvoice(
  customerId: string
): Promise<StripeInvoice | null> {
  const result = requireStripe()
  if ('error' in result) {
    return null
  }

  try {
    // Use createPreview for SDK v20+
    const invoice = await result.stripe.invoices.createPreview({
      customer: customerId,
    })

    // Access properties safely using type casting for SDK v20 compatibility
    const invData = invoice as unknown as Record<string, unknown>
    const amountDue = (invData.amountDue ?? invData.amount_due ?? 0) as number
    const dueDate =
      ((invData.dueDate ?? invData.due_date) as number | null) || null

    return {
      id: 'upcoming',
      number: null,
      status: 'draft',
      amountDue,
      amountPaid: 0,
      currency: invoice.currency,
      created: invoice.created,
      dueDate,
      invoicePdf: null,
      hostedInvoiceUrl: null,
    }
  } catch {
    // No upcoming invoice is not an error
    return null
  }
}

// =====================================================
// Payment Methods
// =====================================================

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string
): Promise<StripePaymentMethod[]> {
  const result = requireStripe()
  if ('error' in result) {
    return getMockPaymentMethods()
  }

  try {
    const [customer, paymentMethods] = await Promise.all([
      result.stripe.customers.retrieve(customerId),
      result.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      }),
    ])

    const defaultPaymentMethod =
      !customer.deleted &&
      typeof customer.invoice_settings.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : null

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type as 'card',
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : undefined,
      isDefault: pm.id === defaultPaymentMethod,
    }))
  } catch (error) {
    console.error('[Stripe] Error listing payment methods:', error)
    return []
  }
}

// =====================================================
// Webhook Signature Verification
// =====================================================

/**
 * Verify Stripe webhook signature
 * Returns the verified event or null if verification fails
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripe = getStripeClient()

  if (!stripe) {
    console.warn('[Stripe] Cannot verify webhook - Stripe not configured')
    return null
  }

  if (!webhookSecret) {
    console.warn(
      '[Stripe] Cannot verify webhook - STRIPE_WEBHOOK_SECRET not set'
    )
    // In development, we might still want to process webhooks for testing
    if (process.env.NODE_ENV === 'development') {
      try {
        return JSON.parse(payload.toString()) as Stripe.Event
      } catch {
        return null
      }
    }
    return null
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error)
    return null
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Map Stripe subscription status to internal status
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused' {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'cancelled'
    case 'paused':
      return 'paused'
    case 'incomplete':
    default:
      return 'past_due'
  }
}

/**
 * Get tier from a Stripe price ID (re-exported from pricing config)
 */
export { getTierFromPriceId }

// =====================================================
// Mock Data (for development without Stripe)
// =====================================================

function getMockInvoices(): StripeInvoice[] {
  const now = Math.floor(Date.now() / 1000)
  return [
    {
      id: 'in_mock_001',
      number: 'NNB-0001',
      status: 'paid',
      amountDue: 7900,
      amountPaid: 7900,
      currency: 'usd',
      created: now - 30 * 24 * 60 * 60,
      dueDate: null,
      invoicePdf: null,
      hostedInvoiceUrl: null,
    },
    {
      id: 'in_mock_002',
      number: 'NNB-0002',
      status: 'paid',
      amountDue: 7900,
      amountPaid: 7900,
      currency: 'usd',
      created: now - 60 * 24 * 60 * 60,
      dueDate: null,
      invoicePdf: null,
      hostedInvoiceUrl: null,
    },
  ]
}

function getMockPaymentMethods(): StripePaymentMethod[] {
  return [
    {
      id: 'pm_mock_001',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2026,
      },
      isDefault: true,
    },
  ]
}

// =====================================================
// Exports for backwards compatibility
// =====================================================

export type {
  StripeSubscription,
  StripeInvoice,
  StripePaymentMethod,
  CheckoutSessionResult,
  PortalSessionResult,
}
