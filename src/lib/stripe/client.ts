/**
 * Stripe Client Library (Rails Only)
 *
 * This is a stubbed implementation for SaaS billing infrastructure.
 * When ready to go live, add your Stripe secret key to environment variables
 * and uncomment the Stripe SDK integration.
 *
 * Environment Variables Required for Live:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 * - STRIPE_PUBLISHABLE_KEY: For client-side (in NEXT_PUBLIC_)
 */

// import Stripe from 'stripe'

// Uncomment when ready to integrate:
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

// =====================================================
// Types
// =====================================================

export interface CreateCheckoutSessionParams {
  organizationId: string
  planId: string
  billingPeriod: 'monthly' | 'yearly'
  successUrl: string
  cancelUrl: string
}

export interface CreatePortalSessionParams {
  organizationId: string
  returnUrl: string
}

export interface StripeCustomer {
  id: string
  email: string
  name: string
}

export interface StripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid'
  current_period_end: number
  cancel_at_period_end: boolean
  items: {
    price_id: string
    product_id: string
  }[]
}

export interface StripeInvoice {
  id: string
  number: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  amount_due: number
  amount_paid: number
  currency: string
  created: number
  invoice_pdf: string | null
  hosted_invoice_url: string | null
}

// =====================================================
// Stubbed Client Functions
// =====================================================

/**
 * Create a Stripe customer for an organization
 * STUBBED: Returns mock data, logs action
 */
export async function createCustomer(
  organizationId: string,
  email: string,
  name: string
): Promise<{ customerId: string }> {
  console.log('[Stripe Stub] Creating customer:', {
    organizationId,
    email,
    name,
  })

  // Stubbed: Return mock customer ID
  return {
    customerId: `cus_stub_${organizationId.slice(0, 8)}`,
  }

  // Real implementation:
  // const customer = await stripe.customers.create({
  //   email,
  //   name,
  //   metadata: { organization_id: organizationId },
  // })
  // return { customerId: customer.id }
}

/**
 * Create a checkout session for upgrading subscription
 * STUBBED: Returns mock session URL
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ sessionUrl: string }> {
  console.log('[Stripe Stub] Creating checkout session:', params)

  // Stubbed: Return mock URL
  return {
    sessionUrl: `${params.successUrl}?session_id=cs_stub_${Date.now()}`,
  }

  // Real implementation:
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   customer: customerId,
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: params.successUrl,
  //   cancel_url: params.cancelUrl,
  //   metadata: { organization_id: params.organizationId },
  // })
  // return { sessionUrl: session.url! }
}

/**
 * Create a billing portal session for managing subscription
 * STUBBED: Returns mock portal URL
 */
export async function createPortalSession(
  params: CreatePortalSessionParams
): Promise<{ portalUrl: string }> {
  console.log('[Stripe Stub] Creating portal session:', params)

  // Stubbed: Return mock URL
  return {
    portalUrl: `${params.returnUrl}?portal=stub`,
  }

  // Real implementation:
  // const session = await stripe.billingPortal.sessions.create({
  //   customer: customerId,
  //   return_url: params.returnUrl,
  // })
  // return { portalUrl: session.url }
}

/**
 * Get subscription details for an organization
 * STUBBED: Returns mock subscription
 */
export async function getSubscription(
  subscriptionId: string
): Promise<StripeSubscription | null> {
  console.log('[Stripe Stub] Getting subscription:', subscriptionId)

  // Stubbed: Return mock subscription
  return {
    id: subscriptionId,
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    cancel_at_period_end: false,
    items: [
      {
        price_id: 'price_stub_professional_monthly',
        product_id: 'prod_stub_professional',
      },
    ],
  }

  // Real implementation:
  // const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  // return {
  //   id: subscription.id,
  //   status: subscription.status,
  //   current_period_end: subscription.current_period_end,
  //   cancel_at_period_end: subscription.cancel_at_period_end,
  //   items: subscription.items.data.map(item => ({
  //     price_id: item.price.id,
  //     product_id: item.price.product as string,
  //   })),
  // }
}

