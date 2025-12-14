/**
 * Stripe Webhook Handler
 *
 * Handles all subscription-related webhook events from Stripe.
 * Updates organization subscription status based on Stripe events.
 *
 * Events Handled:
 * - checkout.session.completed: New subscription created via checkout
 * - customer.subscription.created: Subscription created (any method)
 * - customer.subscription.updated: Plan changes, renewals, pauses
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.paid: Successful payment
 * - invoice.payment_failed: Failed payment attempt
 * - invoice.payment_succeeded: Payment succeeded (for recovery)
 *
 * Environment Variables Required:
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe dashboard
 * - SUPABASE_SERVICE_ROLE_KEY: For database updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import {
  verifyWebhookSignature,
  mapStripeStatus,
  getTierFromPriceId,
} from '@/lib/stripe/client'
import { PRICING_TIERS, type SubscriptionTier } from '@/config/pricing'

// =====================================================
// Supabase Admin Client
// =====================================================

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// =====================================================
// Main Webhook Handler
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature)

    if (!event) {
      console.error('[Stripe Webhook] Signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[Stripe Webhook] Processing ${event.type} (${event.id})`)

    // Route to appropriate handler
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
        await handlePaymentFailed(event)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event)
        break

      case 'customer.created':
      case 'customer.updated':
        // Log but don't process - customer info managed via checkout
        console.log(`[Stripe Webhook] Received ${event.type}, no action needed`)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    const duration = Date.now() - startTime
    console.log(`[Stripe Webhook] Completed ${event.type} in ${duration}ms`)

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
// Event Handlers
// =====================================================

/**
 * Handle checkout.session.completed
 * Triggered when a customer completes Stripe Checkout
 */
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  const organizationId = session.metadata?.organization_id
  const tier = session.metadata?.tier as SubscriptionTier | undefined
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (!organizationId) {
    console.error(
      '[Stripe Webhook] checkout.session.completed: Missing organization_id in metadata'
    )
    return
  }

  console.log('[Stripe Webhook] checkout.session.completed:', {
    organizationId,
    customerId,
    subscriptionId,
    tier,
  })

  // Get tier limits
  const tierConfig = tier ? PRICING_TIERS[tier] : PRICING_TIERS.starter

  // Update organization with Stripe IDs and activate subscription
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('organizations')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_tier: tier || 'professional',
      trial_ends_at: null, // Clear trial since they've subscribed
      max_team_members: tierConfig.limits.maxTeamMembers,
      max_clients: tierConfig.limits.maxClients,
      max_workflows: tierConfig.limits.maxWorkflows,
      max_storage_mb: tierConfig.limits.maxStorageMb,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)

  if (error) {
    console.error('[Stripe Webhook] Error updating organization:', error)
    throw error
  }

  console.log(`[Stripe Webhook] Organization ${organizationId} activated`)
}

/**
 * Handle customer.subscription.created
 * Triggered when a subscription is created (via checkout or API)
 */
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription

  const organizationId = subscription.metadata?.organization_id
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id

  // If no org ID in metadata, try to find by customer ID
  let orgId = organizationId
  if (!orgId && customerId) {
    const supabase = getAdminClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    orgId = org?.id
  }

  if (!orgId) {
    console.log(
      '[Stripe Webhook] subscription.created: No organization found, may be handled by checkout'
    )
    return
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price?.id
  const tier = priceId ? getTierFromPriceId(priceId) : null
  const tierConfig = tier ? PRICING_TIERS[tier] : PRICING_TIERS.professional

  console.log('[Stripe Webhook] subscription.created:', {
    organizationId: orgId,
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId,
    tier,
  })

  // Get period end from subscription (handle both snake_case and camelCase)
  const periodEnd =
    ((subscription as unknown as Record<string, unknown>)
      .current_period_end as number) ||
    ((subscription as unknown as Record<string, unknown>)
      .currentPeriodEnd as number) ||
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // Default to 30 days

  const supabase = getAdminClient()
  const { error } = await supabase
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_status: mapStripeStatus(subscription.status),
      subscription_tier: tier || 'professional',
      subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
      max_team_members: tierConfig.limits.maxTeamMembers,
      max_clients: tierConfig.limits.maxClients,
      max_workflows: tierConfig.limits.maxWorkflows,
      max_storage_mb: tierConfig.limits.maxStorageMb,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error)
    throw error
  }
}

