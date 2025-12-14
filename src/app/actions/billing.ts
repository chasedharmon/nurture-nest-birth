'use server'

/**
 * Billing Server Actions
 *
 * Server actions for managing subscriptions, checkout sessions, and billing operations.
 * All actions check for Stripe configuration and return helpful errors if missing.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  createCheckoutSession as stripeCreateCheckoutSession,
  createPortalSession as stripeCreatePortalSession,
  getSubscription as stripeGetSubscription,
  getStripeConfigStatus,
  createCustomer,
  mapStripeStatus,
  getTierFromPriceId,
} from '@/lib/stripe/client'
import {
  PRICING_TIERS,
  type SubscriptionTier,
  type BillingPeriod,
} from '@/config/pricing'
import type { SubscriptionDetails, BillingActionResult } from '@/types/billing'

// =====================================================
// Helper Functions
// =====================================================

async function getCurrentOrganization() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get organization membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (membershipError || !membership?.organization) {
    // Fallback to users table
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single()

      if (org) {
        return { organization: org, user }
      }
    }

    return { error: 'No organization found' }
  }

  return { organization: membership.organization, user }
}

// =====================================================
// Checkout Session Actions
// =====================================================

/**
 * Create a Stripe Checkout session for upgrading/subscribing
 */
export async function createCheckoutSessionAction(
  tier: SubscriptionTier,
  billingPeriod: BillingPeriod = 'monthly'
): Promise<BillingActionResult<{ checkoutUrl: string }>> {
  const result = await getCurrentOrganization()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  const { organization } = result
  const stripeStatus = getStripeConfigStatus()

  if (!stripeStatus.isConfigured) {
    return {
      success: false,
      error: `Stripe is not configured. Missing: ${stripeStatus.missingKeys.join(', ')}`,
      stripeNotConfigured: true,
    }
  }

  // Validate tier
  if (!PRICING_TIERS[tier]) {
    return { success: false, error: `Invalid tier: ${tier}` }
  }

  // Check if price ID is configured for this tier
  const tierConfig = PRICING_TIERS[tier]
  if (!tierConfig.stripePriceIds[billingPeriod]) {
    return {
      success: false,
      error: `Price ID not configured for ${tier} ${billingPeriod}. Please configure Stripe price IDs in src/config/pricing.ts`,
    }
  }

  // Get the base URL for success/cancel redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const checkoutResult = await stripeCreateCheckoutSession({
    organizationId: organization.id,
    tier,
    billingPeriod,
    successUrl: `${baseUrl}/admin/setup/billing?success=true`,
    cancelUrl: `${baseUrl}/admin/setup/billing?canceled=true`,
  })

  if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
    return {
      success: false,
      error: checkoutResult.error || 'Failed to create checkout session',
    }
  }

  return {
    success: true,
    data: { checkoutUrl: checkoutResult.checkoutUrl },
  }
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createCustomerPortalSessionAction(): Promise<
  BillingActionResult<{ portalUrl: string }>
> {
  const result = await getCurrentOrganization()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  const { organization, user } = result
  const stripeStatus = getStripeConfigStatus()

  if (!stripeStatus.isConfigured) {
    return {
      success: false,
      error: `Stripe is not configured. Missing: ${stripeStatus.missingKeys.join(', ')}`,
      stripeNotConfigured: true,
    }
  }

  // Check if organization has a Stripe customer ID
  let customerId = organization.stripe_customer_id

  if (!customerId) {
    // Create a Stripe customer first
    const customerResult = await createCustomer(
      organization.id,
      organization.billing_email || user.email || '',
      organization.billing_name || organization.name
    )

    if (!customerResult.success || !customerResult.customerId) {
      return {
        success: false,
        error: customerResult.error || 'Failed to create Stripe customer',
      }
    }

    customerId = customerResult.customerId

    // Save the customer ID to the organization
    const adminClient = createAdminClient()
    await adminClient
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', organization.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const portalResult = await stripeCreatePortalSession({
    organizationId: organization.id,
    customerId,
    returnUrl: `${baseUrl}/admin/setup/billing`,
  })

  if (!portalResult.success || !portalResult.portalUrl) {
    return {
      success: false,
      error: portalResult.error || 'Failed to create portal session',
    }
  }

  return {
    success: true,
    data: { portalUrl: portalResult.portalUrl },
  }
}

// =====================================================
// Subscription Details Actions
// =====================================================

/**
 * Get the current subscription details for the organization
 */
export async function getSubscriptionDetailsAction(): Promise<
  BillingActionResult<SubscriptionDetails>
