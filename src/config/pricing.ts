/**
 * Pricing Configuration
 *
 * Defines subscription tiers, pricing, and feature limits for the SaaS platform.
 * Update STRIPE_PRICE_IDS with real Stripe price IDs after creating products
 * in your Stripe dashboard.
 */

export type BillingPeriod = 'monthly' | 'yearly'
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

export interface TierLimits {
  maxTeamMembers: number // -1 means unlimited
  maxClients: number
  maxWorkflows: number
  maxStorageMb: number
  maxEmailsPerMonth: number
  maxSmsPerMonth: number
}

export interface TierFeatures {
  clientPortal: boolean
  customBranding: boolean
  whiteLabel: boolean
  customDomain: boolean
  smsEnabled: boolean
  advancedReports: boolean
  customDashboards: boolean
  apiAccess: boolean
  webhookAccess: boolean
  calendarSync: boolean
  workflowTemplates: boolean
  advancedConditions: boolean
  prioritySupport: boolean
  dedicatedAccountManager: boolean
}

export interface PricingTier {
  id: SubscriptionTier
  name: string
  tagline: string
  description: string
  priceMonthly: number // in cents
  priceYearly: number // in cents (full year, not per month)
  limits: TierLimits
  features: TierFeatures
  stripePriceIds: {
    monthly: string | null // null until configured in Stripe
    yearly: string | null
  }
  isFeatured: boolean
  displayOrder: number
}

/**
 * Stripe Price ID Placeholders
 *
 * Replace these with real Stripe price IDs after creating products:
 * 1. Go to Stripe Dashboard > Products
 * 2. Create products for Starter, Professional, Enterprise
 * 3. Add monthly and yearly prices for each
 * 4. Copy the price IDs (format: price_xxx) here
 */
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: null as string | null, // Free tier - no Stripe price needed
    yearly: null as string | null,
  },
  professional: {
    monthly: null as string | null, // TODO: Replace with price_xxx from Stripe
    yearly: null as string | null, // TODO: Replace with price_xxx from Stripe
  },
  enterprise: {
    monthly: null as string | null, // TODO: Replace with price_xxx from Stripe
    yearly: null as string | null, // TODO: Replace with price_xxx from Stripe
  },
} as const

/**
 * Pricing Tiers Configuration
 *
 * Prices are in cents (e.g., 2900 = $29.00)
 */
export const PRICING_TIERS: Record<SubscriptionTier, PricingTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for solo practitioners',
    description:
      'Everything you need to manage your doula practice. Ideal for independent birth professionals just getting started.',
    priceMonthly: 2900, // $29/month
    priceYearly: 29000, // $290/year (2 months free)
    limits: {
      maxTeamMembers: 1,
      maxClients: 50,
      maxWorkflows: 5,
      maxStorageMb: 500,
      maxEmailsPerMonth: 500,
      maxSmsPerMonth: 0,
    },
    features: {
      clientPortal: true,
      customBranding: false,
      whiteLabel: false,
      customDomain: false,
      smsEnabled: false,
      advancedReports: false,
      customDashboards: false,
      apiAccess: false,
      webhookAccess: false,
      calendarSync: true,
      workflowTemplates: true,
      advancedConditions: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
    },
    stripePriceIds: STRIPE_PRICE_IDS.starter,
    isFeatured: false,
    displayOrder: 1,
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing practices',
    description:
      'Advanced features for established practices with team members. Includes SMS, custom branding, and priority support.',
    priceMonthly: 7900, // $79/month
    priceYearly: 79000, // $790/year (2 months free)
    limits: {
      maxTeamMembers: 10,
      maxClients: 500,
      maxWorkflows: 50,
      maxStorageMb: 5000,
      maxEmailsPerMonth: 5000,
      maxSmsPerMonth: 500,
    },
    features: {
      clientPortal: true,
      customBranding: true,
      whiteLabel: false,
      customDomain: false,
      smsEnabled: true,
      advancedReports: true,
      customDashboards: true,
      apiAccess: false,
      webhookAccess: false,
      calendarSync: true,
      workflowTemplates: true,
      advancedConditions: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
    },
    stripePriceIds: STRIPE_PRICE_IDS.professional,
    isFeatured: true,
    displayOrder: 2,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For agencies & organizations',
    description:
      'Unlimited everything with white-label branding, custom domain, API access, and a dedicated account manager.',
    priceMonthly: 19900, // $199/month
    priceYearly: 199000, // $1990/year (2 months free)
    limits: {
      maxTeamMembers: -1, // Unlimited
      maxClients: -1,
      maxWorkflows: -1,
      maxStorageMb: 50000,
      maxEmailsPerMonth: -1,
      maxSmsPerMonth: 2000,
    },
    features: {
      clientPortal: true,
      customBranding: true,
      whiteLabel: true,
      customDomain: true,
      smsEnabled: true,
      advancedReports: true,
      customDashboards: true,
      apiAccess: true,
      webhookAccess: true,
      calendarSync: true,
      workflowTemplates: true,
      advancedConditions: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
    },
    stripePriceIds: STRIPE_PRICE_IDS.enterprise,
    isFeatured: false,
    displayOrder: 3,
  },
}