/**
 * Handle customer.subscription.updated
 * Triggered on plan changes, renewals, cancellations, pauses
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const previousAttributes = event.data.previous_attributes as
    | Partial<Stripe.Subscription>
    | undefined

  // Find organization by subscription ID
  const supabase = getAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, subscription_tier')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!org) {
    console.log(
      `[Stripe Webhook] subscription.updated: No org found for sub ${subscription.id}`
    )
    return
  }

  // Determine if this is a plan change
  const priceId = subscription.items.data[0]?.price?.id
  const newTier = priceId ? getTierFromPriceId(priceId) : null
  const isPlanChange = previousAttributes?.items !== undefined

  // Get cancel_at_period_end - handle both snake_case and camelCase
  const cancelAtPeriodEnd =
    ((subscription as unknown as Record<string, unknown>)
      .cancel_at_period_end as boolean) ||
    ((subscription as unknown as Record<string, unknown>)
      .cancelAtPeriodEnd as boolean) ||
    false

  // Get period end from subscription
  const periodEnd =
    ((subscription as unknown as Record<string, unknown>)
      .current_period_end as number) ||
    ((subscription as unknown as Record<string, unknown>)
      .currentPeriodEnd as number) ||
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  console.log('[Stripe Webhook] subscription.updated:', {
    organizationId: org.id,
    status: subscription.status,
    cancelAtPeriodEnd,
    isPlanChange,
    newTier,
  })

  // Build update object
  const updates: Record<string, unknown> = {
    subscription_status: mapStripeStatus(subscription.status),
    subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
    stripe_price_id: priceId,
    updated_at: new Date().toISOString(),
  }

  // If plan changed, update tier and limits
  if (newTier && newTier !== org.subscription_tier) {
    const tierConfig = PRICING_TIERS[newTier]
    updates.subscription_tier = newTier
    updates.max_team_members = tierConfig.limits.maxTeamMembers
    updates.max_clients = tierConfig.limits.maxClients
    updates.max_workflows = tierConfig.limits.maxWorkflows
    updates.max_storage_mb = tierConfig.limits.maxStorageMb

    console.log(
      `[Stripe Webhook] Plan changed: ${org.subscription_tier} -> ${newTier}`
    )
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', org.id)

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error)
    throw error
  }
}

/**
 * Handle customer.subscription.deleted
 * Triggered when subscription is fully canceled (not just cancel_at_period_end)
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription

  const supabase = getAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!org) {
    console.log(
      `[Stripe Webhook] subscription.deleted: No org found for sub ${subscription.id}`
    )
    return
  }

  console.log('[Stripe Webhook] subscription.deleted:', {
    organizationId: org.id,
  })

  // Downgrade to starter tier
  const starterLimits = PRICING_TIERS.starter.limits
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'cancelled',
      subscription_tier: 'starter',
      stripe_subscription_id: null,
      stripe_price_id: null,
      subscription_ends_at: null,
      max_team_members: starterLimits.maxTeamMembers,
      max_clients: starterLimits.maxClients,
      max_workflows: starterLimits.maxWorkflows,
      max_storage_mb: starterLimits.maxStorageMb,
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id)

  if (error) {
    console.error('[Stripe Webhook] Error downgrading subscription:', error)
    throw error
  }

  console.log(`[Stripe Webhook] Organization ${org.id} downgraded to starter`)
}

/**
 * Handle invoice.paid
 * Triggered when an invoice is successfully paid
 */
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice

  // Get subscription ID - handle both snake_case and direct property
  const invoiceData = invoice as unknown as Record<string, unknown>
  const subscriptionRaw = invoiceData.subscription || invoiceData.subscriptionId

  // Only process subscription invoices
  if (!subscriptionRaw) {
    return
  }

  const subscriptionId =
    typeof subscriptionRaw === 'string'
      ? subscriptionRaw
      : (subscriptionRaw as { id: string }).id

  const supabase = getAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, subscription_status')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!org) {
    return
  }

  // Get amount_paid - handle both snake_case and camelCase
  const amountPaid =
    ((invoice as unknown as Record<string, unknown>).amount_paid as number) ||
    ((invoice as unknown as Record<string, unknown>).amountPaid as number) ||
    0

  console.log('[Stripe Webhook] invoice.paid:', {
    organizationId: org.id,
    amount: amountPaid,
    previousStatus: org.subscription_status,
  })

  // If was past_due, restore to active
  if (org.subscription_status === 'past_due') {
    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)

    if (error) {
      console.error('[Stripe Webhook] Error restoring active status:', error)
      throw error
    }

    console.log(
      `[Stripe Webhook] Organization ${org.id} restored to active after payment`
    )
  }
}

/**
 * Handle invoice.payment_failed
 * Triggered when a payment attempt fails
 */
async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice

  // Get subscription ID - handle both snake_case and direct property
  const invoiceData = invoice as unknown as Record<string, unknown>
  const subscriptionRaw = invoiceData.subscription || invoiceData.subscriptionId

  if (!subscriptionRaw) {
    return
  }

  const subscriptionId =
    typeof subscriptionRaw === 'string'
      ? subscriptionRaw
      : (subscriptionRaw as { id: string }).id

  const supabase = getAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, billing_email, name')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!org) {
    return
  }

  // Get attempt_count - handle both snake_case and camelCase
  const attemptCount =
    ((invoice as unknown as Record<string, unknown>).attempt_count as number) ||
    ((invoice as unknown as Record<string, unknown>).attemptCount as number) ||
    0
  const nextPaymentAttempt =
    ((invoice as unknown as Record<string, unknown>)
      .next_payment_attempt as number) ||
    ((invoice as unknown as Record<string, unknown>)
      .nextPaymentAttempt as number) ||
    null

  console.log('[Stripe Webhook] invoice.payment_failed:', {
    organizationId: org.id,
    attemptCount,
    nextAttempt: nextPaymentAttempt,
  })

  // Update status to past_due
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id)

  if (error) {
    console.error('[Stripe Webhook] Error updating to past_due:', error)
    throw error
  }

  // TODO: Send payment failed notification email
  // await sendPaymentFailedEmail(org.billing_email, org.name)

  console.log(`[Stripe Webhook] Organization ${org.id} marked as past_due`)
}

/**
 * Handle invoice.payment_succeeded
 * Similar to invoice.paid but specifically for successful payment
 */
async function handlePaymentSucceeded(event: Stripe.Event) {
  // Delegate to handleInvoicePaid as the logic is the same
  await handleInvoicePaid(event)
}

// =====================================================
// Exports for Testing
// =====================================================

export {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handlePaymentFailed,
}