> {
  const result = await getCurrentOrganization()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  const { organization } = result

  // Build subscription details from database
  const details: SubscriptionDetails = {
    status: organization.subscription_status as SubscriptionDetails['status'],
    tier: organization.subscription_tier as SubscriptionTier,
    billingPeriod: null,
    currentPeriodEnd: organization.subscription_ends_at
      ? new Date(organization.subscription_ends_at)
      : null,
    cancelAtPeriodEnd: false,
    trialEndsAt: organization.trial_ends_at
      ? new Date(organization.trial_ends_at)
      : null,
    stripeSubscriptionId: organization.stripe_subscription_id || null,
    stripeCustomerId: organization.stripe_customer_id || null,
    stripePriceId: organization.stripe_price_id || null,
  }

  // If we have a Stripe subscription, fetch additional details
  if (organization.stripe_subscription_id) {
    const stripeStatus = getStripeConfigStatus()

    if (stripeStatus.isConfigured) {
      const subscription = await stripeGetSubscription(
        organization.stripe_subscription_id
      )

      if (subscription) {
        details.status = mapStripeStatus(subscription.status)
        details.currentPeriodEnd = new Date(
          subscription.currentPeriodEnd * 1000
        )
        details.cancelAtPeriodEnd = subscription.cancelAtPeriodEnd

        // Determine billing period from price ID
        if (subscription.items[0]?.priceId) {
          const priceId = subscription.items[0].priceId
          details.stripePriceId = priceId

          // Check if it's a yearly price
          const tier = getTierFromPriceId(priceId)
          if (tier) {
            details.tier = tier
            // Check if the price ID matches yearly
            const tierConfig = PRICING_TIERS[tier]
            if (tierConfig.stripePriceIds.yearly === priceId) {
              details.billingPeriod = 'yearly'
            } else {
              details.billingPeriod = 'monthly'
            }
          }
        }
      }
    }
  }

  return { success: true, data: details }
}

/**
 * Check if Stripe billing is configured
 */
export async function checkStripeConfigAction(): Promise<
  BillingActionResult<{
    isConfigured: boolean
    hasPriceIds: boolean
    isReady: boolean
    missingKeys: string[]
  }>
> {
  const status = getStripeConfigStatus()

  return {
    success: true,
    data: {
      isConfigured: status.isConfigured,
      hasPriceIds: status.hasPriceIds,
      isReady: status.isConfigured && status.hasPriceIds,
      missingKeys: status.missingKeys,
    },
  }
}

// =====================================================
// Subscription Management Actions
// =====================================================

/**
 * Update billing contact information
 */
export async function updateBillingContactAction(data: {
  billingEmail?: string
  billingName?: string
}): Promise<BillingActionResult<void>> {
  const result = await getCurrentOrganization()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  const { organization } = result
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update({
      billing_email: data.billingEmail,
      billing_name: data.billingName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organization.id)

  if (error) {
    return { success: false, error: 'Failed to update billing contact' }
  }

  return { success: true }
}

/**
 * Sync subscription status from Stripe
 * Used after webhook events or to manually refresh
 */
export async function syncSubscriptionStatusAction(): Promise<
  BillingActionResult<SubscriptionDetails>
> {
  const result = await getCurrentOrganization()
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  const { organization } = result

  if (!organization.stripe_subscription_id) {
    return {
      success: false,
      error: 'No subscription to sync',
    }
  }

  const stripeStatus = getStripeConfigStatus()
  if (!stripeStatus.isConfigured) {
    return {
      success: false,
      error: 'Stripe is not configured',
      stripeNotConfigured: true,
    }
  }

  const subscription = await stripeGetSubscription(
    organization.stripe_subscription_id
  )

  if (!subscription) {
    return {
      success: false,
      error: 'Subscription not found in Stripe',
    }
  }

  // Map Stripe status and tier
  const status = mapStripeStatus(subscription.status)
  const priceId = subscription.items[0]?.priceId
  const tier = priceId
    ? getTierFromPriceId(priceId)
    : organization.subscription_tier

  // Update organization in database
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('organizations')
    .update({
      subscription_status: status,
      subscription_tier: tier,
      stripe_price_id: priceId,
      subscription_ends_at: new Date(
        subscription.currentPeriodEnd * 1000
      ).toISOString(),
      trial_ends_at: null, // Clear trial if we have an active subscription
      updated_at: new Date().toISOString(),
    })
    .eq('id', organization.id)

  if (error) {
    console.error('[Billing] Error syncing subscription:', error)
    return { success: false, error: 'Failed to sync subscription' }
  }

  // Return updated details
  return getSubscriptionDetailsAction()
}
