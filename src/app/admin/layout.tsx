import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNavigation } from '@/components/admin/navigation'
import { getNavigationConfig } from '@/app/actions/navigation'
import { KeyboardShortcutsProvider } from '@/components/admin/keyboard-shortcuts-provider'
import { OrganizationProvider } from '@/lib/hooks/use-organization'
import { getTenantContext } from '@/lib/platform/tenant-context'
import { TrialBanner } from '@/components/billing/trial-banner'
import { getTrialStatus } from '@/lib/trial/utils'
import { PWAProvider } from '@/components/pwa'
import {
  FALLBACK_NAV_DATA,
  type SerializableNavigationConfig,
} from '@/lib/admin-navigation'

/**
 * Admin Portal Layout
 *
 * Server Component layout that provides:
 * - Authentication check
 * - Organization context (server-side resolved, passed to client)
 * - Navigation configuration from database
 * - Consistent header/nav across all admin pages
 * - Keyboard shortcuts support
 *
 * IMPORTANT: Only passes SerializableNavigationConfig to client components.
 * React components (like LucideIcon) cannot be serialized server → client.
 * Client components use getIconComponent() to look up icons by name.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Resolve tenant context (organization + membership)
  const tenantResult = await getTenantContext()

  if (!tenantResult.success) {
    // Handle tenant resolution errors
    if (tenantResult.redirectTo) {
      redirect(tenantResult.redirectTo)
    }
    // If no redirect specified, show error
    throw new Error(`Tenant context unavailable: ${tenantResult.error}`)
  }

  const { organization, membership } = tenantResult.context

  // Get user's role from team_members (for nav filtering)
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const userRole = teamMember?.role || null

  // Fetch navigation configuration (returns SerializableNavigationConfig)
  const navResult = await getNavigationConfig()

  if (!navResult.success) {
    // If navigation config fails, log it but continue with fallback
    console.error('Failed to load navigation config:', navResult.error)
  }

  // Fallback config (serializable - no React components)
  const fallbackConfig: SerializableNavigationConfig = {
    primaryTabs: FALLBACK_NAV_DATA.primaryTabs,
    toolsMenu: FALLBACK_NAV_DATA.toolsMenu,
    adminMenu: FALLBACK_NAV_DATA.adminMenu,
    brandName: FALLBACK_NAV_DATA.brandName,
    brandLogoUrl: FALLBACK_NAV_DATA.brandLogoUrl,
    unreadMessages: FALLBACK_NAV_DATA.unreadMessages,
  }

  // Use fallback config if data is null
  // Override brand name with organization name
  const navConfig = {
    ...(navResult.data ?? fallbackConfig),
    brandName: organization.name,
    brandLogoUrl: organization.logo_url || null,
  }

  // Calculate trial status for banner
  const trialStatus = getTrialStatus(organization)

  return (
    <PWAProvider showInstallPrompt={true} showUpdateBanner={true}>
      <OrganizationProvider
        initialOrganization={organization}
        initialMembership={membership}
      >
        <KeyboardShortcutsProvider>
          <div className="min-h-screen bg-background">
            {/* Navigation Header */}
            <AdminNavigation config={navConfig} userRole={userRole} />

            {/* Trial Banner - shows for trialing organizations */}
            {trialStatus.isTrialing && (
              <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                <TrialBanner trialStatus={trialStatus} />
              </div>
            )}

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </KeyboardShortcutsProvider>
      </OrganizationProvider>
    </PWAProvider>
  )
}
