import { describe, it, expect } from 'vitest'
import {
  canBePlatformAdmin,
  getPlatformDisplayName,
  getBranding,
  isPlatformFeatureEnabled,
  platformConfig,
  superAdminConfig,
  tenantDefaults,
} from '@/config/platform'
import {
  parseSubdomain,
  getTenantDefaultSettings,
  getTenantDefaultBranding,
} from '@/lib/platform/tenant-context'
import {
  getSuperAdminRoutePrefix,
  isSuperAdminRoute,
} from '@/lib/platform/super-admin'

/**
 * Platform Configuration Tests
 *
 * Tests for pure functions in the platform configuration module.
 * These don't require database access or Supabase connections.
 */

describe('Platform Configuration', () => {
  describe('platformConfig structure', () => {
    it('should have required identity fields', () => {
      expect(platformConfig.name).toBe('BirthCRM')
      expect(platformConfig.tagline).toBeDefined()
      expect(platformConfig.description).toBeDefined()
    })

    it('should have required URLs', () => {
      expect(platformConfig.urls).toBeDefined()
      expect(platformConfig.urls.app).toBeDefined()
    })

    it('should have default branding colors', () => {
      expect(platformConfig.defaultBranding.primaryColor).toMatch(
        /^#[0-9A-Fa-f]{6}$/
      )
      expect(platformConfig.defaultBranding.secondaryColor).toMatch(
        /^#[0-9A-Fa-f]{6}$/
      )
      expect(platformConfig.defaultBranding.accentColor).toMatch(
        /^#[0-9A-Fa-f]{6}$/
      )
    })

    it('should have feature flags', () => {
      expect(typeof platformConfig.features.multiTenancy).toBe('boolean')
      expect(typeof platformConfig.features.superAdminPanel).toBe('boolean')
      expect(typeof platformConfig.features.tenantBranding).toBe('boolean')
    })

    it('should have platform limits', () => {
      expect(platformConfig.limits.maxOrganizationsPerUser).toBeGreaterThan(0)
      expect(platformConfig.limits.maxInvitesPerDay).toBeGreaterThan(0)
      expect(platformConfig.limits.maxApiRequestsPerMinute).toBeGreaterThan(0)
    })
  })

  describe('canBePlatformAdmin', () => {
    it('should return false for random emails when no allowlists configured', () => {
      // By default, no domains or emails are configured
      expect(canBePlatformAdmin('random@example.com')).toBe(false)
      expect(canBePlatformAdmin('user@gmail.com')).toBe(false)
    })

    it('should normalize email to lowercase', () => {
      // Even with uppercase, should not match if not in allowlist
      expect(canBePlatformAdmin('USER@EXAMPLE.COM')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(canBePlatformAdmin('')).toBe(false)
    })

    it('should handle malformed emails', () => {
      expect(canBePlatformAdmin('notanemail')).toBe(false)
      expect(canBePlatformAdmin('@nodomain')).toBe(false)
    })

    it('should trim whitespace', () => {
      expect(canBePlatformAdmin('  user@example.com  ')).toBe(false)
    })
  })

  describe('getPlatformDisplayName', () => {
    it('should return tenant name when provided', () => {
      expect(getPlatformDisplayName('Acme Corp')).toBe('Acme Corp')
      expect(getPlatformDisplayName('My Business')).toBe('My Business')
    })

    it('should return platform name when tenant name is null', () => {
      expect(getPlatformDisplayName(null)).toBe('BirthCRM')
    })

    it('should return platform name when tenant name is undefined', () => {
      expect(getPlatformDisplayName(undefined)).toBe('BirthCRM')
    })

    it('should return platform name when tenant name is empty string', () => {
      // Empty string is falsy, so falls back to platform name
      expect(getPlatformDisplayName('')).toBe('BirthCRM')
    })
  })

  describe('getBranding', () => {
    it('should return platform defaults when no tenant branding provided', () => {
      const branding = getBranding()
      expect(branding.primaryColor).toBe(
        platformConfig.defaultBranding.primaryColor
      )
      expect(branding.secondaryColor).toBe(
        platformConfig.defaultBranding.secondaryColor
      )
      expect(branding.accentColor).toBe(
        platformConfig.defaultBranding.accentColor
      )
    })

    it('should override with tenant branding when provided', () => {
      const branding = getBranding({
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      })
      expect(branding.primaryColor).toBe('#FF0000')
      expect(branding.secondaryColor).toBe('#00FF00')
      expect(branding.accentColor).toBe(
        platformConfig.defaultBranding.accentColor
      )
    })

    it('should handle partial tenant branding', () => {
      const branding = getBranding({
        primaryColor: '#123456',
      })
      expect(branding.primaryColor).toBe('#123456')
      expect(branding.secondaryColor).toBe(
        platformConfig.defaultBranding.secondaryColor
      )
    })

    it('should fallback when tenant values are null', () => {
      const branding = getBranding({
        primaryColor: null,
        secondaryColor: '#ABCDEF',
      })
      expect(branding.primaryColor).toBe(
        platformConfig.defaultBranding.primaryColor
      )
      expect(branding.secondaryColor).toBe('#ABCDEF')
    })

    it('should always include fontFamily from platform config', () => {
      const branding = getBranding({ primaryColor: '#FF0000' })
      expect(branding.fontFamily).toBe(
        platformConfig.defaultBranding.fontFamily
      )
    })
  })

  describe('isPlatformFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(isPlatformFeatureEnabled('multiTenancy')).toBe(true)
      expect(isPlatformFeatureEnabled('superAdminPanel')).toBe(true)
      expect(isPlatformFeatureEnabled('tenantBranding')).toBe(true)
    })

    it('should return false for disabled features', () => {
      expect(isPlatformFeatureEnabled('selfServiceSignup')).toBe(false)
      expect(isPlatformFeatureEnabled('publicApi')).toBe(false)
    })
  })
})

