/**
 * Personalization Components
 *
 * Components for displaying personalized content based on visitor profile.
 * Similar to Marketing Cloud Personalization but tailored for this doula site.
 *
 * Usage:
 * 1. Wrap your app with <PersonalizationProvider> in layout.tsx
 * 2. Use usePersonalization() hook to access profile and content
 * 3. Use personalized components like <PersonalizedGreeting />
 */

export {
  PersonalizationProvider,
  usePersonalization,
  useOptionalPersonalization,
} from './personalization-provider'
export { PersonalizedGreeting } from './personalized-greeting'
export { PersonalizedCta } from './personalized-cta'
export { PersonalizedRecommendations } from './personalized-recommendations'
export { PersonalizedBanner } from './personalized-banner'
export { PersonalizedBannerWrapper } from './personalized-banner-wrapper'
