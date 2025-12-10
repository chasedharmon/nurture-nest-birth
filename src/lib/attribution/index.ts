/**
 * Attribution tracking module for lead source tracking
 */

export {
  captureAttribution,
  getStoredAttribution,
  clearAttribution,
  getAttributionForSubmission,
  mergeAttributionWithFormData,
  formatReferralSource,
  formatUTMForDisplay,
  hasAttributionData,
  REFERRAL_SOURCE_OPTIONS,
} from './utm'

export type { AttributionData, ReferralSource } from './utm'