describe('Super Admin Configuration', () => {
  describe('superAdminConfig structure', () => {
    it('should have route prefix', () => {
      expect(superAdminConfig.routePrefix).toBe('/super-admin')
    })

    it('should have dangerous actions list', () => {
      expect(superAdminConfig.dangerousActions).toContain('delete_tenant')
      expect(superAdminConfig.dangerousActions).toContain('suspend_tenant')
      expect(superAdminConfig.dangerousActions).toContain('impersonate_user')
    })

    it('should have allowedDomains and allowedEmails arrays', () => {
      expect(Array.isArray(superAdminConfig.allowedDomains)).toBe(true)
      expect(Array.isArray(superAdminConfig.allowedEmails)).toBe(true)
    })
  })

  describe('getSuperAdminRoutePrefix', () => {
    it('should return the configured route prefix', () => {
      expect(getSuperAdminRoutePrefix()).toBe('/super-admin')
    })
  })

  describe('isSuperAdminRoute', () => {
    it('should return true for super admin routes', () => {
      expect(isSuperAdminRoute('/super-admin')).toBe(true)
      expect(isSuperAdminRoute('/super-admin/tenants')).toBe(true)
      expect(isSuperAdminRoute('/super-admin/tenants/123')).toBe(true)
    })

    it('should return false for non-super admin routes', () => {
      expect(isSuperAdminRoute('/admin')).toBe(false)
      expect(isSuperAdminRoute('/admin/setup')).toBe(false)
      expect(isSuperAdminRoute('/client')).toBe(false)
      expect(isSuperAdminRoute('/')).toBe(false)
    })

    it('should return false for routes that contain but dont start with super-admin', () => {
      expect(isSuperAdminRoute('/admin/super-admin')).toBe(false)
      expect(isSuperAdminRoute('/something/super-admin/path')).toBe(false)
    })
  })
})

describe('Tenant Defaults', () => {
  describe('tenantDefaults structure', () => {
    it('should have default subscription tier', () => {
      expect(tenantDefaults.subscriptionTier).toBe('starter')
    })

    it('should have default branding', () => {
      expect(tenantDefaults.branding.primaryColor).toBeDefined()
      expect(tenantDefaults.branding.secondaryColor).toBeDefined()
      expect(tenantDefaults.branding.usePlatformBranding).toBe(true)
    })

    it('should have default settings', () => {
      expect(tenantDefaults.settings.timezone).toBeDefined()
      expect(tenantDefaults.settings.dateFormat).toBeDefined()
      expect(tenantDefaults.settings.currency).toBe('USD')
      expect(tenantDefaults.settings.locale).toBe('en-US')
    })
  })

  describe('getTenantDefaultSettings', () => {
    it('should return default settings object', () => {
      const settings = getTenantDefaultSettings()
      expect(settings.timezone).toBe('America/Chicago')
      expect(settings.dateFormat).toBe('MM/DD/YYYY')
      expect(settings.timeFormat).toBe('12h')
      expect(settings.currency).toBe('USD')
    })
  })

  describe('getTenantDefaultBranding', () => {
    it('should return default branding object', () => {
      const branding = getTenantDefaultBranding()
      expect(branding.primaryColor).toBeDefined()
      expect(branding.usePlatformBranding).toBe(true)
    })
  })
})

describe('Tenant Context - Subdomain Parsing', () => {
  describe('parseSubdomain', () => {
    it('should return null for localhost', () => {
      expect(parseSubdomain('localhost')).toBeNull()
      expect(parseSubdomain('localhost:3000')).toBeNull()
    })

    it('should return null for 127.0.0.1', () => {
      expect(parseSubdomain('127.0.0.1')).toBeNull()
      expect(parseSubdomain('127.0.0.1:3000')).toBeNull()
    })

    it('should return null for root domain (no subdomain)', () => {
      expect(parseSubdomain('birthcrm.com')).toBeNull()
      expect(parseSubdomain('example.com')).toBeNull()
    })

    it('should return subdomain for valid subdomain hostnames', () => {
      expect(parseSubdomain('acme.birthcrm.com')).toBe('acme')
      expect(parseSubdomain('tenant1.example.com')).toBe('tenant1')
      expect(parseSubdomain('myorg.app.birthcrm.com')).toBe('myorg')
    })

    it('should return null for reserved subdomains', () => {
      expect(parseSubdomain('www.birthcrm.com')).toBeNull()
      expect(parseSubdomain('api.birthcrm.com')).toBeNull()
      expect(parseSubdomain('app.birthcrm.com')).toBeNull()
      expect(parseSubdomain('admin.birthcrm.com')).toBeNull()
      expect(parseSubdomain('super-admin.birthcrm.com')).toBeNull()
    })

    it('should handle edge cases', () => {
      // Empty hostname
      expect(parseSubdomain('')).toBeNull()
      // Single part (no dots)
      expect(parseSubdomain('localhost')).toBeNull()
    })
  })
})

describe('Platform Type Exports', () => {
  it('should export PlatformConfig type matching platformConfig', () => {
    // Type test - if this compiles, the types are correct
    const config: typeof platformConfig = platformConfig
    expect(config.name).toBeDefined()
  })

  it('should have correct feature flag type', () => {
    // Verify feature keys exist
    type FeatureKey = keyof typeof platformConfig.features
    const features: FeatureKey[] = [
      'multiTenancy',
      'superAdminPanel',
      'tenantBranding',
      'tenantImpersonation',
      'selfServiceSignup',
      'publicApi',
      'whiteLabeling',
    ]
    features.forEach(key => {
      expect(typeof platformConfig.features[key]).toBe('boolean')
    })
  })
})