/**
 * Get pricing tier by ID
 */
export function getPricingTier(tierId: string): PricingTier | null {
  return PRICING_TIERS[tierId as SubscriptionTier] || null
}

/**
 * Get all pricing tiers sorted by display order
 */
export function getAllPricingTiers(): PricingTier[] {
  return Object.values(PRICING_TIERS).sort(
    (a, b) => a.displayOrder - b.displayOrder
  )
}

/**
 * Get the Stripe price ID for a tier and billing period
 * Returns null if Stripe is not configured for this tier
 */
export function getStripePriceId(
  tier: SubscriptionTier,
  period: BillingPeriod
): string | null {
  return PRICING_TIERS[tier]?.stripePriceIds[period] || null
}

/**
 * Determine tier from Stripe price ID
 * Used in webhook processing to map Stripe subscriptions to tiers
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(PRICING_TIERS)) {
    if (
      config.stripePriceIds.monthly === priceId ||
      config.stripePriceIds.yearly === priceId
    ) {
      return tier as SubscriptionTier
    }
  }
  return null
}

/**
 * Check if any Stripe price IDs are configured
 * Used to determine if billing is ready for production
 */
export function isStripeConfigured(): boolean {
  // Check if at least one paid tier has price IDs
  return !!(
    STRIPE_PRICE_IDS.professional.monthly ||
    STRIPE_PRICE_IDS.professional.yearly ||
    STRIPE_PRICE_IDS.enterprise.monthly ||
    STRIPE_PRICE_IDS.enterprise.yearly
  )
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Calculate savings for yearly billing
 */
export function getYearlySavings(tier: SubscriptionTier): number {
  const config = PRICING_TIERS[tier]
  const monthlyTotal = config.priceMonthly * 12
  return monthlyTotal - config.priceYearly
}

/**
 * Get the next tier up from current tier
 */
export function getUpgradeTier(
  currentTier: SubscriptionTier
): SubscriptionTier | null {
  switch (currentTier) {
    case 'starter':
      return 'professional'
    case 'professional':
      return 'enterprise'
    case 'enterprise':
      return null // Already at highest tier
    default:
      return 'professional'
  }
}

/**
 * Compare two tiers
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareTiers(
  tierA: SubscriptionTier,
  tierB: SubscriptionTier
): -1 | 0 | 1 {
  const order: Record<SubscriptionTier, number> = {
    starter: 1,
    professional: 2,
    enterprise: 3,
  }
  const diff = order[tierA] - order[tierB]
  return diff < 0 ? -1 : diff > 0 ? 1 : 0
}

/**
 * Check if tier change is an upgrade
 */
export function isUpgrade(
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier
): boolean {
  return compareTiers(toTier, fromTier) > 0
}
