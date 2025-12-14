/**
 * Billing Types
 *
 * Type definitions for Stripe billing integration and subscription management.
 */

import type { SubscriptionTier, BillingPeriod } from '@/config/pricing'

// =====================================================
// Subscription Status Types
// =====================================================

/**
 * Internal subscription status (stored in organizations table)
 */
export type SubscriptionStatus =
  | 'trialing' // Free trial active
  | 'active' // Paid subscription active
  | 'past_due' // Payment failed, grace period
  | 'cancelled' // Subscription ended
  | 'paused' // Temporarily paused
  | 'suspended' // Account suspended (manual action)

/**
 * Stripe subscription status (from Stripe API)
 */
export type StripeSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

// =====================================================
// Stripe API Types
// =====================================================

export interface StripeCustomer {
  id: string
  email: string | null
  name: string | null
  metadata: Record<string, string>
}

export interface StripeSubscription {
  id: string
  status: StripeSubscriptionStatus
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  canceledAt: number | null
  items: StripeSubscriptionItem[]
  defaultPaymentMethod: string | null
}

export interface StripeSubscriptionItem {
  id: string
  priceId: string
  productId: string
  quantity: number
}

export interface StripeInvoice {
  id: string
  number: string | null
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  amountDue: number
  amountPaid: number
  currency: string
  created: number
  dueDate: number | null
  invoicePdf: string | null
  hostedInvoiceUrl: string | null
}

export interface StripePaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'us_bank_account'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

// =====================================================
// Checkout Session Types
// =====================================================

export interface CreateCheckoutSessionParams {
  organizationId: string
  tier: SubscriptionTier
  billingPeriod: BillingPeriod
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResult {
  success: boolean
  sessionId?: string
  checkoutUrl?: string
  error?: string
  stripeNotConfigured?: boolean
}

export interface CreatePortalSessionParams {
  organizationId: string
  returnUrl: string
}

export interface PortalSessionResult {
  success: boolean
  portalUrl?: string
  error?: string
  stripeNotConfigured?: boolean
}

// =====================================================
// Subscription Details Types
// =====================================================

export interface SubscriptionDetails {
  status: SubscriptionStatus
  tier: SubscriptionTier
  billingPeriod: BillingPeriod | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  trialEndsAt: Date | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  stripePriceId: string | null
}

export interface UsageDetails {
  teamMembers: {
    current: number
    limit: number
    percentage: number
  }
  clients: {
    current: number
    limit: number
    percentage: number
  }
  workflows: {
    current: number
    limit: number
    percentage: number
  }
  storageMb: {
    current: number
    limit: number
    percentage: number
  }
}

// =====================================================
// Webhook Event Types
// =====================================================

export interface StripeWebhookEvent {
  id: string
  type: StripeWebhookEventType
  created: number
  data: {
    object: Record<string, unknown>
  }
}

export type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.paused'
  | 'customer.subscription.resumed'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'payment_method.attached'
  | 'payment_method.detached'

export interface WebhookCheckoutSession {
  id: string
  customer: string
  subscription: string
  mode: 'subscription' | 'payment' | 'setup'
  status: 'complete' | 'expired' | 'open'
  metadata: {
    organization_id?: string
    tier?: string
    billing_period?: string
  }
}

export interface WebhookSubscription {
  id: string
  customer: string
  status: StripeSubscriptionStatus
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  items: {
    data: Array<{
      price: {
        id: string
        product: string
      }
    }>
  }
  metadata: Record<string, string>
}

export interface WebhookInvoice {
  id: string
  customer: string
  subscription: string | null
  status: string
  amountDue: number
  amountPaid: number
  attemptCount: number
  nextPaymentAttempt: number | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

// =====================================================
// Billing Action Results
// =====================================================

export interface BillingActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  stripeNotConfigured?: boolean
}

export interface UpgradePreview {
  currentTier: SubscriptionTier
  newTier: SubscriptionTier
  proratedAmount: number
  newMonthlyPrice: number
  effectiveDate: Date
}

// =====================================================
// Organization Billing Fields
// =====================================================

/**
 * Billing-related fields on the organizations table
 */
export interface OrganizationBillingFields {
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
  trial_ends_at: string | null
  subscription_ends_at: string | null
  billing_email: string | null
  billing_name: string | null
}

// =====================================================
// Configuration Status
// =====================================================

export interface StripeConfigStatus {
  isConfigured: boolean
  hasSecretKey: boolean
  hasPublishableKey: boolean
  hasWebhookSecret: boolean
  hasPriceIds: boolean
  missingKeys: string[]
}
