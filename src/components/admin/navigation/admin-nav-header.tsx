'use client'

/**
 * AdminNavHeader
 *
 * Desktop navigation header with logo, object tabs, tools menu, and user menu.
 * Receives SerializableNavigationConfig - icons are resolved in child components.
 */

import Link from 'next/link'
import { NavTabs } from './nav-tabs'
import { ToolsMenu } from './tools-menu'
import { UserMenu } from './user-menu'
import type { SerializableNavigationConfig } from '@/lib/admin-navigation'

interface AdminNavHeaderProps {
  config: SerializableNavigationConfig
  userRole: string | null
}

export function AdminNavHeader({ config, userRole }: AdminNavHeaderProps) {
  return (
    <>
      {/* Logo & Brand - Hidden on mobile (shown in mobile nav) */}
      <div className="hidden lg:flex lg:items-center lg:gap-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-serif text-xl font-bold text-foreground hover:text-primary transition-colors"
        >
          {config.brandLogoUrl ? (
            <img
              src={config.brandLogoUrl}
              alt={config.brandName}
              className="h-8 w-auto"
            />
          ) : (
            <span>{config.brandName}</span>
          )}
        </Link>

        {/* Object Tabs */}
        <NavTabs items={config.primaryTabs} />
      </div>

      {/* Right side actions - Hidden on mobile */}
      <div className="hidden lg:flex lg:items-center lg:gap-2">
        {/* Tools Menu */}
        <ToolsMenu items={config.toolsMenu} />

        {/* User Menu */}
        <UserMenu
          adminItems={config.adminMenu}
          brandName={config.brandName}
          userRole={userRole}
        />
      </div>

      {/* Mobile: Just show brand name in center */}
      <div className="flex-1 lg:hidden">
        <Link
          href="/admin"
          className="block text-center font-serif text-lg font-bold text-foreground"
        >
          {config.brandName}
        </Link>
      </div>

      {/* Mobile: Placeholder for right side to balance layout */}
      <div className="w-11 lg:hidden" aria-hidden="true" />
    </>
  )
}
