'use server'

/**
 * Tenant Branding Server Actions
 *
 * CRUD operations for tenant (organization) branding configuration.
 * Allows admins to customize their organization's appearance.
 */

import { revalidatePath } from 'next/cache'

import { getCurrentOrganizationId } from '@/lib/platform/tenant-context'
import { createClient } from '@/lib/supabase/server'

// =====================================================
// Types
// =====================================================

export interface TenantBranding {
  id: string
  organization_id: string

  // Colors
  primary_color: string
  secondary_color: string
  accent_color: string

  // Logos
  logo_url: string | null
  logo_dark_url: string | null
  favicon_url: string | null

  // Typography
  font_family: string
  heading_font_family: string | null

  // Custom CSS
  custom_css: string | null

  // Email branding
  email_header_html: string | null
  email_footer_html: string | null
  email_logo_url: string | null

  // Portal branding
  portal_welcome_message: string | null
  portal_logo_url: string | null

  // White-label
  hide_powered_by: boolean
  custom_domain: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

export type TenantBrandingInsert = Omit<
  TenantBranding,
  'id' | 'created_at' | 'updated_at'
>

export type TenantBrandingUpdate = Partial<
  Omit<TenantBrandingInsert, 'organization_id'>
>

export interface BrandingResult {
  data: TenantBranding | null
  error: string | null
}

// =====================================================
// Read Operations
// =====================================================

/**
 * Get the current organization's branding configuration
 */
export async function getTenantBranding(): Promise<BrandingResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { data: null, error: 'No organization context' }
  }

  const { data, error } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (which is fine, use defaults)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Get branding for a specific organization (requires proper access)
 */
export async function getTenantBrandingByOrgId(
  organizationId: string
): Promise<BrandingResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// =====================================================
// Write Operations
// =====================================================

/**
 * Create or update branding for the current organization
 * Uses upsert to handle both insert and update cases
 */
