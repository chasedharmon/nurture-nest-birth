/**
 * Platform Utilities Index
 *
 * Re-exports all platform-related utilities for convenient imports.
 * These utilities support the multi-tenant SaaS architecture.
 *
 * @example
 * import { getTenantContext, isPlatformAdmin } from '@/lib/platform'
 */

// Tenant context and resolution
export {
  getTenantContext,
  requireTenantContext,
  getCurrentOrganizationId,
  getCurrentOrganization,
  getCurrentUserRole,
  hasMinimumRole,
  resolveOrganizationFromSubdomain,
  parseSubdomain,
  getTenantDefaultSettings,
  getTenantDefaultBranding,
  type TenantContext,
  type TenantBranding,
  type TenantResolutionResult,
  type TenantResolutionError,
} from './tenant-context'

// Super admin utilities
export {
  isPlatformAdmin,
  requirePlatformAdmin,
  canBeGrantedPlatformAdmin,
  listTenants,
  getTenantDetails,
  getTenantUsage,
  suspendTenant,
  reactivateTenant,
  updateTenantTier,
  startImpersonation,
  endImpersonation,
  getImpersonationSession,
  grantPlatformAdmin,
  revokePlatformAdmin,
  listPlatformAdmins,
  getSuperAdminRoutePrefix,
  isSuperAdminRoute,
  type SuperAdminUser,
  type ImpersonationSession,
  type TenantListItem,
} from './super-admin'
