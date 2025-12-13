import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNavigation } from '@/components/admin/navigation'
import { getNavigationConfig } from '@/app/actions/navigation'
import { KeyboardShortcutsProvider } from '@/components/admin/keyboard-shortcuts-provider'
import {
  FALLBACK_NAV_DATA,
  type SerializableNavigationConfig,
} from '@/lib/admin-navigation'

/**
 * Admin Portal Layout
 *
 * Server Component layout that provides:
 * - Authentication check
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

  // Get user's role from team_members
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
  const navConfig = navResult.data ?? fallbackConfig

  return (
    <KeyboardShortcutsProvider>
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <AdminNavigation config={navConfig} userRole={userRole} />

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </KeyboardShortcutsProvider>
  )
}