/**
 * Cancel a subscription at period end
 * STUBBED: Logs action
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  console.log('[Stripe Stub] Canceling subscription:', subscriptionId)

  // Stubbed
  return { success: true }

  // Real implementation:
  // await stripe.subscriptions.update(subscriptionId, {
  //   cancel_at_period_end: true,
  // })
  // return { success: true }
}

/**
 * Resume a canceled subscription
 * STUBBED: Logs action
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  console.log('[Stripe Stub] Resuming subscription:', subscriptionId)

  // Stubbed
  return { success: true }

  // Real implementation:
  // await stripe.subscriptions.update(subscriptionId, {
  //   cancel_at_period_end: false,
  // })
  // return { success: true }
}

/**
 * List invoices for an organization
 * STUBBED: Returns mock invoices
 */
export async function listInvoices(
  customerId: string,
  limit: number = 10
): Promise<StripeInvoice[]> {
  console.log('[Stripe Stub] Listing invoices:', { customerId, limit })

  // Stubbed: Return mock invoices
  const now = Math.floor(Date.now() / 1000)

  return [
    {
      id: 'in_stub_001',
      number: 'NNB-0001',
      status: 'paid',
      amount_due: 4900,
      amount_paid: 4900,
      currency: 'usd',
      created: now - 30 * 24 * 60 * 60,
      invoice_pdf: null,
      hosted_invoice_url: null,
    },
    {
      id: 'in_stub_002',
      number: 'NNB-0002',
      status: 'paid',
      amount_due: 4900,
      amount_paid: 4900,
      currency: 'usd',
      created: now - 60 * 24 * 60 * 60,
      invoice_pdf: null,
      hosted_invoice_url: null,
    },
  ]

  // Real implementation:
  // const invoices = await stripe.invoices.list({
  //   customer: customerId,
  //   limit,
  // })
  // return invoices.data.map(inv => ({
  //   id: inv.id,
  //   number: inv.number || '',
  //   status: inv.status,
  //   amount_due: inv.amount_due,
  //   amount_paid: inv.amount_paid,
  //   currency: inv.currency,
  //   created: inv.created,
  //   invoice_pdf: inv.invoice_pdf,
  //   hosted_invoice_url: inv.hosted_invoice_url,
  // }))
}

/**
 * Update customer details
 * STUBBED: Logs action
 */
export async function updateCustomer(
  customerId: string,
  data: { email?: string; name?: string }
): Promise<{ success: boolean }> {
  console.log('[Stripe Stub] Updating customer:', { customerId, data })

  // Stubbed
  return { success: true }

  // Real implementation:
  // await stripe.customers.update(customerId, data)
  // return { success: true }
}

// =====================================================
// Webhook Signature Verification
// =====================================================

/**
 * Verify Stripe webhook signature
 * STUBBED: Always returns true in development
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string
): boolean {
  console.log('[Stripe Stub] Verifying webhook signature')

  // In production with real Stripe:
  // try {
  //   stripe.webhooks.constructEvent(
  //     payload,
  //     signature,
  //     process.env.STRIPE_WEBHOOK_SECRET!
  //   )
  //   return true
  // } catch (err) {
  //   return false
  // }

  // Stubbed: Always valid in dev
  return true
}

// =====================================================
// Price ID Mapping
// =====================================================

/**
 * Map plan IDs to Stripe price IDs
 * Update these when you create products in Stripe
 */
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: 'price_starter_monthly', // Free - no Stripe price
    yearly: 'price_starter_yearly',
  },
  professional: {
    monthly: 'price_professional_monthly',
    yearly: 'price_professional_yearly',
  },
  enterprise: {
    monthly: 'price_enterprise_monthly',
    yearly: 'price_enterprise_yearly',
  },
} as const

/**
 * Get Stripe price ID for a plan
 */
export function getPriceId(
  planId: string,
  period: 'monthly' | 'yearly'
): string | null {
  const prices = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS]
  return prices?.[period] || null
}
