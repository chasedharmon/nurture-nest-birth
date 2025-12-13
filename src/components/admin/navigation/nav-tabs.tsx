'use client'

/**
 * NavTabs
 *
 * Horizontal tabs for CRM object navigation (Accounts, Contacts, etc.)
 * Icons are looked up client-side using getIconComponent().
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buildUrlWithPreservedParams } from '@/lib/navigation-utils'
import {
  type SerializableNavItem,
  getIconComponent,
} from '@/lib/admin-navigation'

interface NavTabsProps {
  items: SerializableNavItem[]
}

export function NavTabs({ items }: NavTabsProps) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {items.map(item => {
        const Icon = getIconComponent(item.icon)
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)

        // Build href with preserved params for list views
        const href = buildUrlWithPreservedParams(item.href)

        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