export async function upsertTenantBranding(
  branding: TenantBrandingUpdate
): Promise<BrandingResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { data: null, error: 'No organization context' }
  }

  // Validate colors if provided
  if (branding.primary_color && !isValidHexColor(branding.primary_color)) {
    return { data: null, error: 'Invalid primary color format' }
  }
  if (branding.secondary_color && !isValidHexColor(branding.secondary_color)) {
    return { data: null, error: 'Invalid secondary color format' }
  }
  if (branding.accent_color && !isValidHexColor(branding.accent_color)) {
    return { data: null, error: 'Invalid accent color format' }
  }

  const { data, error } = await supabase
    .from('tenant_branding')
    .upsert(
      {
        organization_id: organizationId,
        ...branding,
      },
      {
        onConflict: 'organization_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Revalidate affected pages
  revalidatePath('/admin')
  revalidatePath('/admin/setup/organization')

  return { data, error: null }
}

/**
 * Update specific branding fields
 */
export async function updateTenantBranding(
  updates: TenantBrandingUpdate
): Promise<BrandingResult> {
  return upsertTenantBranding(updates)
}

/**
 * Update branding colors
 */
export async function updateBrandingColors(colors: {
  primary_color?: string
  secondary_color?: string
  accent_color?: string
}): Promise<BrandingResult> {
  // Validate all colors
  for (const [key, value] of Object.entries(colors)) {
    if (value && !isValidHexColor(value)) {
      return {
        data: null,
        error: `Invalid ${key} format. Use hex format like #7C3AED`,
      }
    }
  }

  return upsertTenantBranding(colors)
}

/**
 * Update logo URLs
 */
export async function updateBrandingLogos(logos: {
  logo_url?: string | null
  logo_dark_url?: string | null
  favicon_url?: string | null
  email_logo_url?: string | null
  portal_logo_url?: string | null
}): Promise<BrandingResult> {
  // Basic URL validation
  for (const [key, value] of Object.entries(logos)) {
    if (value && !isValidUrl(value)) {
      return { data: null, error: `Invalid URL for ${key}` }
    }
  }

  return upsertTenantBranding(logos)
}

/**
 * Update typography settings
 */
export async function updateBrandingTypography(typography: {
  font_family?: string
  heading_font_family?: string | null
}): Promise<BrandingResult> {
  return upsertTenantBranding(typography)
}

/**
 * Update custom CSS
 */
export async function updateBrandingCustomCss(
  custom_css: string | null
): Promise<BrandingResult> {
  // Basic CSS validation - check for potentially dangerous patterns
  if (custom_css) {
    const dangerousPatterns = [
      'javascript:',
      'expression(',
      'url(',
      '@import',
      'behavior:',
    ]
    const lowerCss = custom_css.toLowerCase()
    for (const pattern of dangerousPatterns) {
      if (lowerCss.includes(pattern)) {
        return {
          data: null,
          error: `Custom CSS contains disallowed pattern: ${pattern}`,
        }
      }
    }
  }

  return upsertTenantBranding({ custom_css })
}

/**
 * Update email branding
 */
export async function updateEmailBranding(email: {
  email_header_html?: string | null
  email_footer_html?: string | null
  email_logo_url?: string | null
}): Promise<BrandingResult> {
  return upsertTenantBranding(email)
}

/**
 * Update portal branding
 */
export async function updatePortalBranding(portal: {
  portal_welcome_message?: string | null
  portal_logo_url?: string | null
}): Promise<BrandingResult> {
  return upsertTenantBranding(portal)
}

/**
 * Update white-label settings
 * Note: hide_powered_by may require subscription tier check
 */
export async function updateWhiteLabelSettings(settings: {
  hide_powered_by?: boolean
  custom_domain?: string | null
}): Promise<BrandingResult> {
  // TODO: Check subscription tier for hide_powered_by
  // For now, allow all settings

  if (settings.custom_domain) {
    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i
    if (!domainRegex.test(settings.custom_domain)) {
      return { data: null, error: 'Invalid custom domain format' }
    }
  }

  return upsertTenantBranding(settings)
}

/**
 * Reset branding to platform defaults
 */
export async function resetBrandingToDefaults(): Promise<BrandingResult> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { data: null, error: 'No organization context' }
  }

  // Delete the branding record - the app will use platform defaults
  const { error } = await supabase
    .from('tenant_branding')
    .delete()
    .eq('organization_id', organizationId)

  if (error) {
    return { data: null, error: error.message }
  }

  // Revalidate affected pages
  revalidatePath('/admin')
  revalidatePath('/admin/setup/organization')

  return { data: null, error: null }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Get branding with platform defaults applied
 * Useful for components that need complete branding config
 */
export async function getTenantBrandingWithDefaults(): Promise<{
  branding: TenantBranding | null
  effectiveBranding: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    logoUrl: string | null
    logoDarkUrl: string | null
    faviconUrl: string | null
    fontFamily: string
    headingFontFamily: string | null
    customCss: string | null
    hidePoweredBy: boolean
  }
  error: string | null
}> {
  const { data: branding, error } = await getTenantBranding()

  // Platform defaults
  const defaults = {
    primaryColor: '#7C3AED',
    secondaryColor: '#F59E0B',
    accentColor: '#10B981',
    logoUrl: null,
    logoDarkUrl: null,
    faviconUrl: null,
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: null,
    customCss: null,
    hidePoweredBy: false,
  }

  if (error) {
    return { branding: null, effectiveBranding: defaults, error }
  }

  // Merge with defaults
  const effectiveBranding = {
    primaryColor: branding?.primary_color || defaults.primaryColor,
    secondaryColor: branding?.secondary_color || defaults.secondaryColor,
    accentColor: branding?.accent_color || defaults.accentColor,
    logoUrl: branding?.logo_url || defaults.logoUrl,
    logoDarkUrl: branding?.logo_dark_url || defaults.logoDarkUrl,
    faviconUrl: branding?.favicon_url || defaults.faviconUrl,
    fontFamily: branding?.font_family || defaults.fontFamily,
    headingFontFamily:
      branding?.heading_font_family || defaults.headingFontFamily,
    customCss: branding?.custom_css || defaults.customCss,
    hidePoweredBy: branding?.hide_powered_by ?? defaults.hidePoweredBy,
  }

  return { branding, effectiveBranding, error: null }
}
