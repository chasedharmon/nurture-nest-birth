/**
 * Platform-Level Configuration
 *
 * This file defines the SaaS platform identity, separate from individual tenant branding.
 * The platform (BirthCRM) is the multi-tenant CRM product; each organization is a tenant.
 *
 * Hierarchy:
 * - Platform (BirthCRM) - This file
 * - Tenant (Organization) - Database-driven branding per organization
 * - Site (NNB) - Original doula business site config (src/config/site.ts)
 */

// =====================================================
// Platform Identity
// =====================================================

export const platformConfig = {
  /**
   * Platform branding - the SaaS product identity
   * TODO: Update when actual name/domain is decided
   */
  name: 'BirthCRM',
  tagline: 'CRM for Birth Professionals',
  description:
    'Modern client relationship management built specifically for doulas, midwives, and birth professionals.',

  /**
   * Platform URLs
   * TODO: Update when domain is purchased
   */
  urls: {
    app: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    marketing: '', // Future: marketing site URL
    docs: '', // Future: documentation URL
    support: '', // Future: support/help desk URL
  },

  /**
   * Platform contact
   */
  contact: {
    support: 'support@birthcrm.com', // Placeholder
    sales: 'sales@birthcrm.com', // Placeholder
    noreply: 'noreply@birthcrm.com', // Placeholder
  },

  /**
   * Platform default branding
   * These serve as fallbacks when tenant branding is not configured
   */
  defaultBranding: {
    primaryColor: '#7C3AED', // Purple - professional yet warm
    secondaryColor: '#F59E0B', // Amber - complementary warmth
    accentColor: '#10B981', // Emerald - for success states
    logoUrl: null as string | null, // Placeholder until logo exists
    faviconUrl: null as string | null,
    fontFamily: 'Inter, system-ui, sans-serif',
  },

  /**
   * Platform feature flags
   * These control platform-wide features, not tenant-specific
   */
  features: {
    multiTenancy: true,
    superAdminPanel: true,
    tenantBranding: true,
    tenantImpersonation: true,
    selfServiceSignup: false, // Future: enable for self-service onboarding
    publicApi: false, // Future: enable when API is ready
    whiteLabeling: false, // Future: remove platform branding entirely
  },

  /**
   * Platform limits (enforced at platform level, not subscription)
   */
  limits: {
    maxOrganizationsPerUser: 5, // User can belong to up to 5 orgs
    maxInvitesPerDay: 50, // Rate limit on invites
    maxApiRequestsPerMinute: 100, // Rate limiting
  },

  /**
   * Legal & Compliance
   */
  legal: {
    companyName: 'BirthCRM, LLC', // Placeholder
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    copyrightYear: new Date().getFullYear(),
  },

  /**
   * Analytics & Tracking IDs
   * TODO: Add when analytics is set up
   */
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
    mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },
} as const

// =====================================================
// Super Admin Configuration
// =====================================================

export const superAdminConfig = {
  /**
   * Email domains that can be platform admins
   * Users with these email domains can be granted is_platform_admin
   */
  allowedDomains: [
    // Add your domain(s) here when ready
    // 'birthcrm.com',
  ] as string[],

  /**
   * Specific emails that are always platform admins
   * These users bypass domain checks
   */
  allowedEmails: ['chase.d.harmon@gmail.com'] as string[],

  /**
   * Super admin routes prefix
   */
  routePrefix: '/super-admin',

  /**
   * Actions that require confirmation
   */
  dangerousActions: [
    'delete_tenant',
    'suspend_tenant',
    'reset_tenant_data',
    'impersonate_user',
  ] as const,
}

// =====================================================
// Tenant Defaults
// =====================================================

/**
 * Default settings for newly created tenants
 */
export const tenantDefaults = {
  /**
   * Default subscription tier for new tenants
   */
  subscriptionTier: 'starter' as const,

  /**
   * Default feature flags (per tier, defined in types.ts)
   * These are inherited from DEFAULT_FEATURE_FLAGS
   */

  /**
   * Default branding (falls back to platform defaults)
   */
  branding: {
    primaryColor: platformConfig.defaultBranding.primaryColor,
    secondaryColor: platformConfig.defaultBranding.secondaryColor,
    logoUrl: null,
    usePlatformBranding: true, // Show "Powered by BirthCRM" until custom branding
  },

  /**
   * Default organization settings
   */
  settings: {
    timezone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    locale: 'en-US',
  },
}

// =====================================================
// Type Exports
// =====================================================

export type PlatformConfig = typeof platformConfig
export type SuperAdminConfig = typeof superAdminConfig
export type TenantDefaults = typeof tenantDefaults
export type DangerousAction = (typeof superAdminConfig.dangerousActions)[number]

// =====================================================
// Helper Functions
// =====================================================

/**
 * Check if an email is allowed to be a platform admin
 */
export function canBePlatformAdmin(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()

  // Check specific emails first
  if (superAdminConfig.allowedEmails.includes(normalizedEmail)) {
    return true
  }

  // Check domain
  const domain = normalizedEmail.split('@')[1]
  if (!domain) return false
  return superAdminConfig.allowedDomains.includes(domain)
}

/**
 * Get the platform's display name with optional tenant override
 */
export function getPlatformDisplayName(tenantName?: string | null): string {
  return tenantName || platformConfig.name
}

/**
 * Get branding with tenant overrides
 */
export function getBranding(tenantBranding?: {
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
}) {
  return {
    primaryColor:
      tenantBranding?.primaryColor ||
      platformConfig.defaultBranding.primaryColor,
    secondaryColor:
      tenantBranding?.secondaryColor ||
      platformConfig.defaultBranding.secondaryColor,
    accentColor:
      tenantBranding?.accentColor || platformConfig.defaultBranding.accentColor,
    logoUrl: tenantBranding?.logoUrl || platformConfig.defaultBranding.logoUrl,
    faviconUrl:
      tenantBranding?.faviconUrl || platformConfig.defaultBranding.faviconUrl,
    fontFamily: platformConfig.defaultBranding.fontFamily,
  }
}

/**
 * Check if a platform feature is enabled
 */
export function isPlatformFeatureEnabled(
  feature: keyof typeof platformConfig.features
): boolean {
  return platformConfig.features[feature]
}
