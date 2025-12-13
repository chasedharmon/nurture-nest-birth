/**
 * Trial Management Module
 *
 * Re-exports all trial utilities for convenient importing.
 *
 * @example
 * import { getTrialStatus, isTrialExpired, TRIAL_DURATION_DAYS } from '@/lib/trial'
 */

export {
  // Constants
  TRIAL_DURATION_DAYS,
  GRACE_PERIOD_DAYS,
  // Types
  type TrialStatus,
  // Core functions
  getTrialStatus,
  isTrialExpired,
  isInGracePeriod,
  isFullyExpired,
  getDaysRemaining,
  shouldBeReadOnly,
  shouldBeBlocked,
} from './utils'
