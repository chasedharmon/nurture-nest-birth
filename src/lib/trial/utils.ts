/**
 * Trial Management Utilities
 *
 * Functions for checking trial status, calculating days remaining,
 * and determining grace period status.
 */

import type { Organization } from '@/lib/supabase/types'

// =====================================================
// Constants
// =====================================================

/** Number of days for the initial trial period */
export const TRIAL_DURATION_DAYS = 30

/** Number of days for grace period after trial expiration */
export const GRACE_PERIOD_DAYS = 3

// =====================================================
// Types
// =====================================================

export interface TrialStatus {
  /** Whether the organization is currently in trial */
  isTrialing: boolean
  /** Whether the trial has expired */
  isExpired: boolean
  /** Whether we're in the grace period (trial expired but still within grace) */
  isInGracePeriod: boolean
  /** Whether the grace period has also expired (should block write access) */
  isFullyExpired: boolean
  /** Days remaining in trial (negative if expired) */
  daysRemaining: number
  /** The trial end date, if set */
  trialEndsAt: Date | null
  /** Human-readable status message */
  message: string
}

// =====================================================
// Core Functions
// =====================================================

/**
 * Calculate comprehensive trial status for an organization
 */
export function getTrialStatus(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): TrialStatus {
  const now = new Date()

  // If not trialing, return default non-trial status
  if (org.subscription_status !== 'trialing') {
    return {
      isTrialing: false,
      isExpired: false,
      isInGracePeriod: false,
      isFullyExpired: false,
      daysRemaining: 0,
      trialEndsAt: null,
      message: getStatusMessage(org.subscription_status),
    }
  }

  // If trialing but no end date set (shouldn't happen, but handle gracefully)
  if (!org.trial_ends_at) {
    return {
      isTrialing: true,
      isExpired: false,
      isInGracePeriod: false,
      isFullyExpired: false,
      daysRemaining: TRIAL_DURATION_DAYS,
      trialEndsAt: null,
      message: 'Trial active',
    }
  }

  const trialEndsAt = new Date(org.trial_ends_at)
  const gracePeriodEndsAt = new Date(trialEndsAt)
  gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS)

  const msRemaining = trialEndsAt.getTime() - now.getTime()
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

  const isExpired = now > trialEndsAt
  const isInGracePeriod = isExpired && now <= gracePeriodEndsAt
  const isFullyExpired = now > gracePeriodEndsAt

  let message: string
  if (isFullyExpired) {
    message = 'Trial ended. Please upgrade to continue.'
  } else if (isInGracePeriod) {
    const graceRemaining = Math.ceil(
      (gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    message = `Trial ended. ${graceRemaining} day${graceRemaining === 1 ? '' : 's'} left to upgrade (read-only mode).`
  } else if (daysRemaining <= 3) {
    message = `Trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade now to avoid interruption.`
  } else if (daysRemaining <= 7) {
    message = `${daysRemaining} days left in your trial.`
  } else {
    message = `${daysRemaining} days remaining in your free trial.`
  }

  return {
    isTrialing: true,
    isExpired,
    isInGracePeriod,
    isFullyExpired,
    daysRemaining,
    trialEndsAt,
    message,
  }
}

/**
 * Get a human-readable message for a subscription status
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'active':
      return 'Subscription active'
    case 'past_due':
      return 'Payment past due'
    case 'cancelled':
      return 'Subscription cancelled'
    case 'paused':
      return 'Subscription paused'
    case 'suspended':
      return 'Account suspended'
    default:
      return ''
  }
}

/**
 * Check if trial is expired (convenience function)
 */
export function isTrialExpired(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): boolean {
  return getTrialStatus(org).isExpired
}

/**
 * Check if in grace period (convenience function)
 */
export function isInGracePeriod(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): boolean {
  return getTrialStatus(org).isInGracePeriod
}

/**
 * Check if fully expired past grace period (convenience function)
 */
export function isFullyExpired(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): boolean {
  return getTrialStatus(org).isFullyExpired
}

/**
 * Get days remaining in trial (convenience function)
 */
export function getDaysRemaining(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): number {
  return getTrialStatus(org).daysRemaining
}

/**
 * Check if an organization should have read-only access
 * (trial expired but still in grace period)
 */
export function shouldBeReadOnly(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): boolean {
  const status = getTrialStatus(org)
  return status.isInGracePeriod && !status.isFullyExpired
}

/**
 * Check if an organization should be completely blocked
 * (trial and grace period both expired)
 */
export function shouldBeBlocked(
  org: Pick<Organization, 'subscription_status' | 'trial_ends_at'>
): boolean {
  const status = getTrialStatus(org)
  return status.isFullyExpired || org.subscription_status === 'suspended'
}
